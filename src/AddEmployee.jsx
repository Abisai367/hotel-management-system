import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css';
import { getApiUrl } from './apiUrl.js';
import { STAFF_ROLES, isAdminRole, roleLabel } from './roles.js';

export default function AddEmployee() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [shiftSchedule, setShiftSchedule] = useState('');
  const [salary, setSalary] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const apiUrl = getApiUrl();

  useEffect(() => {
    const userRole = sessionStorage.getItem('user_role');
    if (!isAdminRole(userRole)) {
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

    if (!fullName || !phone || !password || !role || !shiftSchedule || salary === '') {
      setFormMessage('Please fill all required fields.');
      return;
    }

    const parsedSalary = Number(salary);
    if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
      setFormMessage('Enter a valid salary amount.');
      return;
    }

    setFormMessage('Uploading staff photo to cloud...');
    setIsSubmitting(true);

    let uploadedProfileUrl = '';

    if (file) {
      try {
        const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'hotel_cloud';
        const cloudinaryPreset = import.meta.env.VITE_CLOUDINARY_PRESET || 'hotel_preset';
        const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;

        const cloudinaryData = new FormData();
        cloudinaryData.append('file', file);
        cloudinaryData.append('upload_preset', cloudinaryPreset);

        const cloudinaryResponse = await fetch(cloudinaryEndpoint, {
          method: 'POST',
          body: cloudinaryData,
        });

        if (!cloudinaryResponse.ok) {
          const errorText = await cloudinaryResponse.text();
          throw new Error(errorText || 'Cloudinary asset upload rejected.');
        }

        const cloudJson = await cloudinaryResponse.json();
        uploadedProfileUrl = cloudJson.secure_url;
      } catch (cloudErr) {
        setFormMessage('Unable to upload the photo. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    setFormMessage('Saving new employee configuration...');

    const adminToken = sessionStorage.getItem('user_id'); 

    const employeeData = new FormData();
    employeeData.append('full_name', fullName);
    employeeData.append('phone', phone);
    employeeData.append('phone_number', phone);
    employeeData.append('password', password);
    employeeData.append('role', role);
    employeeData.append('shift_schedule', shiftSchedule);
    employeeData.append('salary', parsedSalary);
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
        setPhone('');
        setPassword('');
        setRole('waiter');
        setShiftSchedule('');
        setSalary('');
        setFile(null);
        setPreview(null);
        setFormMessage('');
      } else {
        setFormMessage(data.message || 'Unable to register staff account.');
      }
    } catch (error) {
      setFormMessage('Unable to communicate with the server. Please try again later.');
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
            <label htmlFor="phone">Work Phone Number <span className="required">*</span></label>
            <input
              type="tel"
              id="phone"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              {STAFF_ROLES.map((staffRole) => (
                <option key={staffRole} value={staffRole}>{roleLabel(staffRole)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="salary">Monthly Salary <span className="required">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="salary"
              placeholder="e.g. 25000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
            />
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
