# Tatua Sasa: System Architecture and Testing Guide

This document provides an in-depth look at how the entire Tatua Sasa platform operates internally, the flow of data across the stack, and a comprehensive step-by-step testing guide to verify all functionalities.

---

## 1. System Operations Overview

Tatua Sasa operates on a reactive, event-driven model primarily facilitated by **Supabase Realtime** on the frontend, and a highly synchronous REST API on the backend. 

### Data Flow & State Management
- **Client Side (React)**: State is managed locally at the component level. The UI relies on `useEffect` hooks and `apiFetch` calls to hydrate initial states (e.g., ticket queues). 
- **Real-time Synchronization**: The `ticket_messages` table and the live `tickets` queue are subscribed to via Supabase WebSocket channels. This allows instant updates when a staff member sends a message or when a ticket changes status (e.g., from `open` to `in_progress`).
- **Backend Constraints**: The FastAPI backend manages the heavier logic: pushing to the AI endpoints (Gemini), generating vector embeddings (`pgvector`), and sending raw SQL commands when complex queries are needed.

---

## 2. End-to-End Core Workflows

### Workflow A: The Ticketing Lifecycle
1. **Creation**: A Staff member submits a ticket via `/tickets` (POST). The record is saved in PostgreSQL with status `open`.
2. **Acceptance**: A Technician in the `TechnicianDashboard` sees the new ticket and clicks **Accept**. A `PATCH` to `/tickets/{id}/status` changes the status to `in_progress`.
3. **Communication**: Real-time chat bubbles up via the `ticket_messages` table.
4. **Resolution**: The Technician marks the ticket as resolved, specifying the steps taken and explicitly tagging the hardware asset (e.g., `AST-LPT-04`). The ticket status changes to `resolved`.

### Workflow B: The Knowledge Base (KB) Loop
1. **Submission**: If the Technician clicks **Publish Article**, the `publish_requested` flag on the ticket is set to `true`.
2. **Approval**: The Supervisor sees the ticket in their **Pending AI Knowledge Base Approvals** queue. 
3. **Embedding Generation**: The Supervisor clicks **Approve & Publish**. The backend (`/ai/publish-ticket/{id}`) grabs the `title`, `description`, and `resolution_notes`, bundles them into a text block, and uses an embedding model to convert the text into a dense vector array.
4. **Storage**: The vector array is saved to the `solved_tickets` table via Supabase `pgvector`.
5. **AI Retrieval**: In future tickets, when a technician clicks **Ask Tatua Sasa AI**, the system matches their query against the vectors in `solved_tickets` *and* pulls the last 5 resolutions directly linked to the specific asset tag to inject into the LLM's prompt.

### Workflow C: Role Escalation
1. **Application**: A Staff member applies to be an ICT Officer. A record is created linking their request to a specific Supervisor.
2. **Approval**: The Supervisor approves the request via the dashboard. The backend updates the user's `role` to `technician` in the `profiles` table.
3. **Session Update**: The user logs out and logs back in to receive their new JWT claims reflecting the `technician` tier.

---

## 3. Comprehensive Testing Guide

To ensure the entire platform is functioning, perform the following end-to-end tests.

### Test 1: Authentication & Role Integrity
1. **Sign Up**: Create a new account. You should default to the **Staff** dashboard.
2. **Admin Override**: Log in as an Admin. Go to User Management, find the new account, and change their role to `supervisor`.
3. **Verify Access**: Log in as the new account. Verify that the UI routes you to the **Supervisor** dashboard and prevents access to `/staff` or `/admin` routes.

### Test 2: The Ticket Funnel
1. **Create a Ticket (Staff)**: As a Staff member, create a ticket titled "Router offline in Annex".
2. **Live Queue Check (Admin)**: Log in as an Admin and verify the ticket immediately appears in the Live Queue overview.
3. **Accept Ticket (Technician)**: Log in as a Technician. Find the "Router offline" ticket and click **Accept**.
4. **Real-time Chat**: 
   - Open the chat as the Technician and send a message. 
   - Switch to the Staff account and verify the message appears instantly without refreshing the page. Send a reply.
   - Switch back to the Technician and ensure the reply arrived.

### Test 3: The AI Knowledge Base Pipeline
1. **Resolve and Publish (Technician)**: 
   - As the Technician, link an asset (e.g., `AST-NET-01`) to the ticket.
   - Fill out the resolution steps: "Replaced the power adapter."
   - Click **Publish Article**.
2. **Approve (Supervisor)**: 
   - Log in as the Supervisor. 
   - Navigate to "Pending AI Knowledge Base Approvals". 
   - Approve the ticket.
3. **Verify AI Query (Technician)**:
   - As a Technician, accept a *new* ticket. 
   - Select the *same* asset tag (`AST-NET-01`).
   - Click **Ask Tatua Sasa AI** and ask: "How do I fix this router?"
   - **Expected Result**: The AI should specifically mention that the power adapter was recently replaced on this exact device based on the ingested context.

### Test 4: UI & UX Feedback
1. **Button Locking**: While clicking *Submit*, *Accept*, *Resolve*, or *Publish*, ensure the button text changes (e.g., "Publishing...") and becomes unclickable to prevent duplicate API requests.
2. **Network Resilience**: Turn off your internet/server temporarily, attempt to save a profile update, and ensure the UI unlocks the button and displays a clear error message.

### Test 5: Supervisor Manual Controls
1. **Reassignment**: As a Supervisor, go to the Escalated Tickets tab. Use the dropdown to assign an unassigned ticket to a specific Technician.
2. **Manual Resolution**: Force-resolve an escalated ticket directly from the Supervisor panel and verify it disappears from the active queue.

---

## 4. Database Schema Reference

- **`profiles`**: Holds user metadata, current `role`, offline/online `status`, and `office_id`.
- **`tickets`**: The core operational table. Tracks `status`, `assigned_to`, `asset_id`, `priority`, and timestamps.
- **`ticket_messages`**: Relational table linking `ticket_id` to chat threads.
- **`solved_tickets`**: The `pgvector` knowledge base. Contains the `content` (text) and `embedding` (vector array) used for RAG searches.
- **`assets`**: Inventory table mapping `asset_tag` to locations and types.
