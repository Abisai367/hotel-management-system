import React, { useState, useEffect, useMemo } from 'react';
import './UploadCategories.css';
import ScrollReveal from 'scrollreveal';
import { getApiUrl } from './apiUrl.js';
import { PAYROLL_ROLES, STAFF_ROLES, normalizeRole, roleLabel } from './roles.js';

const defaultForm = { full_name: '', phone: '', role: 'waiter', shift_schedule: '', salary: '' };

export default function ManageEmployees() {
  const [mode, setMode] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [selectedPayIds, setSelectedPayIds] = useState([]);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [payrollSession, setPayrollSession] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const apiUrl = getApiUrl();

  useEffect(() => {
    const sr = ScrollReveal({ reset: false });
    sr.reveal('.manage-title', { distance: '30px', origin: 'top', duration: 700 });
    fetchEmployees();
    return () => sr.destroy();
  }, []);

  const payrollEmployees = useMemo(
    () => employees.filter((emp) => PAYROLL_ROLES.includes(normalizeRole(emp.role)) && Number(emp.salary || 0) > 0),
    [employees]
  );

  const unpaidEmployees = useMemo(
    () => payrollEmployees.filter((emp) => normalizeRole(emp.role) !== 'admin' && emp.salary_status !== 'Paid'),
    [payrollEmployees]
  );

  const selectedTotal = useMemo(() => {
    const selectedSet = new Set(selectedPayIds.map(Number));
    return payrollEmployees.reduce((sum, emp) => selectedSet.has(Number(emp.id)) ? sum + Number(emp.salary || 0) : sum, 0);
  }, [payrollEmployees, selectedPayIds]);

  function fetchEmployees() {
    setLoading(true);
    fetch(`${apiUrl}/get_employees.php`)
      .then((r) => r.json())
      .then((j) => {
        if (j.status === 'success') setEmployees(j.employees || []);
        else setMessage('Unable to load employees. Please refresh the page.');
      })
      .catch(() => { setMessage('Unable to load employees. Please try again later.'); })
      .finally(() => setLoading(false));
  }

  function handleSelect(emp) {
    setSelected(emp);
    setForm({
      full_name: emp.full_name || '',
      phone: emp.phone || '',
      role: normalizeRole(emp.role) || 'waiter',
      shift_schedule: emp.shift_schedule || '',
      salary: emp.salary || ''
    });
    setMode('customize');
  }

  function handleField(e) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(defaultForm);
    setSelected(null);
  }

  function saveEmployee() {
    if (!selected || !selected.id) { setMessage('Select an employee first'); return; }
    setMessage('Saving...');
    fetch(`${apiUrl}/update_employee.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...form })
    }).then((r) => r.json()).then((j) => {
      if (j.status === 'success') { setMessage('Saved'); fetchEmployees(); setMode('list'); resetForm(); }
      else setMessage(j.message || 'Save failed');
    }).catch(() => { setMessage('Unable to contact the server. Please try again later.'); });
  }

  function unemploy(id) {
    if (!confirm('Unemploy this user? This will remove their salary and change their role to customer.')) return;
    setMessage('Processing...');
    fetch(`${apiUrl}/unemploy_employee.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then((r) => r.json()).then((j) => {
      if (j.status === 'success') { setMessage('Employee unemployed successfully'); fetchEmployees(); setMode('list'); resetForm(); }
      else setMessage(j.message || 'Operation failed');
    }).catch(() => { setMessage('Unable to contact the server. Please try again later.'); });
  }

  function addEmployee() {
    setMessage('Creating...');
    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      phone_number: form.phone,
      role: form.role,
      shift_schedule: form.shift_schedule,
      salary: form.salary
    };
    fetch(`${apiUrl}/add_employee.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => r.json()).then((j) => {
        if (j.status === 'success') { setMessage('Employee added'); fetchEmployees(); resetForm(); setMode('list'); }
        else setMessage(j.message || 'Add failed');
      }).catch(() => { setMessage('Unable to contact the server. Please try again later.'); });
  }

  function togglePaySelection(id) {
    setSelectedPayIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function selectAllUnpaid() {
    setSelectedPayIds(unpaidEmployees.map((emp) => Number(emp.id)));
  }

  function clearPaySelection() {
    setSelectedPayIds([]);
  }

  async function startSalaryPayment(payAll = false) {
    const ids = payAll ? [] : selectedPayIds;
    if (!payAll && ids.length === 0) {
      setMessage('Choose at least one staff member to pay.');
      return;
    }
    if (!paymentNumber.trim()) {
      setMessage('Enter the admin payment number for the STK prompt.');
      return;
    }

    setPayrollLoading(true);
    setMessage('Sending salary STK prompt...');
    try {
      const response = await fetch(`${apiUrl}/pay_salary.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: sessionStorage.getItem('user_id'),
          payment_phone: paymentNumber,
          employee_ids: ids,
          pay_all: payAll
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPayrollSession({ batchId: data.batchId, checkoutRequestID: data.checkoutRequestID });
        setMessage(`STK prompt sent for KES ${Number(data.totalAmount || 0).toLocaleString()}. Check status after completing it.`);
      } else {
        setMessage(data.message || 'Unable to start salary payment.');
      }
    } catch (error) {
      setMessage('Unable to start salary payment. Please try again later.');
    } finally {
      setPayrollLoading(false);
    }
  }

  async function checkSalaryPayment() {
    if (!payrollSession) return;
    setPayrollLoading(true);
    try {
      const response = await fetch(`${apiUrl}/check_salary_payment.php?batchId=${payrollSession.batchId}`);
      const data = await response.json();
      if (data.status === 'success') {
        if (data.paymentStatus === 'Paid') {
          setMessage('Salary payment confirmed and staff marked as paid.');
          setPayrollSession(null);
          setSelectedPayIds([]);
          fetchEmployees();
        } else if (data.paymentStatus === 'Failed') {
          setMessage('Salary payment failed or was cancelled.');
        } else {
          setMessage('Salary payment is still pending. Try again in a few seconds.');
        }
      } else {
        setMessage(data.message || 'Unable to check salary payment.');
      }
    } catch (error) {
      setMessage('Unable to verify salary payment right now.');
    } finally {
      setPayrollLoading(false);
    }
  }

  const renderRoleSelect = () => (
    <select name="role" value={form.role} onChange={handleField}>
      {STAFF_ROLES.map((staffRole) => (
        <option key={staffRole} value={staffRole}>{roleLabel(staffRole)}</option>
      ))}
    </select>
  );

  return (
    <div className="upload-container">
      <div className="upload-content manage-employees-content">
        <h1 className="manage-title">Manage Employees</h1>
        <div className="manage-actions">
          <button className={`btn btn-primary ${mode === 'list' ? 'active' : ''}`} onClick={() => { setMode('list'); resetForm(); }}>View Employees</button>
          <button className={`btn btn-secondary ${mode === 'add' ? 'active' : ''}`} onClick={() => { setMode('add'); resetForm(); }}>Add Employee</button>
          <button className={`btn btn-secondary ${mode === 'customize' ? 'active' : ''}`} onClick={() => { if (!selected) { setMessage('Select an employee from the list'); } else setMode('customize'); }}>Edit Employee</button>
          <button className={`btn btn-secondary ${mode === 'pay' ? 'active' : ''}`} onClick={() => { setMode('pay'); setMessage(''); }}>Pay Salary</button>
        </div>

        {message && <div className="form-message">{message}</div>}
        {loading && <p className="loading-text">Loading employees...</p>}

        {mode === 'list' && (
          <div className="product-management">
            <div className="product-management-header">
              <h2>Employees</h2>
              <p className="admin-help-text">Tap an employee to customize, unemploy, or review salary status.</p>
            </div>
            <div className="product-grid-admin employee-grid-admin">
              {employees.length === 0 && <div className="empty-text">No employees found.</div>}
              {employees.map((emp) => (
                <div key={emp.id} className="product-card employee-card">
                  <div className="product-card-image">
                    <img src={emp.profile_image_url || '/projectpics/default.png'} alt="profile" />
                  </div>
                  <div className="product-card-body">
                    <div>
                      <h3>{emp.full_name}</h3>
                      <p>{roleLabel(emp.role)} - {emp.phone}</p>
                      <p>Salary: KES {Number(emp.salary || 0).toLocaleString()} - {emp.salary_status || 'Unpaid'}</p>
                    </div>
                    <div className="product-card-meta">
                      <div className="employee-card-actions">
                        <button className="btn btn-secondary" onClick={() => handleSelect(emp)}>Customize</button>
                        <button className="btn btn-delete" onClick={() => unemploy(emp.id)}>Unemploy</button>
                      </div>
                      <div className="card-price">Joined: {emp.created_at || 'n/a'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'pay' && (
          <div className="product-management payroll-panel">
            <div className="product-management-header">
              <h2>Pay Salary</h2>
              <p className="admin-help-text">Select staff or pay everyone currently unpaid for this month.</p>
            </div>

            <div className="payroll-summary-row">
              <div>
                <span className="payroll-label">Selected total</span>
                <strong>KES {selectedTotal.toLocaleString()}</strong>
              </div>
              <div>
                <span className="payroll-label">Unpaid staff</span>
                <strong>{unpaidEmployees.length}</strong>
              </div>
            </div>

            <div className="upload-form payroll-form">
              <div className="form-group">
                <label>Admin payment number</label>
                <input value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} placeholder="2547XXXXXXXX" />
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={selectAllUnpaid} disabled={payrollLoading}>Select All Unpaid</button>
                <button className="btn btn-secondary" onClick={clearPaySelection} disabled={payrollLoading}>Clear</button>
                <button className="btn btn-primary" onClick={() => startSalaryPayment(false)} disabled={payrollLoading}>Pay Selected</button>
                <button className="btn btn-primary" onClick={() => startSalaryPayment(true)} disabled={payrollLoading}>Pay Everyone</button>
              </div>
              {payrollSession && (
                <div className="payroll-session">
                  <p>Payroll batch #{payrollSession.batchId}</p>
                  <button className="btn btn-secondary" onClick={checkSalaryPayment} disabled={payrollLoading}>Check Salary Payment</button>
                </div>
              )}
            </div>

            <div className="payroll-list">
              {payrollEmployees.map((emp) => {
                const isPaid = emp.salary_status === 'Paid';
                const checked = selectedPayIds.includes(Number(emp.id));
                return (
                  <label key={emp.id} className={`payroll-row ${isPaid ? 'paid' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPaid || payrollLoading}
                      onChange={() => togglePaySelection(Number(emp.id))}
                    />
                    <span>
                      <strong>{emp.full_name}</strong>
                      <small>{roleLabel(emp.role)} - {emp.salary_status || 'Unpaid'}</small>
                    </span>
                    <b>KES {Number(emp.salary || 0).toLocaleString()}</b>
                  </label>
                );
              })}
              {payrollEmployees.length === 0 && <div className="empty-text">No salaried staff found.</div>}
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
              {renderRoleSelect()}
            </div>
            <div className="form-group">
              <label>Shift schedule</label>
              <input name="shift_schedule" value={form.shift_schedule} onChange={handleField} placeholder="e.g. Morning / Afternoon" />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input name="salary" type="number" min="0" step="0.01" value={form.salary} onChange={handleField} placeholder="0.00" />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={addEmployee}>Add Employee</button>
              <button className="btn btn-secondary" onClick={() => { setMode('list'); resetForm(); }}>Cancel</button>
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
              {renderRoleSelect()}
            </div>
            <div className="form-group">
              <label>Shift schedule</label>
              <input name="shift_schedule" value={form.shift_schedule} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Salary</label>
              <input name="salary" type="number" min="0" step="0.01" value={form.salary} onChange={handleField} placeholder="0.00" />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={saveEmployee}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => { setMode('list'); resetForm(); }}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
