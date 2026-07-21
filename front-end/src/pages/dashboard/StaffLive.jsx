import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/SupabaseClient';
import { apiFetch } from '../../config/api';
import { playNotificationSound } from '../../utils/sound';
import './stafflive.css';

export default function StaffLive() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');

  // --- Data States ---
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // --- Chat States ---
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Fetch current user and tickets that have a technician assigned
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.full_name || user.email.split('@')[0]);
      }

      try {
        const data = await apiFetch('/tickets/mine', {}, 'Failed to load tickets');
        // Only tickets with a technician assigned can be chatted about
        const chattable = (data || []).filter((t) => t.assigned_to);
        setTickets(chattable);
      } catch (err) {
        console.error('Error fetching tickets:', err.message);
      } finally {
        setLoadingTickets(false);
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

  // 3. Realtime subscription for the selected ticket's messages
  useEffect(() => {
    if (!selectedTicket || !userId) return;

    const channel = supabase
      .channel(`ticket_messages:${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            if (payload.new.sender_id !== userId) {
              playNotificationSound();
            }
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, userId]);

  // 4. Filter tickets based on search input (by title)
  const filteredTickets = tickets.filter((t) =>
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 5. Handle selecting a ticket and loading its message history
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);

    try {
      const history = await apiFetch(
        `/tickets/${ticket.id}/messages`,
        {},
        'Failed to load chat history'
      );
      setMessages(history || []);
    } catch (err) {
      console.error('Error loading chat history:', err.message);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 6. Handle sending a real message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTicket) return;

    const currentText = messageText;
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI update: show the message instantly before server confirms
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
      const sentMessage = await apiFetch(`/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: currentText }),
      });

      // Swap the temp bubble for the confirmed one (Realtime may also deliver
      // this same row — the dedupe check in the subscription handler above
      // prevents it from being added twice).
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...sentMessage, status: 'delivered' } : msg))
      );
    } catch (err) {
      console.error('Failed to send message:', err.message);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    }
  };

  return (
    <div className="live-comm-container">
      {!selectedTicket ? (
        /* --- SELECTION SCREEN --- */
        <div className="selection-screen">
          <h2 className="welcome-text">
            Welcome {userName ? userName.split(' ')[0] : 'User'},<br />
            which ticket would you like to discuss today?
          </h2>

          <div className="search-wrapper">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search your tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="officer-list-container">
            {loadingTickets ? (
              <div className="no-results">Loading your tickets...</div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="officer-item" onClick={() => handleSelectTicket(ticket)}>
                  <div className="officer-avatar">
                    {ticket.title ? ticket.title.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="officer-details">
                    <h4>{ticket.title}</h4>
                    <p>{ticket.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div className="no-results">
                No active conversations yet. Once a technician is assigned to one of your tickets, you can chat with them here.
              </div>
            ) : (
              <div className="no-results">No tickets found matching "{searchQuery}"</div>
            )}
          </div>
        </div>
      ) : (
        /* --- CHAT SCREEN --- */
        <div className="chat-screen">
          <div className="chat-header">
            <button className="back-btn" onClick={() => setSelectedTicket(null)} aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="chat-header-info">
              <div className="officer-avatar" style={{ width: '35px', height: '35px', fontSize: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                {selectedTicket.title ? selectedTicket.title.charAt(0).toUpperCase() : 'T'}
              </div>
              <div>
                <h3>{selectedTicket.title}</h3>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>{selectedTicket.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
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
                return (
                  <div key={msg.id} className={`message-wrapper ${isMine ? 'sent' : 'received'}`}>
                    <div className="message-bubble">{msg.body}</div>
                    <div className="message-meta">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && msg.status === 'delivered' && (
                        <span className="delivered-icon" title="Delivered">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                            <polyline points="20 12 14 18"></polyline>
                          </svg>
                          <span style={{ marginLeft: '4px' }}>Delivered</span>
                        </span>
                      )}
                      {isMine && msg.status === 'sending' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sending...</span>
                      )}
                      {isMine && msg.status === 'failed' && (
                        <span style={{ fontSize: '11px', color: '#ef4444' }}>Failed to send</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
            />
            <button type="submit" className="send-btn" disabled={!messageText.trim()} aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-2px)' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
