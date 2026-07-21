import os
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Literal, List
from pypdf import PdfReader
from google import genai
from google.genai import types
from concurrent.futures import ThreadPoolExecutor

# Project configurations
from supabase_client import supabase, supabase_admin
from deps import get_current_user, require_role

router = APIRouter(prefix="/ai", tags=["ai-processing"])

# ---- Validation Schemas ----
class SupportItem(BaseModel):
    title: str = Field(description="Concise title for this specific issue or installation guide.")
    category: Literal['hardware', 'network', 'software', 'printers', 'security']
    problem: str = Field(description="The specific error symptom or installation request.")
    probable_causes: str = Field(description="Bullet points detailing what causes this specific issue.")
    possible_solutions: str = Field(description="Numbered step-by-step resolution paths.")

class StructuredDocumentationList(BaseModel):
    articles: List[SupportItem] = Field(description="List of all unique support guides found.")

ai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ---- Concurrent Vector Worker ----
def process_and_save_article(article: SupportItem) -> bool:
    """Worker task that handles embedding creation and inserts data in parallel. Returns True if success."""
    compiled_content = (
        f"Problem: {article.problem}\n"
        f"Probable Causes:\n{article.probable_causes}\n"
        f"Possible Solutions:\n{article.possible_solutions}"
    )
    try:
        response = ai_client.models.embed_content(
            model="gemini-embedding-2",
            contents=compiled_content,
            config={"output_dimensionality": 768}
        )
        embedding_vector = response.embeddings[0].values
        
        payload = {
            "title": article.title,
            "content": compiled_content,
            "category": article.category,
            "embedding": embedding_vector
        }
        supabase.table("official_documentation").insert(payload).execute()
        return True
    except Exception as worker_error:
        print(f"[Async Process Error] Failed on item '{article.title}': {str(worker_error)}")
        return False

# ---- Asynchronous Background Engine ----
def pipeline_processing_task(extracted_pages: List[str], job_id: str, filename: str):
    """Background task implementing sliding windows, tracking progress updates in Supabase."""
    print(f"[BACKGROUND TASK START] Job ID: {job_id} for File: {filename}")
    
    page_window_size = 3
    prompt = (
        "You are an elite knowledge base architect. Analyze the provided text from an IT support technical log fragment. "
        "Identify and extract EVERY unique guide, problem description, or installation sequence into a structured format."
    )
    
    extracted_articles = []
    
    try:
        # Loop through pages with our sliding chunk window
        for i in range(0, len(extracted_pages), page_window_size):
            chunk_text = "\n".join(extracted_pages[i:i + page_window_size]).strip()
            if not chunk_text:
                continue
                
            try:
                completion = ai_client.models.generate_content(
                    model='gemini-3.5-flash',
                    contents=f"{prompt}\n\n[Text Segment Block]:\n{chunk_text}",
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=StructuredDocumentationList,
                        temperature=0.1
                    )
                )
                data_batch = StructuredDocumentationList.model_validate_json(completion.text)
                extracted_articles.extend(data_batch.articles)
            except Exception as chunk_err:
                print(f"[Chunk Warning] Failed processing page indices {i}-{i+page_window_size}: {str(chunk_err)}")

        if not extracted_articles:
            # Complete task early if nothing relevant could be structured
            supabase.table("ingestion_jobs").update({
                "status": "completed",
                "total_articles_indexed": 0
            }).eq("id", job_id).execute()
            return

        # Concurrency Layer: Mass upload vector components
        success_count = 0
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = executor.map(process_and_save_article, extracted_articles)
            success_count = sum(1 for r in results if r)

        # Mark job tracking status as fully complete
        supabase.table("ingestion_jobs").update({
            "status": "completed",
            "total_articles_indexed": success_count
        }).eq("id", job_id).execute()
        
        print(f"[BACKGROUND TASK COMPLETE] Job ID: {job_id} successfully mapped.")

    except Exception as fatal_error:
        # Graceful capture: update tracking layout to failed so frontend knows what happened
        print(f"[BACKGROUND TASK FATAL ERROR] {str(fatal_error)}")
        supabase.table("ingestion_jobs").update({
            "status": "failed",
            "error_message": str(fatal_error)
        }).eq("id", job_id).execute()

