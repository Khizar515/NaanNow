import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import './BlockedTicketWidget.css';

const API_SERVER = 'http://localhost:5000';

function BlockedTicketWidget({ user }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [unbanStatus, setUnbanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');

  // Unread tracking state: { [ticketId]: timestampMs }
  const [lastReadMap, setLastReadMap] = useState(() => {
    try {
      const saved = localStorage.getItem('naannow_ticket_last_read');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Form states
  const [subject, setSubject] = useState('Account Unban Appeal Request');
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);

  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  const replyTextInputRef = useRef(null);
  const chatScrollRef = useRef(null);
  const activeTicketRef = useRef(null);

  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  const markTicketRead = (ticketId, chat = []) => {
    const latestTime = chat.length > 0
      ? new Date(chat[chat.length - 1].time).getTime()
      : Date.now();
    setLastReadMap(prev => {
      const updated = { ...prev, [ticketId]: Math.max(prev[ticketId] || 0, latestTime) };
      try { localStorage.setItem('naannow_ticket_last_read', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const getUnreadCount = (t) => {
    if (!t || !t.chat) return 0;
    const lastRead = lastReadMap[t._id] || 0;
    const unreadMsgs = t.chat.filter(m => m.sender === 'support' && new Date(m.time).getTime() > lastRead);
    return unreadMsgs.length;
  };

  const scrollChatToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  const scrollToFirstUnreadOrBottom = (ticket) => {
    setTimeout(() => {
      if (!chatScrollRef.current || !ticket || !ticket.chat) return;

      const lastRead = lastReadMap[ticket._id] || 0;
      const firstUnreadIdx = ticket.chat.findIndex(m => m.sender === 'support' && new Date(m.time).getTime() > lastRead);

      if (firstUnreadIdx !== -1) {
        const messageElements = chatScrollRef.current.querySelectorAll('.widget-message-bubble');
        if (messageElements && messageElements[firstUnreadIdx]) {
          messageElements[firstUnreadIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      scrollChatToBottom();
    }, 100);
  };

  const handleSelectTicket = (t) => {
    scrollToFirstUnreadOrBottom(t);
    setActiveTicket(t);
    markTicketRead(t._id, t.chat);
  };

  const fetchMyTickets = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const [data, statusData] = await Promise.all([
        api.getMyTickets(),
        api.getUnbanStatus().catch(() => null)
      ]);
      setTickets(data);
      if (statusData) setUnbanStatus(statusData);

      if (!isPoll) {
        const activeOrNewest = data.find(t => t.status !== 'closed') || data[0];
        if (activeOrNewest) {
          setActiveTicket(activeOrNewest);
          markTicketRead(activeOrNewest._id, activeOrNewest.chat);
          scrollToFirstUnreadOrBottom(activeOrNewest);
        }
      } else {
        const currentActive = activeTicketRef.current;
        if (currentActive) {
          const freshActive = data.find(t => t._id === currentActive._id);
          if (freshActive) {
            setActiveTicket(freshActive);
            if (freshActive.chat?.length !== currentActive.chat?.length) {
              const hasNewSupportMsg = freshActive.chat?.slice(currentActive.chat?.length || 0).some(m => m.sender === 'support');
              if (hasNewSupportMsg) {
                // Keep marked as read if current active ticket
                markTicketRead(freshActive._id, freshActive.chat);
              }
              setTimeout(scrollChatToBottom, 60);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      if (!isPoll) setError('Failed to load support ticket history.');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
    const interval = setInterval(() => {
      fetchMyTickets(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateUnbanTicket = async (e) => {
    e.preventDefault();
    if (!message.trim() && selectedFiles.length === 0) {
      setError('Please provide a message or attach documents explaining your request.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const newTicket = await api.createTicket(subject.trim(), message.trim(), 'unban', selectedFiles);
      setActiveTicket(newTicket);
      markTicketRead(newTicket._id, newTicket.chat);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchMyTickets();
      setMessage('');
      setTimeout(scrollChatToBottom, 100);
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!replyText.trim() && replyFiles.length === 0) || !activeTicket) return;
    const currentScrollY = window.scrollY; // Preserve page scroll position before async re-renders
    setError('');
    setSubmitting(true);

    try {
      const updated = await api.replyToTicket(activeTicket._id, replyText.trim(), '', replyFiles);
      setActiveTicket(updated);
      markTicketRead(updated._id, updated.chat);
      setReplyFiles([]);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
      await fetchMyTickets();
      setReplyText('');
      setTimeout(() => {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' });
        scrollChatToBottom();
        replyTextInputRef.current?.focus();
      }, 80);
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const isImageFile = (filename) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="bubble-attachments-grid" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {attachments.map((att, idx) => {
          const fullUrl = att.startsWith('http') ? att : `${API_SERVER}${att}`;
          const isImg = isImageFile(att);
          const fileName = att.split('/').pop();
          return (
            <div key={idx} className="attachment-item-card" style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
              {isImg && (
                <div style={{ marginBottom: '4px' }}>
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={fullUrl}
                      alt="Attachment Preview"
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                </div>
              )}
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                <span>📎 {fileName}</span>
                <a
                  href={fullUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-tandoori, #E57919)', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  Download File
                </a>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="blocked-widget-loading">Loading support ticket system...</div>;
  }

  const adminRemarksText = activeTicket?.closingUnbanRestriction?.adminRemarks || unbanStatus?.adminRemarks;

  const filteredTickets = tickets.filter(t => {
    if (!ticketSearch.trim()) return true;
    const query = ticketSearch.toLowerCase();
    return (t.ticketNumber || '').toLowerCase().includes(query) ||
      (t.subject || '').toLowerCase().includes(query);
  });

  return (
    <div className="blocked-ticket-widget">
      <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>🎫 In-App Support & Ticket System</h3>
          <p className="widget-subtitle">All communication regarding support and account status happens directly inside your ticket thread.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', opacity: 0.7, padding: '4px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.06)' }}>
            🟢 Live Updates
          </span>
        </div>
      </div>

      {error && <div className="widget-error-banner">⚠️ {error}</div>}

      {/* 2-COLUMN SIDEBAR LAYOUT */}
      <div className="widget-2col-container">
        
        {/* LEFT SIDEBAR: TICKET LIST */}
        <div className="widget-left-sidebar">
          <div className="sidebar-top-actions">
            <button
              onClick={() => setActiveTicket(null)}
              className="widget-new-ticket-btn"
            >
              ➕ Create New Ticket
            </button>
          </div>

          <div className="sidebar-search-box">
            <input
              type="text"
              placeholder="🔍 Search tickets..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="sidebar-search-input"
            />
          </div>

          <div className="sidebar-ticket-list">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(t => {
                const isSelected = activeTicket && activeTicket._id === t._id;
                const unreadCount = getUnreadCount(t);
                const badgeText = unreadCount > 10 ? '10+' : String(unreadCount);

                return (
                  <div
                    key={t._id}
                    className={`sidebar-ticket-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTicket(t)}
                  >
                    <div className="ticket-card-header">
                      <strong className="ticket-card-number">{t.ticketNumber}</strong>
                      <span className={`ticket-card-status ${t.status.toLowerCase()}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="ticket-card-subject">{t.subject}</div>

                    <div className="ticket-card-footer">
                      <span className="ticket-card-date">
                        {new Date(t.updatedAt || t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {unreadCount > 0 && !isSelected && (
                        <span className="ticket-unread-badge" title={`${unreadCount} unread message(s)`}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-sidebar-note">No tickets found.</div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN PANE: CHAT THREAD OR TICKET FORM */}
        <div className="widget-right-main">
          {!activeTicket ? (
            unbanStatus && unbanStatus.canOpen === false ? (
              /* UNBAN RESTRICTION BANNER */
              <div className="create-ticket-box" style={{ borderLeft: '4px solid #ef4444' }}>
                <h4 className="create-ticket-title" style={{ color: '#ef4444' }}>
                  🚫 {unbanStatus.blockedUntil ? 'Unban Appeal Temporarily Restricted' : 'Unban Appeal Permanently Locked'}
                </h4>
                <p className="create-ticket-desc" style={{ marginTop: '8px' }}>
                  {unbanStatus.blockedUntil ? (
                    <>You are restricted from submitting another unban appeal ticket until <strong>{new Date(unbanStatus.blockedUntil).toLocaleString()}</strong>.</>
                  ) : (
                    <>The admin team has permanently restricted this account from creating further unban appeal tickets.</>
                  )}
                </p>

                {unbanStatus.adminRemarks && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px dashed #ef4444', color: '#991b1b' }}>
                    <strong>📌 Admin Remarks:</strong> {unbanStatus.adminRemarks}
                  </div>
                )}

                {tickets.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleSelectTicket(tickets[0])}
                      style={{ fontSize: '13px', padding: '8px 14px' }}
                    >
                      📜 View Ticket History
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CREATE UNBAN TICKET FORM */
              <div className="create-ticket-box">
                <h4 className="create-ticket-title">Submit Support / Unban Ticket</h4>
                <p className="create-ticket-desc">
                  Submit your message or appeal to the platform administration. You can upload documents and chat directly with support.
                </p>

                <form onSubmit={handleCreateUnbanTicket} className="widget-form">
                  <div className="widget-form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Request to unblock account"
                      required
                    />
                  </div>

                  <div className="widget-form-group">
                    <label>Statement / Appeal Details *</label>
                    <textarea
                      rows="4"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Explain the situation, clarify any issues..."
                    />
                  </div>

                  <div className="widget-form-group">
                    <label>📎 Attach Files / Documents (PDF, DOC, Images)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        style={{ fontSize: '13px', flex: 1 }}
                      />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                        Selected {selectedFiles.length} file(s): {selectedFiles.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="widget-submit-btn" disabled={submitting}>
                    {submitting ? 'Submitting Ticket...' : '📩 Submit Ticket'}
                  </button>
                </form>
              </div>
            )
          ) : (
            /* ACTIVE TICKET THREAD VIEW */
            <div className="ticket-thread-box">
              <div className="ticket-summary-bar">
                <div className="ticket-id-section">
                  <span className="ticket-id-tag">{activeTicket.ticketNumber}</span>
                  <span className="ticket-subject-text">{activeTicket.subject}</span>
                </div>
                <div className="ticket-status-pill-wrap">
                  <span className={`ticket-status-pill ${activeTicket.status.toLowerCase()}`}>
                    {activeTicket.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {activeTicket.adminAction && (
                <div className={`admin-action-banner ${activeTicket.adminAction}`}>
                  <strong>📢 Administrative Notice:</strong>{' '}
                  {activeTicket.adminAction === 'unban'
                    ? 'Account has been unblocked! You may now sign out and log back in.'
                    : activeTicket.adminAction === 'pending_docs'
                      ? 'Admin requested additional document clarification in chat.'
                      : 'Admin maintained suspension status.'}
                </div>
              )}

              {/* CHAT MESSAGES CONTAINER */}
              <div className="widget-chat-messages" ref={chatScrollRef}>
                {activeTicket.chat && activeTicket.chat.length > 0 ? (
                  activeTicket.chat.map((msg, index) => {
                    const isUser = msg.sender !== 'support';
                    return (
                      <div key={index} className={`widget-message-bubble ${isUser ? 'user-bubble' : 'support-bubble'}`}>
                        <div className="bubble-header">
                          <span className="sender-name">
                            {isUser ? `You (${user?.name || user?.role || 'User'})` : '🛡️ Admin Support'}
                          </span>
                          <span className="message-time">
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {msg.text && <div className="bubble-text">{msg.text}</div>}
                        {renderAttachments(msg.attachments)}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-chat-note">No messages yet in this ticket thread.</div>
                )}
              </div>

              {/* CHAT INPUT OR LOCKED BANNER */}
              {activeTicket.status === 'closed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="ticket-closed-locked-banner">
                    🔒 <strong>This ticket has been closed by admin ({activeTicket.closedBy || 'Admin'}).</strong> No further messages can be sent in this thread.
                  </div>

                  {adminRemarksText && (
                    <div style={{ padding: '12px', background: '#fff7ed', borderRadius: '10px', border: '1.5px dashed var(--color-tandoori, #E57919)', fontSize: '13px', color: '#7c2d12' }}>
                      <strong>📌 Admin Remarks at Closing:</strong> {adminRemarksText}
                    </div>
                  )}

                  {unbanStatus && unbanStatus.canOpen !== false ? (
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      <button
                        className="widget-submit-btn"
                        onClick={() => setActiveTicket(null)}
                        style={{ background: 'var(--color-tandoori, #E57919)', color: '#ffffff', fontSize: '14px', padding: '12px 24px' }}
                      >
                        ➕ Open New Support / Appeal Ticket
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '12px', color: '#991b1b', textAlign: 'center' }}>
                      🚫 {unbanStatus?.blockedUntil ? `New appeal restricted until ${new Date(unbanStatus.blockedUntil).toLocaleString()}` : 'Account permanently restricted from creating further appeals.'}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="widget-chat-input-row" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                  {replyFiles.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                      📎 Attached {replyFiles.length} file(s): {replyFiles.map(f => f.name).join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      ref={replyTextInputRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to admin support..."
                      disabled={submitting}
                      style={{ flex: 1 }}
                    />
                    <label
                      className="widget-attach-btn"
                      style={{
                        cursor: 'pointer',
                        padding: '11px 16px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1.5px solid var(--color-tandoori, #E57919)',
                        color: 'var(--color-roasted, #4F2E1D)',
                        fontSize: '13px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 5px rgba(229,121,25,0.1)'
                      }}
                      title="Attach files"
                    >
                      📎 Attach
                      <input
                        type="file"
                        multiple
                        ref={replyFileInputRef}
                        onChange={(e) => setReplyFiles(Array.from(e.target.files))}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button type="submit" disabled={submitting || (!replyText.trim() && replyFiles.length === 0)}>
                      Send
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlockedTicketWidget;
