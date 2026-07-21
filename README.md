# Tatua Sasa - AI-Powered IT Service Management System

Tatua Sasa is a comprehensive, multi-tiered Helpdesk and IT Service Management (ITSM) system built to streamline how internal staff report technical issues, how technicians resolve them, and how supervisors manage the workforce. It integrates an intelligent AI Knowledge Base using Vector Search to automatically assist technicians based on past resolutions.

## Architecture & Technology Stack

Tatua Sasa follows a decoupled client-server architecture:

- **Frontend (`/front-end`)**: React, Vite, and standard CSS.
- **Backend (`/tatuasasa`)**: Python with FastAPI.
- **Database & Auth**: Supabase (PostgreSQL with `pgvector` for AI embeddings).
- **AI & RAG Engine**: Integrated AI routes (using Google Gemini) for answering technician queries based on historical ticket resolution context.

---

## Role-Based Architecture

The system supports four primary access tiers, each with a distinct dashboard and capabilities:

### 1. Staff (`StaffDashboard`)
The entry-level role for general organization employees.
- **Ticketing**: Can submit new IT tickets (specifying category, priority, building, floor, room, and a detailed description).
- **Live Communication**: Can open a real-time chat with the technician assigned to their ticket to provide more details or attachments.
- **Progression**: Can apply to become an ICT Officer (Technician) via the settings panel, which sends an approval request to a selected Supervisor.

### 2. Technician (`TechnicianDashboard`)
The workforce responsible for diagnosing and fixing issues.
- **Queue Management**: Can view available, unassigned tickets and "Accept" them to begin work.
- **Ticket Workflows**: Technicians can Reject, Escalate, or Mark a ticket as Resolved.
- **Tatua Sasa AI Integration**: Before resolving an issue, technicians can ask the integrated AI for troubleshooting steps. The AI cross-references the linked hardware's `asset_tag` against the Knowledge Base to provide exact, context-aware fixes.
- **Knowledge Base Contribution**: When resolving an issue, technicians outline the steps taken. They can either "Save" the ticket or request to "Publish" it to the Knowledge Base, sending it to their Supervisor for review.

### 3. Supervisor (`SupervisorDashboard`)
The managerial role responsible for overseeing a department's technicians and maintaining the quality of the Knowledge Base.
- **Workforce Management**: Supervisors approve or reject Staff applications to become ICT Officers.
- **Ticket Governance**: They can view all escalated tickets and manually resolve or reassign them to specific technicians.
- **AI Knowledge Base Moderation**: Supervisors review "Resolution Notes" submitted by technicians. If approved, the system generates a vector embedding of the fix and pushes it to the `solved_tickets` database, allowing the AI to learn from the resolution.

### 4. Admin (`AdminDashboard`)
The system administrators who govern the platform globally.
- **Live Queue Monitoring**: Full bird's-eye view of all incoming tickets across the organization.
- **User Management**: Admins can search the directory and force-promote or demote any user's role (Staff <-> Technician <-> Supervisor <-> Admin).
- **Asset & Catalog Management**: They manage the list of valid hardware assets, buildings, offices, and ticket categories that populate the system dropdowns.

---

## The AI Knowledge Base (KB) Workflow

The crown jewel of Tatua Sasa is the self-improving AI troubleshooting engine. Here is how it works:

1. **Resolution**: A Technician fixes a broken printer (Asset: `AST-PRN-001`) by replacing the drum unit. They write the steps and click **Publish Article**.
2. **Review**: The ticket enters the Supervisor's "Pending KB Approvals" queue. The Supervisor reads the steps and clicks **Approve & Publish**.
3. **Embedding**: The FastAPI backend takes the ticket title, description, and resolution notes, feeds them to an embedding model, and saves the resulting vector into the `solved_tickets` pgvector table.
4. **Retrieval (RAG)**: A month later, another printer breaks. A new technician opens the ticket, links `AST-PRN-001`, and clicks **Ask Tatua Sasa AI**. 
5. **Synthesis**: The AI backend searches the vector DB for similar issues *and* explicitly pulls the direct maintenance history for `AST-PRN-001`. The AI replies: *"This printer had its drum unit replaced recently. Since the issue is happening again, check the fuser assembly instead."*

---

## Local Development & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Supabase Project (with `pgvector` enabled)

### Backend Setup
1. Navigate to the backend folder: `cd tatuasasa`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Configure Environment: Add your Supabase keys and Gemini API keys to `.env`.
6. Run the server: `uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the frontend folder: `cd front-end`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

---

## Notable Features & UX
- **Real-time syncing**: Leveraging Supabase realtime channels, chat messages between staff and technicians appear instantly without page reloads.
- **Immediate Feedback**: The UI uses optimistic locking and loading states across all dashboards to ensure users know exactly when an action is processing.
- **Secure Architecture**: Route protection ensures Staff cannot access Technician routes, and role manipulation is strictly isolated to Admins.