# ---- Endpoint A: PDF Upload (Trigger) ----
@router.post("/upload-pdf", status_code=202)
async def upload_pdf_document(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a multi-page PDF document. Returns a job tracking UUID instantly 
    and spins up parsing configurations asynchronously.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF documents (.pdf) are supported.")

    try:
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        
        extracted_pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_pages.append(text)
                
        if not extracted_pages:
            raise HTTPException(status_code=400, detail="The target PDF contains no indexable text layers.")
            
    except HTTPException:
        raise
    except Exception as parse_err:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF data: {str(parse_err)}")

    # 1. Initialize the Tracking Job row inside Supabase
    try:
        job_init = supabase.table("ingestion_jobs").insert({
            "filename": file.filename,
            "status": "processing"
        }).execute()
        
        job_record = job_init.data[0]
        job_id = job_record["id"]
    except Exception as db_err:
        raise HTTPException(status_code=500, detail=f"Failed to initialize job tracking matrix: {str(db_err)}")

    # 2. Assign the engine worker script task to execute in the background
    background_tasks.add_task(pipeline_processing_task, extracted_pages, job_id, file.filename)

    # Return tracking status payload immediately
    return {
        "message": "File accepted. Processing has started in the background.",
        "job_id": job_id,
        "filename": file.filename,
        "status": "processing",
        "check_status_url": f"/ai/upload-status/{job_id}"
    }

# ---- Endpoint C: Download Extracted Database ----
@router.get("/download-database")
def download_knowledge_base(current_user = Depends(get_current_user)):
    """Downloads all manually injected files or vector DB contents"""
    # Requires Admin clearance
    if current_user["profile"]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    result = supabase.table("official_documentation").select("title, category, content").execute()
    return {"records": result.data}

# ---- Endpoint D: Supervisor Approval Workflow ----
@router.post("/publish-ticket/{ticket_id}", dependencies=[Depends(require_role("supervisor", "admin"))])
def publish_resolved_ticket(ticket_id: int):
    """
    Supervisor verifies a technician's resolution notes and publishes them into the AI Knowledge Base.
    """
    ticket_res = supabase_admin.table("tickets").select("*").eq("id", ticket_id).single().execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket = ticket_res.data
    if ticket.get("kb_published") == "approved":
        return {"message": "Ticket is already published to the Knowledge Base."}
        
    # Generate Embedding for AI
    compiled_text = (
        f"Ticket Title: {ticket['title']}\n"
        f"Category: {ticket['category']}\n"
        f"Resolution Notes:\n{ticket['resolution_notes']}"
    )
    
    try:
        response = ai_client.models.embed_content(
            model="gemini-embedding-2",
            contents=compiled_text,
            config={"output_dimensionality": 768}
        )
        embedding_vector = response.embeddings[0].values
        
        # Insert into solved_tickets
        supabase_admin.table("solved_tickets").insert({
            "ticket_id": ticket_id,
            "searchable_text": compiled_text,
            "embedding": embedding_vector
        }).execute()
        
        # Mark ticket as approved
        supabase_admin.table("tickets").update({
            "kb_published": "approved"
        }).eq("id", ticket_id).execute()
        
        return {"message": "Ticket resolution published to AI Knowledge Base successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish ticket to AI: {str(e)}")

@router.post("/reject-ticket/{ticket_id}", dependencies=[Depends(require_role("supervisor", "admin"))])
def reject_resolved_ticket(ticket_id: int):
    """
    Supervisor rejects a technician's resolution notes from entering the AI Knowledge Base.
    """
    supabase_admin.table("tickets").update({
        "kb_published": "rejected"
    }).eq("id", ticket_id).execute()
    
    return {"message": "Ticket resolution rejected from AI Knowledge Base."}

@router.get("/ingestion-jobs", dependencies=[Depends(require_role("admin"))])
def get_ingestion_jobs():
    """
    Returns the list of background ingestion jobs for the Admin panel.
    """
    res = supabase_admin.table("ingestion_jobs").select("*").order("created_at", desc=True).execute()
    return res.data

# ---- Endpoint B: Status Polling ----
@router.get("/upload-status/{job_id}")
def get_upload_status(job_id: str, current_user = Depends(get_current_user)):
    """
    Poll this endpoint using the job_id tracking UUID to monitor background ingestion progress.
    """
    try:
        result = supabase.table("ingestion_jobs").select("*").eq("id", job_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Ingestion job record not found.")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database lookup error: {str(e)}")