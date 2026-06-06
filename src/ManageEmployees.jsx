import React, { useState, useEffect } from 'react';
import './UploadCategories.css';
import ScrollReveal from 'scrollreveal';
import { getApiUrl } from './apiUrl.js';

export default function ManageEmployees(){
  const [mode, setMode] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({full_name:'', phone:'', role:'Employee', shift_schedule:'', salary:''});
  const [message, setMessage] = useState('');
  const apiUrl = getApiUrl();

  useEffect(()=>{
    const sr = ScrollReveal({ reset: false });
    sr.reveal('.manage-title', { distance: '30px', origin: 'top', duration:700 });
    fetchEmployees();
    return () => sr.destroy();
  },[]);

  function fetchEmployees(){
    setLoading(true);
    fetch(`${apiUrl}/get_employees.php`)
      .then(r=>r.json())
      .then(j=>{
        if (j.status === 'success') setEmployees(j.employees || []);
        else setMessage('Failed to load employees');
      })
      .catch(e=>{ console.error(e); setMessage('Network error'); })
      .finally(()=>setLoading(false));
  }

  function handleSelect(emp){
    setSelected(emp);
    setForm({
      full_name: emp.full_name || '',
      phone: emp.phone || '',
      role: emp.role || 'Employee',
      shift_schedule: emp.shift_schedule || '',
      salary: emp.salary || ''
    });
    setMode('customize');
  }

  function handleField(e){
    const {name,value} = e.target;
    setForm(f=>({...f,[name]:value}));
  }

  function saveEmployee(){
    if (!selected || !selected.id) { setMessage('Select an employee first'); return; }
    setMessage('Saving...');
    fetch(`${apiUrl}/update_employee.php`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: selected.id, ...form })
    }).then(r=>r.json()).then(j=>{
      if (j.status==='success'){ setMessage('Saved'); fetchEmployees(); setMode('list'); }
      else setMessage(j.message || 'Save failed');
    }).catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  function unemploy(id){
    if (!confirm('Unemploy this user? This will remove their salary and change their role to customer.')) return;
    setMessage('Processing...');
    fetch(`${apiUrl}/unemploy_employee.php`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id })
    }).then(r=>r.json()).then(j=>{
      if (j.status==='success'){ setMessage('Employee unemployed successfully'); fetchEmployees(); setMode('list'); }
      else setMessage(j.message || 'Operation failed');
    }).catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  function addEmployee(){
    setMessage('Creating...');
    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      phone_number: form.phone,
      role: form.role,
      shift_schedule: form.shift_schedule,
      salary: form.salary
    };
    fetch(`${apiUrl}/add_employee.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r=>r.json()).then(j=>{
        if (j.status==='success'){ setMessage('Employee added'); fetchEmployees(); setForm({full_name:'',phone:'',role:'Employee',shift_schedule:'',salary:''}); setMode('list'); }
        else setMessage(j.message || 'Add failed');
      }).catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  return (
    <div className="upload-container">
      <div className="upload-content">
        <h1 className="manage-title">Manage Employees</h1>
        <div className="manage-actions" style={{display:'flex',gap:10,marginBottom:12}}>
          <button className={`btn btn-primary ${mode==='list'?'active':''}`} onClick={() => { setMode('list'); setSelected(null); }}>LIST</button>
          <button className={`btn btn-secondary ${mode==='add'?'active':''}`} onClick={() => { setMode('add'); setSelected(null); }}>ADD EMPLOYEE</button>
          <button className={`btn btn-secondary ${mode==='customize'?'active':''}`} onClick={() => { if (!selected) { setMessage('Select an employee from the list'); } else setMode('customize'); }}>CUSTOMIZE EMPLOYEE</button>
        </div>

        {message && <div className="form-message">{message}</div>}

        {loading && <p className="loading-text">Loading employees...</p>}

        {mode === 'list' && (
          <div className="product-management">
            <div className="product-management-header">
              <h2>Employees</h2>
              <p className="admin-help-text">Tap an employee to customize or unemploy them.</p>
            </div>
            <div className="product-grid-admin" style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
              {employees.length === 0 && <div className="empty-text">No employees found.</div>}
              {employees.map(emp=> (
                <div key={emp.id} className="product-card" style={{alignItems:'center'}}>
                  <div className="product-card-image">
                    <img src={emp.profile_image_url || '/public/default-avatar.png'} alt="profile" />
                  </div>
                  <div className="product-card-body">
                    <div>
                      <h3>{emp.full_name}</h3>
                      <p>{emp.role} • {emp.phone}</p>
                    </div>
                    <div className="product-card-meta">
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn btn-secondary" onClick={()=>handleSelect(emp)}>Customize</button>
                        <button className="btn btn-delete" onClick={()=>unemploy(emp.id)}>Unemploy</button>
                      </div>
                      <div className="card-price">Joined: {emp.created_at || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'add' && (
          <div className="upload-form">
            <div className="form-group">
              <label>Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleField} placeholder="Employee full name" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleField} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input name="role" value={form.role} onChange={handleField} placeholder="Role (Employee/Supervisor)" />
            </div>
            <div className="form-group">
              <label>Shift schedule</label>
              <input name="shift_schedule" value={form.shift_schedule} onChange={handleField} placeholder="e.g. Morning / Afternoon" />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input name="salary" value={form.salary} onChange={handleField} placeholder="0.00" />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={addEmployee}>Add Employee</button>
              <button className="btn btn-secondary" onClick={()=>{ setMode('list'); setForm({full_name:'',phone:'',role:'Employee',shift_schedule:'',salary:''}); }}>Cancel</button>
            </div>
          </div>
        )}

        {mode === 'customize' && selected && (
          <div className="upload-form">
            <h3>Editing: {selected.full_name}</h3>
            <div className="form-group">
              <label>Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input name="role" value={form.role} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Shift schedule</label>
              <input name="shift_schedule" value={form.shift_schedule} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input name="salary" value={form.salary} onChange={handleField} placeholder="0.00" />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={saveEmployee}>Save Changes</button>
              <button className="btn btn-secondary" onClick={()=>{ setMode('list'); setSelected(null); }}>Back</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
