import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import './BlockedTicketWidget.css';

function BlockedTicketWidget({ user }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [subject, setSubject] = useState('Account Unban Appeal Request');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getMyTickets();
      setTickets(data);
      // Find latest unban ticket or fallback to latest ticket
      const unbanTicket = data.find(t => t.ticketType === 'unban') || data[0];
      setActiveTicket(unbanTicket || null);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError('Failed to load support ticket history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleCreateUnbanTicket = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message explaining your unban request.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const newTicket = await api.createTicket(subject.trim(), message.trim(), 'unban');
      setActiveTicket(newTicket);
      await fetchMyTickets();
      setMessage('');
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err.message || 'Failed to submit unban ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    setError('');
    setSubmitting(true);

    try {
      const updated = await api.replyToTicket(activeTicket._id, replyText.trim());
      setActiveTicket(updated);
      await fetchMyTickets();
      setReplyText('');
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="blocked-widget-loading">Loading support ticket system...</div>;
  }

  return (
    <div className="blocked-ticket-widget">
      <div className="widget-header">
        <h3>🎫 In-App Support & Unban Ticket System</h3>
        <p className="widget-subtitle">All communication regarding your account suspension happens directly inside this ticket thread.</p>
      </div>

      {error && <div className="widget-error-banner">⚠️ {error}</div>}

      {!activeTicket ? (
        /* CREATE UNBAN TICKET FORM */
        <div className="create-ticket-box">
          <h4 className="create-ticket-title">Submit Unban Appeal Ticket</h4>
          <p className="create-ticket-desc">
            Submit your appeal to the platform administration. You will be able to chat directly with admin support in real-time.
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
              <label>Appeal / Statement Details *</label>
              <textarea
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the situation, clarify any issues, or attach requested details..."
                required
              />
            </div>

            <button type="submit" className="widget-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting Ticket...' : '📩 Submit Appeal Ticket'}
            </button>
          </form>
        </div>
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
          <div className="widget-chat-messages">
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
                    <div className="bubble-text">{msg.text}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-chat-note">No messages yet in this ticket thread.</div>
            )}
          </div>

          {/* CHAT INPUT OR LOCKED BANNER */}
          {activeTicket.status === 'closed' ? (
            <div className="ticket-closed-locked-banner">
              🔒 <strong>This ticket has been closed by admin.</strong> No further messages can be sent by any party.
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="widget-chat-input-row">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to admin support..."
                disabled={submitting}
              />
              <button type="submit" disabled={submitting || !replyText.trim()}>
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default BlockedTicketWidget;
