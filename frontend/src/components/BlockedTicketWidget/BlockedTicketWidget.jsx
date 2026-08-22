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

  // Form states
  const [subject, setSubject] = useState('Account Unban Appeal Request');
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);

  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  const chatScrollRef = useRef(null);    // scroll-into-view for chat container
  const activeTicketRef = useRef(null); // mirrors activeTicket — avoids stale closure in interval

  // Keep ref in sync so the polling interval always has the latest activeTicket
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  const scrollChatToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
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
        // Auto-select open/in_progress ticket if available, else newest ticket
        const activeOrNewest = data.find(t => t.status !== 'closed') || data[0];
        setActiveTicket(activeOrNewest || null);
      } else {
        // Use ref to get the TRUE current activeTicket (avoids stale closure)
        const currentActive = activeTicketRef.current;
        if (currentActive) {
          const freshActive = data.find(t => t._id === currentActive._id);
          if (freshActive) {
            setActiveTicket(freshActive);
            // If new messages arrived, scroll chat to bottom
            if (freshActive.chat?.length !== currentActive.chat?.length) {
              setTimeout(scrollChatToBottom, 50);
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
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchMyTickets();
      setMessage('');
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
    setError('');
    setSubmitting(true);

    try {
      const updated = await api.replyToTicket(activeTicket._id, replyText.trim(), '', replyFiles);
      setActiveTicket(updated);
      setReplyFiles([]);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
      await fetchMyTickets();
      setReplyText('');
      // Scroll the chat container (not the page) to show the new message
      setTimeout(scrollChatToBottom, 80);
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

  return (
    <div className="blocked-ticket-widget">
      <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>🎫 In-App Support & Ticket System</h3>
          <p className="widget-subtitle">All communication regarding support and account status happens directly inside your ticket thread.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tickets.length > 0 && activeTicket && (
            <button
              onClick={() => setActiveTicket(null)}
              className="widget-submit-btn"
              style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--color-tandoori, #e57919)' }}
            >
              ➕ Create New Ticket
            </button>
          )}
          <span style={{ fontSize: '11px', opacity: 0.7, padding: '4px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.06)' }}>
            🟢 Live Updates
          </span>
        </div>
      </div>

      {error && <div className="widget-error-banner">⚠️ {error}</div>}

      {/* Ticket Selection Tabs if multiple tickets exist */}
      {tickets.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
          {tickets.map(t => (
            <button
              key={t._id}
              onClick={() => setActiveTicket(t)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                border: (activeTicket && activeTicket._id === t._id) ? '2px solid var(--color-tandoori, #E57919)' : '1px solid #d1d5db',
                background: (activeTicket && activeTicket._id === t._id) ? '#fff7ed' : '#ffffff',
                color: (activeTicket && activeTicket._id === t._id) ? 'var(--color-tandoori, #E57919)' : '#4b5563',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.ticketNumber} ({t.status.toUpperCase()})
            </button>
          ))}
        </div>
      )}

      {!activeTicket ? (
        unbanStatus && unbanStatus.canOpen === false ? (
          /* UNBAN RESTRICTION BANNER (PERMANENT OR TIMED) */
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
                  onClick={() => setActiveTicket(tickets[0])}
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                >
                  📜 View Closed Ticket History
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

          {/* CHAT MESSAGES */}
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

              {/* Problem 2 Solution: Allow user to open a new ticket if allowed */}
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
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to admin support..."
                  disabled={submitting}
                  style={{ flex: 1 }}
                />
                {/* Clean, theme-matched Attach button (Problem 1 Fix) */}
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
  );
}

export default BlockedTicketWidget;
