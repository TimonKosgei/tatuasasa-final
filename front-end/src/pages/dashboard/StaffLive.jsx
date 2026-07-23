import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { apiFetch } from '../../config/api';
import { playNotificationSound } from '../../utils/sound';
import './stafflive.css';

export default function StaffLivePopup({ ticket, onClose }) {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');

  // --- Chat States ---
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Fetch current user
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.full_name || user.email.split('@')[0]);
      }
    };
    initializeChat();
  }, []);

  // 2. Auto-scroll to bottom when a new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 3. Fetch chat history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!ticket) return;
      setLoadingMessages(true);
      try {
        const history = await apiFetch(
          `/tickets/${ticket.id}/messages`,
          {},
          'Failed to load chat history'
        );
        setMessages(history || []);
        // Mark as read when we open the chat
        if (history && history.length > 0) {
          apiFetch(`/tickets/${ticket.id}/messages/read`, { method: 'PUT' }).catch(console.error);
        }
      } catch (err) {
        console.error('Error loading chat history:', err.message);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchHistory();
  }, [ticket]);

  // 4. Realtime subscription
  useEffect(() => {
    if (!ticket || !userId) return;

    const channel = supabase
      .channel(`ticket_messages:${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            if (payload.new.sender_id !== userId) {
              playNotificationSound();
              apiFetch(`/tickets/${ticket.id}/messages/read`, { method: 'PUT' }).catch(console.error);
            }
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket, userId]);

  // 5. Handle sending a real message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !ticket) return;

    const currentText = messageText;
    const tempId = `temp-${Date.now()}`;

    const tempMessage = {
      id: tempId,
      body: currentText,
      sender_id: userId,
      sender_role: 'staff',
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');

    try {
      const sentMessage = await apiFetch(`/tickets/${ticket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: currentText }),
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg))
      );
    } catch (err) {
      console.error('Failed to send message:', err.message);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    }
  };

  if (!ticket) return null;

  return (
    <div className="chat-popup-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="officer-avatar" style={{ width: '35px', height: '35px', fontSize: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
            {ticket.title ? ticket.title.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>{ticket.technician_name || 'Technician'}</h3>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>Ticket: {ticket.title}</span>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="chat-messages">
        {loadingMessages ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            const technicianName = ticket.technician_name || 'Technician';
            const staffName = userName || 'Me';
            const avatarChar = isMine ? staffName.charAt(0).toUpperCase() : technicianName.charAt(0).toUpperCase();

            return (
              <div key={msg.id} className={`message-row ${isMine ? 'sent' : 'received'}`}>
                {!isMine && (
                  <div className="chat-avatar" title={technicianName}>
                    {avatarChar}
                  </div>
                )}
                <div className="message-wrapper">
                  <div className="message-bubble">{msg.body}</div>
                  <div className="message-meta">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && msg.status === 'sent' && (
                      <span className="delivered-icon" title="Sent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    )}
                    {isMine && msg.status === 'read' && (
                      <span className="delivered-icon" title="Read" style={{ display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#60a5fa' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#60a5fa', marginLeft: '-8px' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    )}
                    {isMine && msg.status === 'sending' && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>...</span>
                    )}
                    {isMine && msg.status === 'failed' && (
                      <span style={{ fontSize: '11px', color: '#fca5a5' }}>Failed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (messageText.trim()) handleSendMessage(e);
            }
          }}
          rows={1}
        />
        <button type="submit" className="send-btn" disabled={!messageText.trim()} aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px) translateY(1px)' }}>
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
