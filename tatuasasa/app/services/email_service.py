import os
import smtplib
from email.message import EmailMessage

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

def send_email(to_email: str, subject: str, body: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"Skipping email to {to_email} (missing SMTP credentials)")
        return
        
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = f"Tatuasasa IT <{SMTP_USERNAME}>"
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_assignment_notification(tech_email: str, tech_name: str, ticket_id: int, ticket_title: str):
    subject = f"New Ticket Assigned: #{ticket_id}"
    body = f"""Hi {tech_name},

A new ticket has been assigned to you.

Ticket #{ticket_id}: {ticket_title}

Please log in to the Technician Dashboard to view details and begin working on the issue.

Thank you,
Tatuasasa IT Support
"""
    send_email(tech_email, subject, body)

def send_completion_notification(staff_email: str, staff_name: str, ticket_id: int, ticket_title: str):
    subject = f"Your Ticket has been Completed: #{ticket_id}"
    body = f"""Hi {staff_name},

Good news! Your ticket has been marked as completed by the technician.

Ticket #{ticket_id}: {ticket_title}

Please log in to your dashboard to review the resolution notes and confirm everything is working properly.

Thank you,
Tatuasasa IT Support
"""
    send_email(staff_email, subject, body)
