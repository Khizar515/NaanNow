import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
          Your NaanNow customer account has been blocked by the system administrator.
        </p>

        <div className="blocked-reason-box">
          <h4>Reason for Suspension:</h4>
          <p className="reason-text">
            "{user?.blockReason || 'Violation of platform terms and conditions or security flag.'}"
          </p>
        </div>

        <div className="blocked-instructions">
          <h4>How to Resolve & Reactivate Your Account:</h4>
          <ul>
            <li>Please contact support at <strong>support@naannow.com</strong> or call <strong>+92 51 111-622-666</strong>.</li>
            <li>Provide your registered account email: <code>{user?.email}</code>.</li>
            <li>Our administrative team will review your appeal and reactivate your account once resolved.</li>
          </ul>
        </div>

        <button className="blocked-logout-btn" onClick={handleLogout}>
          Sign Out & Return to Login
        </button>
      </div>
    </div>
  );
}

export default BlockedPage;
