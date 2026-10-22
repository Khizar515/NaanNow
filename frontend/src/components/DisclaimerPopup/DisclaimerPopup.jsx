import React, { useState } from 'react';
import logo from '../../assets/logo-removebg.png';
import './DisclaimerPopup.css';

const DEMO_ACCOUNTS = [
  {
    role: 'Customer',
    email: 'customer@customer.com',
    password: 'customer',
  },
  {
    role: 'Rider',
    email: 'rider@rider.com',
    password: 'rider',
  },
  {
    role: 'Admin',
    email: 'admin@admin.com',
    password: 'admin',
  },
  {
    role: 'Approval Staff',
    email: 'approvalstaff@staff.com',
    password: 'approvalstaff_staff',
  },
  {
    role: 'Cheezious',
    email: 'cheezious@restaurant.com',
    password: 'cheezious',
  },
  {
    role: 'Ranchers',
    email: 'ranchers@restaurant.com',
    password: 'ranchers',
  },
  {
    role: 'KFC',
    email: 'kfci10@restaurant.com',
    password: 'kfc',
  },
];

function CredentialCard({ account }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Email: ${account.email}\nPassword: ${account.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="dp-cred-card">
      <div className="dp-cred-role">
        <span className="dp-cred-role-name">{account.role}</span>
      </div>
      <div className="dp-cred-field">
        <span className="dp-cred-label">Email</span>
        <span className="dp-cred-value">{account.email}</span>
      </div>
      <div className="dp-cred-field">
        <span className="dp-cred-label">Password</span>
        <span className="dp-cred-value">{account.password}</span>
      </div>
      <button className={`dp-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy Credentials'}
      </button>
    </div>
  );
}

export default function DisclaimerPopup() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="dp-backdrop">
      <div className="dp-modal">

        {/* Header */}
        <div className="dp-header">
          <div className="dp-logo-area">
            <img src={logo} alt="NaanNow Logo" className="dp-logo-img" />
            <div className="dp-logo-text-block">
              <h1 className="dp-title">NaanNow</h1>
              <span className="dp-badge">Portfolio Project</span>
            </div>
          </div>
          <p className="dp-subtitle">
            A full-stack food delivery platform built to demonstrate end-to-end web development.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="dp-disclaimer-section">
          <h2 className="dp-section-title">Important Disclaimer</h2>
          <ul className="dp-disclaimer-list">
            <li>
              <span className="dp-disc-dot"></span>
              <span>This is a <strong>portfolio and demo project</strong> — not a real food delivery service. No actual food or services will be delivered.</span>
            </li>
            <li>
              <span className="dp-disc-dot"></span>
              <span>All <strong>payments and card transactions are completely simulated</strong>. Do not enter real bank or card details.</span>
            </li>
            <li>
              <span className="dp-disc-dot"></span>
              <span><strong>Do not share real personal information</strong> — avoid using your actual name, address, phone number, or CNIC on this website.</span>
            </li>
            <li>
              <span className="dp-disc-dot"></span>
              <span>Data entered may be <strong>visible to other demo users</strong> and can be cleared or reset at any time.</span>
            </li>
            <li>
              <span className="dp-disc-dot"></span>
              <span>Use the <strong>pre-configured demo accounts</strong> below to explore all roles without signing up.</span>
            </li>
          </ul>
        </div>

        {/* Demo Accounts */}
        <div className="dp-accounts-section">
          <h2 className="dp-section-title">Demo Accounts</h2>
          <p className="dp-accounts-hint">Click "Copy Credentials" on any card to copy the email and password together to your clipboard.</p>
          <div className="dp-accounts-grid">
            {DEMO_ACCOUNTS.map(account => (
              <CredentialCard key={account.email} account={account} />
            ))}
          </div>
        </div>

        {/* Accept Button */}
        <div className="dp-footer">
          <button className="dp-accept-btn" onClick={() => setVisible(false)}>
            I Understand — Let Me Explore
          </button>
          <p className="dp-footer-note">
            By continuing, you acknowledge this is a demo project and agree not to enter real sensitive information.
          </p>
        </div>

      </div>
    </div>
  );
}
