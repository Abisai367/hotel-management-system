import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from './apiUrl.js';
import { normalizeRole, roleLabel } from './roles.js';
import './StaffDashboard.css';

const ranges = [
  ['today', 'Day'],
  ['week', 'Week'],
  ['month', 'Month'],
  ['year', 'Year'],
];

export default function StaffDashboard() {
  const apiUrl = getApiUrl();
  const userId = sessionStorage.getItem('user_id');
  const storedRole = sessionStorage.getItem('user_role');
  const [range, setRange] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [transferTo, setTransferTo] = useState({});

  const role = normalizeRole(data?.user?.role || storedRole);
  const isDelivery = role === 'delivery person';
  const canSupervise = ['supervisor', 'manager', 'admin'].includes(role);
  const dashboardTitle = canSupervise
    ? 'Supervisor Work Dashboard'
    : isDelivery
      ? 'Delivery Dashboard'
      : 'Waiter Dashboard';

  const activeAssignments = data?.assignments || [];
  const supervisorAssignments = data?.supervisor?.assignments || [];
  const staff = data?.supervisor?.staff || [];

  const staffByWorkType = useMemo(() => {
    return staff.reduce((grouped, person) => {
      const personRole = normalizeRole(person.role);
      if (personRole === 'waiter') {
        grouped.dineIn.push(person);
      }
      if (personRole === 'delivery person') {
        grouped.delivery.push(person);
      }
      return grouped;
    }, { dineIn: [], delivery: [] });
  }, [staff]);

  async function loadDashboard(nextRange = range) {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/staff_dashboard.php?employee_id=${userId}&role=${encodeURIComponent(storedRole || '')}&range=${nextRange}`);
      const json = await response.json();
      if (json.status === 'success') {
        setData(json);
        setMessage('');
        sessionStorage.setItem('user_role', json.user.role);
        sessionStorage.setItem('salary', json.user.salary || 0);
      } else {
        setMessage(json.message || 'Unable to load staff dashboard.');
      }
    } catch (error) {
      setMessage('Unable to load staff dashboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(range);
  }, [range]);

  async function completeAssignment(assignmentId) {
    setMessage('Completing assignment...');
    try {
      const response = await fetch(`${apiUrl}/complete_assignment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId, employee_id: userId })
      });
      const json = await response.json();
      if (json.status === 'success') {
        setMessage('Assignment completed.');
        loadDashboard(range);
      } else {
        setMessage(json.message || 'Unable to complete assignment.');
      }
    } catch (error) {
      setMessage('Unable to complete assignment right now.');
    }
  }

  async function transferAssignment(assignmentId) {
    const toEmployeeId = transferTo[assignmentId];
    if (!toEmployeeId) {
      setMessage('Choose who should receive the work.');
      return;
    }

    setMessage('Transferring assignment...');
    try {
      const response = await fetch(`${apiUrl}/transfer_assignment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          to_employee_id: toEmployeeId,
          supervisor_id: userId
        })
      });
      const json = await response.json();
      if (json.status === 'success') {
        setMessage('Assignment transferred.');
        setTransferTo((current) => ({ ...current, [assignmentId]: '' }));
        loadDashboard(range);
      } else {
        setMessage(json.message || 'Unable to transfer assignment.');
      }
    } catch (error) {
      setMessage('Unable to transfer assignment right now.');
    }
  }

  const renderAssignment = (assignment, options = {}) => (
    <article className="assignment-card" key={assignment.assignment_id}>
      <div className="assignment-card-main">
        <div>
          <span className="assignment-type">{assignment.work_type === 'delivery' ? 'Delivery' : 'Dine In'}</span>
          <h3>
            {assignment.work_type === 'delivery'
              ? assignment.delivery_address || 'Delivery address'
              : `Table ${assignment.table_number || 'n/a'}`}
          </h3>
          <p>{assignment.customer_name || `Customer #${assignment.customer_id}`} · {assignment.items || 'Order items'}</p>
        </div>
        <div className="assignment-status">
          <strong>{assignment.assignment_status}</strong>
          <span>{assignment.payment_status || 'Pending payment'}</span>
        </div>
      </div>

      <div className="assignment-meta">
        <span>Assigned: {assignment.assigned_at || 'n/a'}</span>
        {assignment.contact_number && <span>Contact: {assignment.contact_number}</span>}
        {options.showAssignee && <span>Assigned to: {assignment.assigned_employee || 'Unassigned'}</span>}
      </div>

      <div className="assignment-actions">
        {!options.showTransfer && (
          <button className="staff-primary-button" onClick={() => completeAssignment(assignment.assignment_id)}>
            Mark Complete
          </button>
        )}
        {options.showTransfer && (
          <>
            <select
              value={transferTo[assignment.assignment_id] || ''}
              onChange={(event) => setTransferTo((current) => ({ ...current, [assignment.assignment_id]: event.target.value }))}
            >
              <option value="">Transfer to...</option>
              {(staffByWorkType[assignment.work_type] || []).map((person) => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>
            <button className="staff-secondary-button" onClick={() => transferAssignment(assignment.assignment_id)}>
              Transfer
            </button>
            <button className="staff-primary-button" onClick={() => completeAssignment(assignment.assignment_id)}>
              Complete
            </button>
          </>
        )}
      </div>
    </article>
  );

  if (loading) return <div className="staff-dashboard staff-loading">Loading staff dashboard...</div>;

  return (
    <main className="staff-dashboard">
      <section className="staff-hero">
        <div>
          <p className="staff-kicker">{roleLabel(role)}</p>
          <h1>{dashboardTitle}</h1>
          <p className="staff-copy">
            {canSupervise ? 'Balance active work across waiters and delivery staff.' : 'Your active requests and salary status.'}
          </p>
        </div>
        <div className="staff-range">
          <label>Range</label>
          <select value={range} onChange={(event) => setRange(event.target.value)}>
            {ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </section>

      {message && <div className="staff-message">{message}</div>}

      <section className="staff-stat-grid">
        <div className="staff-stat-card">
          <span>Served Customers</span>
          <strong>{data?.stats?.servedCustomers || 0}</strong>
        </div>
        <div className="staff-stat-card">
          <span>Active Requests</span>
          <strong>{data?.stats?.activeAssignments || 0}</strong>
        </div>
        <div className="staff-stat-card">
          <span>Salary</span>
          <strong>KES {Number(data?.user?.salary || 0).toLocaleString()}</strong>
          <small>{data?.user?.salary_status || 'Unpaid'}</small>
        </div>
      </section>

      {!canSupervise && (
        <section className="staff-section">
          <div className="staff-section-header">
            <h2>{isDelivery ? 'Delivery Requests' : 'Table Requests'}</h2>
            <button className="staff-secondary-button" onClick={() => loadDashboard(range)}>Refresh</button>
          </div>
          <div className="assignment-list">
            {activeAssignments.map((assignment) => renderAssignment(assignment))}
            {activeAssignments.length === 0 && <div className="staff-empty">No active requests right now.</div>}
          </div>
        </section>
      )}

      {canSupervise && (
        <section className="staff-section">
          <div className="staff-section-header">
            <h2>Active Assignments</h2>
            <button className="staff-secondary-button" onClick={() => loadDashboard(range)}>Rebalance / Refresh</button>
          </div>
          <div className="assignment-list">
            {supervisorAssignments.map((assignment) => renderAssignment(assignment, { showTransfer: true, showAssignee: true }))}
            {supervisorAssignments.length === 0 && <div className="staff-empty">No active waiter or delivery assignments.</div>}
          </div>
        </section>
      )}
    </main>
  );
}
