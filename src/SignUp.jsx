import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.BASE_URL || '/';
  const defaultApiPath = import.meta.env.MODE === 'development' ? '/api' : `${baseUrl}api`;
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || defaultApiPath.replace(/\/+/g, '/');
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hotel_cloud';

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !phone || !password || !confirmPassword) {
      setFormMessage('Please fill all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormMessage('Passwords do not match.');
      return;
    }

    setFormMessage('Processing account creation...');
    setIsSubmitting(true);

    let uploadedProfileUrl = '';

    if (file) {
      setFormMessage('Uploading avatar to cloud storage...');
      try {
        const cloudinaryData = new FormData();
        cloudinaryData.append('file', file);
        cloudinaryData.append('upload_preset', 'hotel_preset');

        const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;
        const cloudinaryResponse = await fetch(cloudinaryEndpoint, { method: 'POST', body: cloudinaryData });

        if (!cloudinaryResponse.ok) {
          const errorText = await cloudinaryResponse.text();
          throw new Error(errorText || 'Cloudinary avatar upload rejected.');
        }

        const cloudJson = await cloudinaryResponse.json();
        uploadedProfileUrl = cloudJson.secure_url;
      } catch (cloudErr) {
        console.error(cloudErr);
        setFormMessage('Profile image upload failed. Registration aborted.');
        setIsSubmitting(false);
        return;
      }
    }

    setFormMessage('Saving registration to database...');

    const registrationData = new FormData();
    registrationData.append('full_name', fullName);
    registrationData.append('phone', phone);
    registrationData.append('password', password);
    registrationData.append('profile_image_url', uploadedProfileUrl);

    try {
      const response = await fetch(`${apiUrl}/signup.php`, {
        method: 'POST',
        body: registrationData,
      });

      if (!response.ok) {
        throw new Error(`Server connection error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        alert('Account created successfully! Redirecting to categories...');
        localStorage.setItem('user_role', 'customer');
        localStorage.setItem('full_name', fullName);
        localStorage.setItem('user_id', data.user?.id || '');
        
        const sanitizedUploaded = (uploadedProfileUrl || '').trim();
        const profileToStore = (sanitizedUploaded && !sanitizedUploaded.includes('projectpics')) ? sanitizedUploaded : '';
        localStorage.setItem('profile_image', profileToStore);
        window.dispatchEvent(new Event('authchange'));
        navigate('/categories', { replace: true });
      } else {
        setFormMessage(data.message || 'Unable to register account.');
      }
    } catch (error) {
      console.error('Registration API Error:', error);
      setFormMessage('Unable to communicate with the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">CREATE ACCOUNT</h1>
        <p className="signup-subtitle">Register to setup your profile dashboard</p>

        <form className="signup-form" onSubmit={handleSignUpSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name <span className="required">*</span></label>
            <input type="text" id="fullName" placeholder="Joy Ezechukwu" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number <span className="required">*</span></label>
            <input type="tel" id="phone" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required/>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
            <input type="password" id="confirmPassword" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
          </div>
          
          <div className="form-group">
            <label htmlFor="avatar">Upload Profile Photo</label>
            <input type="file" id="avatar" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <div className="avatar-preview-wrapper">
                <img src={preview} alt="Avatar Preview" className="avatar-preview-img" />
              </div>
            )}
          </div>

          {formMessage && <p className="form-message">{formMessage}</p>}

          <button type="submit" className="signup-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Processing Registration...' : 'REGISTER'}
          </button>
        </form>

        <div className="signup-footer">
          <p>Already have an account? <Link to="/login">Log in here</Link></p>
        </div>
      </div>
    </div>
  );
}
