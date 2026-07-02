import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-rotate.svg';
import './AuthPage.css';

function AuthPage() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, email, phone, password, confirmPassword } = formData;

    // Simple validations
    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      return;
    }

    let resolvedRole = selectedRole;
    let resolvedName = name;
    let resolvedPhone = phone;
    let resolvedRestaurantName = '';
    let resolvedVehicleDetails = '';
    let resolvedLicensePlate = '';

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please fill in your name.');
        return;
      }
      if (!phone || !phone.trim()) {
        setError('Please fill in your phone number.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      // Registration: Save to registered users database in localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('naannow_registeredUsers') || '[]');
      if (registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('Email already registered.');
        return;
      }
      const newUser = {
        name,
        email,
        phone,
        password,
        role: selectedRole,
        status: selectedRole === 'customer' ? 'approved' : 'unverified'
      };
      registeredUsers.push(newUser);
      localStorage.setItem('naannow_registeredUsers', JSON.stringify(registeredUsers));
    } else {
      // Login: Handle Admin login and retrieve user role/data from registered users
      if (email.toLowerCase() === 'admin@naannow.com') {
        resolvedRole = 'admin';
        resolvedName = 'Platform Admin';
      } else {
        const registeredUsers = JSON.parse(localStorage.getItem('naannow_registeredUsers') || '[]');
        const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (existingUser) {
          resolvedRole = existingUser.role;
          resolvedName = existingUser.name;
          resolvedPhone = existingUser.phone;
          resolvedRestaurantName = existingUser.restaurantName || '';
          resolvedVehicleDetails = existingUser.vehicleDetails || '';
          resolvedLicensePlate = existingUser.licensePlate || '';
        } else {
          // Fallbacks for default/demo accounts or unregistered inputs
          resolvedName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
          resolvedPhone = '0300-1234567';
          if (email.toLowerCase() === 'saad@naannow.com') {
            resolvedRole = 'customer';
            resolvedName = 'Muhammad Saad';
          } else if (email.toLowerCase().includes('rider')) {
            resolvedRole = 'rider';
            resolvedVehicleDetails = 'Honda CD70';
            resolvedLicensePlate = 'ICT-9821';
          } else if (email.toLowerCase().includes('manager')) {
            resolvedRole = 'manager';
            resolvedRestaurantName = 'KFC (F-10)';
          } else {
            resolvedRole = 'customer';
          }
        }
      }
    }

    // Process Auth
    const userPayload = {
      name: isLogin ? resolvedName : name,
      email,
      phone: isLogin ? resolvedPhone : phone,
      role: resolvedRole,
      status: resolvedRole === 'admin' ? 'approved' : (resolvedRole === 'customer' ? 'approved' : 'unverified')
    };

    // If logging in as an existing registered user, fetch their exact status (approved/blocked/pending/unverified/rejected) and details
    if (isLogin && email.toLowerCase() !== 'admin@naannow.com') {
      const registeredUsers = JSON.parse(localStorage.getItem('naannow_registeredUsers') || '[]');
      const match = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        userPayload.status = match.status;
        userPayload.name = match.name;
        userPayload.phone = match.phone;
        if (match.role === 'rider') {
          userPayload.vehicleDetails = match.vehicleDetails;
          userPayload.licensePlate = match.licensePlate;
          userPayload.dob = match.dob;
          userPayload.address = match.address;
          userPayload.cnicNumber = match.cnicNumber;
          userPayload.cnicFront = match.cnicFront;
          userPayload.cnicBack = match.cnicBack;
          userPayload.licenseNumber = match.licenseNumber;
          userPayload.licenseImage = match.licenseImage;
          userPayload.bikeColor = match.bikeColor;
          userPayload.bikeModel = match.bikeModel;
          userPayload.avatar = match.avatar;
          userPayload.bankName = match.bankName;
          userPayload.accountNumber = match.accountNumber;
          userPayload.walletNumber = match.walletNumber;
        } else if (match.role === 'manager') {
          userPayload.restaurantName = match.restaurantName;
          userPayload.restaurantAddress = match.restaurantAddress;
          userPayload.city = match.city;
          userPayload.mapsLocation = match.mapsLocation;
          userPayload.restaurantPhone = match.restaurantPhone;
          userPayload.restaurantEmail = match.restaurantEmail;
          userPayload.logo = match.logo;
          userPayload.cover = match.cover;
          userPayload.photoFront = match.photoFront;
          userPayload.photoKitchen = match.photoKitchen;
          userPayload.photoDining = match.photoDining;
          userPayload.certDoc = match.certDoc;
          userPayload.licenseDoc = match.licenseDoc;
          userPayload.ntnDoc = match.ntnDoc;
          userPayload.bankName = match.bankName;
          userPayload.holderName = match.holderName;
          userPayload.accountNumber = match.accountNumber;
        }
      } else {
        userPayload.status = 'approved'; // default approved for demo accounts
      }
    }

    // Store in localStorage
    localStorage.setItem('naannow_currentUser', JSON.stringify(userPayload));
    setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');

    setTimeout(() => {
      if (resolvedRole === 'admin') {
        navigate('/admin-dashboard');
      } else if (resolvedRole === 'rider') {
        navigate('/rider-dashboard');
      } else if (resolvedRole === 'manager') {
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
          <div className="auth-logo-spinner-container" style={{ cursor: 'pointer' }} title="Back to Home">
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
                    placeholder="e.g. 0300-1234567"
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
