import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.BASE_URL || '/';
  const defaultApiPath = import.meta.env.MODE === 'development' ? '/api' : `${baseUrl}api`;
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || defaultApiPath.replace(/\/+/g, '/');

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
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('full_name', data.user.full_name);
        localStorage.setItem('user_id', data.user.id || '');
          const sanitizedProfile = (returnedProfile && !returnedProfile.includes('projectpics')) ? returnedProfile : '';
          localStorage.setItem('profile_image', sanitizedProfile);
        localStorage.setItem('shift_schedule', data.user.shift_schedule || '');
        window.dispatchEvent(new Event('authchange'));

        navigate('/categories', { replace: true });
      } else {
        setFormMessage(data.message || 'Invalid phone number or password configuration.');
      }
    } catch (error) {
      console.error('Authentication Error:', error);
      setFormMessage('Unable to authenticate with the server. Please try again.');
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
