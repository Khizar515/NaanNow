import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo-rotate.svg';
import './AuthPage.css';

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'rider' | 'manager'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { name, email, phone, password, confirmPassword } = formData;

    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      setLoading(false);
      return;
    }

    try {
      let userData;
      if (isLogin) {
        userData = await login(email, password);
        setSuccess('Login successful! Redirecting...');
      } else {
        if (!name.trim()) {
          setError('Please fill in your name.');
          setLoading(false);
          return;
        }
        if (!phone || !phone.trim()) {
          setError('Please fill in your phone number.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        userData = await register({
          name,
          email,
          phone,
          password,
          role: selectedRole
        });
        setSuccess('Registration successful! Redirecting...');
      }

      setTimeout(() => {
        if (userData.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (userData.role === 'rider') {
          navigate('/rider-dashboard');
        } else if (userData.role === 'manager') {
          navigate('/restaurant-dashboard');
        } else {
          navigate('/');
        }
      }, 1200);

    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">

        {/* Left Side: Brand Splash Panel */}
        <div className="auth-brand-panel">
          <div className="auth-logo-spinner-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} title="Back to Home">
            <img src={logo} alt="NaanNow Logo" className="auth-brand-logo-img" />
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
            {!isLogin && (
              <div className="form-group-field" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-roasted)', marginBottom: '4px' }}>
                  Select Portal / Role:
                </label>
                <select
                  className="role-select-dropdown"
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setError(''); }}
                >
                  <option value="customer">Customer</option>
                  <option value="rider">Rider</option>
                  <option value="manager">Restaurant Manager</option>
                </select>
              </div>
            )}

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

              {!isLogin && (
                <div className="form-group-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 03263111236"
                    value={formData.phone}
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

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
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

