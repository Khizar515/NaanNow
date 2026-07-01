import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-removebg.png';
import naan from '../../assets/naan-removebg.png';
import './AuthPage.css';

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'rider' | 'manager'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: 'KFC (F-10)',
    vehicleDetails: '',
    licensePlate: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, email, password, confirmPassword, restaurantName, vehicleDetails, licensePlate } = formData;

    // Simple validations
    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please fill in your name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (selectedRole === 'rider' && (!vehicleDetails.trim() || !licensePlate.trim())) {
        setError('Please fill in your vehicle details and license plate.');
        return;
      }
    }

    // Process Auth
    const userPayload = {
      name: isLogin ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)) : name,
      email,
      role: selectedRole,
      ...(selectedRole === 'manager' && { restaurantName }),
      ...(selectedRole === 'rider' && { vehicleDetails, licensePlate })
    };

    // Store in localStorage
    localStorage.setItem('naannow_currentUser', JSON.stringify(userPayload));
    setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');

    setTimeout(() => {
      if (selectedRole === 'rider') {
        navigate('/rider-dashboard');
      } else if (selectedRole === 'manager') {
        navigate('/restaurant-dashboard');
      } else {
        navigate('/');
      }
    }, 1200);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">

        {/* Left Side: Brand Splash Panel */}
        <div className="auth-brand-panel">
          <div className="auth-logo-spinner-container">
            <img src={logo} alt="NaanNow Logo" className="auth-brand-logo-img" />
            <img src={naan} alt="Spinning Naan" className="auth-brand-naan-spinning" />
          </div>
          <h1 className="auth-punchline">
            Hot, Soft & Fresh <br />
            <span>Right Out of the Tandoor!</span>
          </h1>
          <p className="auth-brand-desc">
            Pakistan's first premium naan delivery service. Track your warm flatbreads, curries, and orders in real-time from the clay tandoor straight to your doorstep.
          </p>
          <div className="auth-decorations">
            <div className="decor-item">Premium Restaurants</div>
            <div className="decor-item">Live GPS Tracking</div>
            <div className="decor-item">Fresh & Hot</div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-card-body">

            {/* Dynamic Mode Heading */}
            <div className="auth-mode-indicator">
              <h3>
                {isLogin ? 'Log In' : 'Create Account'}
              </h3>
              <p>Select your portal and enter details to continue.</p>
            </div>

            {/* Role Selector Dropdown */}
            <div className="form-group-field" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-roasted)', marginBottom: '4px' }}>
                Select Portal / Role:
              </label>
              <select
                className="role-select-dropdown"
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setError(''); }}
              >
                <option value="customer"> Customer</option>
                <option value="rider"> Rider</option>
                <option value="manager"> Restaurant Manager</option>
              </select>
            </div>

            {/* Error / Success Feedback */}
            {error && <div className="auth-error-alert">{error}</div>}
            {success && <div className="auth-success-alert">{success}</div>}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="auth-form-fields">

              {!isLogin && (
                <div className="form-group-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group-field">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {/* Conditional inputs based on role */}
              {!isLogin && selectedRole === 'manager' && (
                <div className="form-group-field">
                  <label>Select Restaurant Venue</label>
                  <select
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                  >
                    <option value="KFC (F-10)">KFC (F-10)</option>
                    <option value="Khyber Shinwari (F-7)">Khyber Shinwari (F-7)</option>
                    <option value="Tandoori Flames (F-10)">Tandoori Flames (F-10)</option>
                  </select>
                </div>
              )}

              {!isLogin && selectedRole === 'rider' && (
                <>
                  <div className="form-group-field">
                    <label>Vehicle Details (Make/Model)</label>
                    <input
                      type="text"
                      name="vehicleDetails"
                      placeholder="e.g. Honda CD70"
                      value={formData.vehicleDetails}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group-field">
                    <label>License Plate Number</label>
                    <input
                      type="text"
                      name="licensePlate"
                      placeholder="e.g. ICT-9821"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-auth-submit">
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            {/* Toggle Mode Footer */}
            <div className="auth-footer-toggle">
              {isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setIsLogin(false); setError(''); }}>
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setIsLogin(true); setError(''); }}>
                    Log In
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
