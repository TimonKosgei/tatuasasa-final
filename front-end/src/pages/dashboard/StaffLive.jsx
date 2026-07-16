import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/SupabaseClient'; 
import { apiFetch } from '../../config/api'; 
import './stafflive.css';

export default function StaffLive() {
  const [userName, setUserName] = useState('');
  
  // --- Data States ---
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  
  // --- Chat States ---
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Fetch current user and the list of ICT officers on mount
  useEffect(() => {
    const initializeChat = async () => {
      // Get User Details
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email.split('@')[0]);
      }

      // Fetch Officers from backend
      try {
        const data = await apiFetch('/officers', {}, 'Failed to load officers');
        // Ensure they are sorted alphabetically by name
        const sortedData = (data || []).sort((a, b) => a.name.localeCompare(b.name));
        setOfficers(sortedData);
      } catch (err) {
        console.error("Error fetching officers:", err.message);
      } finally {
        setLoadingOfficers(false);
      }
    };

    initializeChat();
  }, []);

  // 2. Auto-scroll to bottom when a new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 3. Filter officers based on search input
  const filteredOfficers = officers.filter(officer =>
    (officer.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. Handle selecting an officer and loading their chat history
  const handleSelectOfficer = async (officer) => {
    setSelectedOfficer(officer);
    setLoadingMessages(true);
    
    try {
      // Fetch historical messages for this specific officer conversation
      const history = await apiFetch(`/chat/history?officer_id=${officer.id}`, {}, 'Failed to load chat history');
      setMessages(history || []);
    } catch (err) {
      console.error("Error loading chat history:", err.message);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 5. Handle sending a real message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const currentText = messageText;
    const tempId = Date.now();

    // Optimistic UI update: Show the message instantly before server confirms
    const tempMessage = {
      id: tempId,
      text: currentText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' 
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageText(''); // Clear input box instantly

    try {
      // Send to the backend
      const sentMessage = await apiFetch('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ 
          receiver_id: selectedOfficer.id, 
          text: currentText 
        })
      });

      // Update the temporary message with the real data and "delivered" status from the server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...sentMessage, status: 'delivered' } : msg
      ));
    } catch (err) {
      console.error("Failed to send message:", err.message);
      // Optionally handle failed state (e.g., mark bubble as failed/red)
    }
  };

  return (
    <div className="live-comm-container">
      {!selectedOfficer ? (
        /* --- SELECTION SCREEN --- */
        <div className="selection-screen">
          <h2 className="welcome-text">
            Welcome {userName ? userName.split(' ')[0] : 'User'},<br/>
            which ICT Officer would you like to communicate with today?
          </h2>

          <div className="search-wrapper">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search for an officer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="officer-list-container">
            {loadingOfficers ? (
              <div className="no-results">Loading available officers...</div>
            ) : filteredOfficers.length > 0 ? (
              filteredOfficers.map(officer => (
                <div key={officer.id} className="officer-item" onClick={() => handleSelectOfficer(officer)}>
                  <div className="officer-avatar">
                    {officer.name ? officer.name.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <div className="officer-details">
                    <h4>{officer.name}</h4>
                    <p>{officer.role || 'ICT Officer'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                No officers found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- CHAT SCREEN --- */
        <div className="chat-screen">
          <div className="chat-header">
            <button className="back-btn" onClick={() => setSelectedOfficer(null)} aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="chat-header-info">
              <div className="officer-avatar" style={{ width: '35px', height: '35px', fontSize: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                {selectedOfficer.name ? selectedOfficer.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <h3>{selectedOfficer.name}</h3>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Online</span>
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
              messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                  <div className="message-meta">
                    <span>{msg.time}</span>
                    {msg.sender === 'user' && msg.status === 'delivered' && (
                      <span className="delivered-icon" title="Delivered">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                          <polyline points="20 12 14 18"></polyline>
                        </svg>
                        <span style={{ marginLeft: '4px' }}>Delivered</span>
                      </span>
                    )}
                    {msg.sender === 'user' && msg.status === 'sending' && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sending...</span>
                    )}
                  </div>
                </div>
              ))
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