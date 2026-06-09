import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { getApiUrl } from './apiUrl.js';
import { staffHomeForRole } from './roles.js';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const apiUrl = getApiUrl();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!phone || !password) {
      setFormMessage('Please enter both phone number and password.');
      return;
    }

    setFormMessage('');
    setIsSubmitting(true);

    const loginData = new FormData();
    loginData.append('phone', phone);
    loginData.append('password', password);

    try {
      const response = await fetch(`${apiUrl}/login.php`, {
        method: 'POST',
        body: loginData,
      });

      if (!response.ok) {
        throw new Error(`Server connection failure: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        sessionStorage.setItem('user_role', data.user.role);
        sessionStorage.setItem('full_name', data.user.full_name);
        sessionStorage.setItem('user_id', data.user.id || '');
        const returnedProfile = data.user.profile_image_url || '';
        const sanitizedProfile = (returnedProfile && !returnedProfile.includes('projectpics')) ? returnedProfile : '';
        sessionStorage.setItem('profile_image', sanitizedProfile);
        sessionStorage.setItem('shift_schedule', data.user.shift_schedule || '');
        sessionStorage.setItem('salary', data.user.salary || 0);
        window.dispatchEvent(new Event('authchange'));

        navigate(staffHomeForRole(data.user.role), { replace: true });
      } else {
        setFormMessage(data.message || 'Invalid phone number or password configuration.');
      }
    } catch (error) {
      setFormMessage('Unable to authenticate with the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">WELCOME BACK</h1>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Phone Number <span className="required">*</span></label>
            <input
              type="tel"
              id="phone"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {formMessage && <p className="form-message">{formMessage}</p>}

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'LOG IN'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}
