import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BlockedTicketWidget from '../../components/BlockedTicketWidget/BlockedTicketWidget';
import './BlockedPage.css';

function BlockedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="blocked-page-container">
      <div className="blocked-card">
        <div className="blocked-icon">🔒</div>
        <h2>Account Suspended</h2>
        <p className="blocked-subheading">
          Your NaanNow customer account has been suspended by the system administrator.
        </p>

        <div className="blocked-reason-box">
          <h4>Reason for Suspension:</h4>
          <p className="reason-text">
            "{user?.blockReason || 'Violation of platform terms and conditions or security flag.'}"
          </p>
        </div>

        {/* IN-APP TICKET SYSTEM WIDGET */}
        <BlockedTicketWidget user={user} />

        <button className="blocked-logout-btn" onClick={handleLogout} style={{ marginTop: '24px' }}>
          Sign Out & Return to Login
        </button>
      </div>
    </div>
  );
}

export default BlockedPage;

