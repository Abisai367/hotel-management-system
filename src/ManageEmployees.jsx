import React, { useState, useEffect } from 'react';
import './UploadCategories.css';
import ScrollReveal from 'scrollreveal';

export default function ManageEmployees(){
  const [mode, setMode] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({full_name:'', phone:'', role:'Employee', shift_schedule:'', salary:''});
  const [addForm, setAddForm] = useState({full_name:'', phone:'', role:'Employee'});
  const [message, setMessage] = useState('');

  useEffect(()=>{
    const sr = ScrollReveal({ reset: false });
    sr.reveal('.manage-title', { distance: '30px', origin: 'top', duration:700 });
    fetchEmployees();
    return () => sr.destroy();
  },[]);

  function fetchEmployees(){
    setLoading(true);
    fetch('/api/get_employees.php')
      .then(r=>r.json())
      .then(j=>{
        if (j.status === 'success') setEmployees(j.employees || []);
        else setMessage('Failed to load employees');
      })
      .catch(e=>{ console.error(e); setMessage('Network error'); })
      .finally(()=>setLoading(false));
  }

  function handleSelectForEdit(emp){
    setEditingEmployee(emp);
    setForm({
      full_name: emp.full_name || '',
      phone: emp.phone || '',
      role: emp.role || 'Employee',
      shift_schedule: emp.shift_schedule || '',
      salary: emp.salary || ''
    });
  }

  function handleAddField(e){
    const {name,value} = e.target;
    setAddForm(f=>({...f,[name]:value}));
  }

  function handleField(e){
    const {name,value} = e.target;
    setForm(f=>({...f,[name]:value}));
  }

  function saveEmployee(){
    if (!editingEmployee || !editingEmployee.id) { setMessage('No employee selected'); return; }
    if (!form.full_name.trim()) { setMessage('Name is required'); return; }
    if (!form.phone.trim()) { setMessage('Phone is required'); return; }
    setMessage('Saving...');
    fetch('/api/update_employee.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: editingEmployee.id, ...form })
    }).then(r=>r.json()).then(j=>{
      if (j.status==='success'){ setMessage('✓ Employee updated successfully'); setTimeout(()=>{ fetchEmployees(); setEditingEmployee(null); }, 500); }
      else setMessage('Error: ' + (j.message || 'Save failed'));
    }).catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  function unemploy(id){
    if (!confirm('Convert this employee to a customer? This action cannot be undone.')) return;
    setMessage('Processing...');
    fetch('/api/unemploy_employee.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id })
    }).then(r=>r.json()).then(j=>{
      if (j.status==='success'){ setMessage('✓ Employee converted to customer'); fetchEmployees(); setMode('list'); }
      else setMessage('Error: ' + (j.message || 'Operation failed'));
    }).catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  function addEmployee(){
    if (!addForm.full_name.trim()) { setMessage('Name is required'); return; }
    if (!addForm.phone.trim()) { setMessage('Phone is required'); return; }
    setMessage('Creating...');
    fetch('/api/add_employee.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(addForm) })
      .then(r=>r.json())
      .then(j=>{
        if (j.status==='success'){ setMessage('✓ Employee added successfully'); setTimeout(()=>{ fetchEmployees(); setAddForm({full_name:'',phone:'',role:'Employee'}); setMode('list'); }, 500); }
        else setMessage('Error: ' + (j.message || 'Add failed'));
      })
      .catch(e=>{ console.error(e); setMessage('Network error'); });
  }

  return (
    <div className="upload-container">
      <div className="upload-content">
        <h1 className="manage-title">Manage Employees</h1>
        <div className="manage-actions" style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
          <button className={`btn btn-primary ${mode==='list'?'active':''}`} onClick={() => { setMode('list'); setEditingEmployee(null); }}>LIST EMPLOYEES</button>
          <button className={`btn btn-secondary ${mode==='add'?'active':''}`} onClick={() => { setMode('add'); setEditingEmployee(null); }}>ADD NEW EMPLOYEE</button>
        </div>

        {message && <div className="form-message">{message}</div>}

        {loading && <p className="loading-text">Loading employees...</p>}

        {mode === 'list' && (
          <div className="product-management">
            <div className="product-management-header">
              <h2>Employee Directory</h2>
              <p className="admin-help-text">Click <strong>Edit Details</strong> to modify employee information or <strong>Convert to Customer</strong> to remove from staff.</p>
            </div>
            <div className="product-grid-admin" style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
              {employees.length === 0 && <div className="empty-text">No employees found. Add your first employee using the "ADD NEW EMPLOYEE" button.</div>}
              {employees.map(emp=> (
                <div key={emp.id} className="product-card" style={{alignItems:'center'}}>
                  <div className="product-card-image">
                    <img src={emp.profile_image_url || '/public/default-avatar.png'} alt="profile" />
                  </div>
                  <div className="product-card-body">
                    <div>
                      <h3>{emp.full_name}</h3>
                      <p><strong>{emp.role}</strong> • {emp.phone}</p>
                      {emp.salary && <p>Salary: Kshs. {emp.salary}</p>}
                    </div>
                    <div className="product-card-meta" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="btn btn-primary" onClick={()=>handleSelectForEdit(emp)}>Edit Details</button>
                      <button className="btn btn-delete" onClick={()=>unemploy(emp.id)}>Convert to Customer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {editingEmployee && (
              <div className="edit-product-panel">
                <div className="edit-product-header">
                  <h2>Editing: {editingEmployee.full_name}</h2>
                  <button className="close-edit-btn" onClick={() => setEditingEmployee(null)}>✕</button>
                </div>
                
                <div className="edit-form-container">
                  <div className="edit-form-section">
                    <label htmlFor="emp-name">Full Name</label>
                    <input id="emp-name" type="text" name="full_name" value={form.full_name} onChange={handleField} placeholder="Employee full name" />
                  </div>

                  <div className="edit-form-section">
                    <label htmlFor="emp-phone">Phone Number</label>
                    <input id="emp-phone" type="text" name="phone" value={form.phone} onChange={handleField} placeholder="Phone number" />
                  </div>

                  <div className="edit-form-section">
                    <label htmlFor="emp-role">Role</label>
                    <input id="emp-role" type="text" name="role" value={form.role} onChange={handleField} placeholder="e.g. Employee, Supervisor" />
                  </div>

                  <div className="edit-form-section">
                    <label htmlFor="emp-shift">Shift Schedule</label>
                    <input id="emp-shift" type="text" name="shift_schedule" value={form.shift_schedule} onChange={handleField} placeholder="e.g. 8AM-4PM, 4PM-12AM" />
                  </div>

                  <div className="edit-form-section">
                    <label htmlFor="emp-salary">Monthly Salary (Kshs.)</label>
                    <input id="emp-salary" type="number" name="salary" value={form.salary} onChange={handleField} placeholder="0.00" min="0" step="0.01" />
                  </div>

                  <div className="edit-form-actions">
                    <button className="btn btn-primary" onClick={saveEmployee}>Save Changes</button>
                    <button className="btn btn-secondary" onClick={()=>setEditingEmployee(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'add' && (
          <div className="upload-form">
            <h2 style={{fontSize:'18pt', marginBottom:'20px', color:'var(--text-dark)'}}>Add New Employee</h2>
            
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" name="full_name" value={addForm.full_name} onChange={handleAddField} placeholder="Employee full name" />
            </div>
            
            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input type="text" name="phone" value={addForm.phone} onChange={handleAddField} placeholder="Phone number" />
            </div>
            
            <div className="form-group">
              <label>Role <span className="required">*</span></label>
              <select name="role" value={addForm.role} onChange={handleAddField} style={{padding:'12px 14px', borderRadius:'10px', border:'1px solid var(--border-color)', background:'var(--light-bg)', fontFamily:"'Poppins',sans-serif", fontSize:'15pt'}}>
                <option value="Employee">Employee</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={addEmployee}>Create Employee</button>
              <button className="btn btn-secondary" onClick={()=>{ setMode('list'); setAddForm({full_name:'',phone:'',role:'Employee'}); }}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
