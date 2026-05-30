import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css'; 

export default function AddEmployee() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee'); 
  const [shiftSchedule, setShiftSchedule] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.BASE_URL || '/';
  const defaultApiPath = import.meta.env.MODE === 'development' ? '/api' : `${baseUrl}api`;
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || defaultApiPath.replace(/\/+/g, '/');

  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'Admin' && userRole !== 'admin') {
      alert('Unauthorized! This action requires administrator permissions.');
      navigate('/categories');
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !role || !shiftSchedule) {
      setFormMessage('Please fill all required fields.');
      return;
    }

    setFormMessage('Uploading staff photo to cloud...');
    setIsSubmitting(true);

    let uploadedProfileUrl = '';

    if (file) {
      try {
        const cloudinaryData = new FormData();
        cloudinaryData.append('file', file);
        cloudinaryData.append('upload_preset', 'hotel_preset');

        const cloudinaryResponse = await fetch(
          'https://cloudinary.com',
          { method: 'POST', body: cloudinaryData }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error('Cloudinary asset upload rejected.');
        }

        const cloudJson = await cloudinaryResponse.json();
        uploadedProfileUrl = cloudJson.secure_url;
      } catch (cloudErr) {
        console.error(cloudErr);
        setFormMessage('Image upload failed. Registration aborted.');
        setIsSubmitting(false);
        return;
      }
    }

    setFormMessage('Saving new employee configuration...');

    const adminToken = localStorage.getItem('user_id'); 

    const employeeData = new FormData();
    employeeData.append('full_name', fullName);
    employeeData.append('email', email);
    employeeData.append('password', password);
    employeeData.append('role', role);
    employeeData.append('shift_schedule', shiftSchedule);
    employeeData.append('profile_image_url', uploadedProfileUrl);
    employeeData.append('admin_id', adminToken); 

    try {
      const response = await fetch(`${apiUrl}/add_employee.php`, {
        method: 'POST',
        body: employeeData,
      });

      if (!response.ok) {
        throw new Error(`Server execution failure: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        alert(`Successfully registered ${fullName} as a ${role}!`);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('Employee');
        setShiftSchedule('');
        setFile(null);
        setPreview(null);
        setFormMessage('');
      } else {
        setFormMessage(data.message || 'Unable to register staff account.');
      }
    } catch (error) {
      console.error('Add Employee API Error:', error);
      setFormMessage('Unable to communicate with the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">REGISTER STAFF</h1>
        <p className="signup-subtitle">Secure admin terminal to add official internal employees</p>

        <form className="signup-form" onSubmit={handleEmployeeSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Employee Full Name <span className="required">*</span></label>
            <input
              type="text"
              id="fullName"
              placeholder="e.g. Joy Ezechukwu"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email Address <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              placeholder="e.g. joy@hotel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Temporary Access Password <span className="required">*</span></label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Assigned Designation Role <span className="required">*</span></label>
            <select 
              id="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '11px', border: '1px solid #cccccc', borderRadius: '6px' }}
            >
              <option value="Employee">Employee (Standard Staff)</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Admin">Co-Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="shift">Work Shift Schedule <span className="required">*</span></label>
            <input
              type="text"
              id="shift"
              placeholder="e.g. 08:00 - 16:00"
              value={shiftSchedule}
              onChange={(e) => setShiftSchedule(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar">Upload Staff Badge Photo</label>
            <input type="file" id="avatar" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <div className="avatar-preview-wrapper">
                <img src={preview} alt="Staff Preview" className="avatar-preview-img" />
              </div>
            )}
          </div>

          {formMessage && <p className="form-message">{formMessage}</p>}

          <button type="submit" className="signup-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Configuring Account...' : 'REGISTER EMPLOYEE'}
          </button>
        </form>

        <div className="signup-footer">
          <Link to="/upload">← Return to Product Console</Link>
        </div>
      </div>
    </div>
  );
}
