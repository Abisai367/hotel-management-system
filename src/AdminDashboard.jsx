import React, { useEffect, useState, useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css';
import { getApiUrl } from './apiUrl.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const apiUrl = getApiUrl();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('today');

  const loadData = async (r = 'today') => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin_summary.php?range=${encodeURIComponent(r)}`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json);
        setError(null);
      } else {
        setError(json.message || 'Failed to load summary');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(range); }, [range]);

  const lineChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.labels,
      datasets: [
        { label: 'Dine In', data: data.series.dineIn || [], borderColor: '#0b4a46', backgroundColor: 'rgba(11,74,70,0.06)', tension: 0.3 },
        { label: 'Takeaway', data: data.series.takeAway || [], borderColor: '#d3a42d', backgroundColor: 'rgba(211,164,45,0.06)', tension: 0.3 },
        { label: 'Delivery', data: data.series.delivery || [], borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', tension: 0.3 }
      ]
    };
  }, [data]);

  const pieChart = useMemo(() => {
    if (!data) return null;
    const breakdown = data.breakdown || { dineIn:0, takeAway:0, delivery:0 };
    return {
      labels: ['Dine In','Takeaway','Delivery'],
      datasets: [{ data: [breakdown.dineIn||0, breakdown.takeAway||0, breakdown.delivery||0], backgroundColor: ['#0b4a46','#d3a42d','#2563eb'] }]
    };
  }, [data]);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (error) {
    const isStaticHost = typeof window !== 'undefined' && /github\.io$/i.test(window.location.hostname);
    const fetchProblem = String(error || '').toLowerCase().includes('failed to fetch') || String(error || '').includes('500');
    return (
      <div className="admin-error">
        <div style={{marginBottom:12}}>Error: {error}</div>
        {isStaticHost || fetchProblem ? (
          <div>
            <p>The admin dashboard needs the PHP backend to be reachable.</p>
            <p style={{fontSize:13}}>Possible fixes:</p>
            <ul style={{fontSize:13}}>
              <li>Host the app on a PHP-capable server (XAMPP/WAMP/Apache) and serve the built files together with the <strong>api/</strong> folder.</li>
              <li>Or deploy your PHP backend separately and rebuild the frontend with <code>VITE_API_URL</code> set to the backend base URL (e.g. <code>VITE_API_URL=https://your-backend.com/api</code>).</li>
            </ul>
            <p style={{fontSize:13}}>See the project README for deployment details.</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div>
          <div className="admin-hero-title">Dashboard</div>
          <p className="admin-sub">Sales statistics</p>
        </div>

        <div className="admin-hero-cards">
          <div className="card revenue-card">
            <div className="card-label">Total Revenue</div>
            <div className="card-value">KES {Number(data.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="card orders-card">
            <div className="card-label">Total Orders</div>
            <div className="card-value">{data.totalOrders}</div>
          </div>
          <div className="card customers-card">
            <div className="card-label">New Customers</div>
            <div className="card-value">{data.newCustomers}</div>
          </div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="range-select">
          <label>Range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <div className="admin-grid">
        <section className="panel chart-panel">
          <div className="chart-header">
            <h3>Daily sales</h3>
          </div>
          <div className="chart-wrap">
            {lineChart && <Line data={lineChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />}
          </div>
        </section>

        <aside className="panel side-panel">
          <div className="pie-wrap">
            {pieChart && <Pie data={pieChart} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }} />}
          </div>

          <div className="stats">
            <div className="stat-row"><div>Total Order</div><div className="stat-val">{data.totalOrders}</div></div>
            <div className="stat-row"><div>New Customers</div><div className="stat-val">{data.newCustomers}</div></div>
          </div>

        </aside>
      </div>

      <div className="admin-grid lower">
        <section className="panel employees-panel">
          <h3>Best Employees</h3>
          <ul>
            {(data.employees || []).map((e) => (
              <li key={e.id} className="employee-item">
                <img src={e.profile_image_url || '/projectpics/default.png'} alt="" />
                <div>
                  <div className="emp-name">{e.full_name}</div>
                  <div className="emp-role">{e.role}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel trending-panel">
          <h3>Trending Dishes</h3>
          <ul>
            {(data.trending || []).map((p) => (
              <li key={p.product_id} className="trend-item">
                <img src={p.product_path || '/projectpics/default.png'} alt="" />
                <div>
                  <div className="trend-name">{p.product_name}</div>
                  <div className="trend-count">Orders: {p.orders_count}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
