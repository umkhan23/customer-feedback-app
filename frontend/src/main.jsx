import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './styles.css';

const API_BASE = 'http://localhost:3001/api';

function PublicFeedbackForm({ onGoAdmin }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState('');

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'message') setPreview(value);
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', text: 'Saving your feedback...' });
    try {
      await axios.post(`${API_BASE}/feedback`, form);
      setStatus({ type: 'success', text: 'Thank you — your feedback has been recorded.' });
      setForm({ name: '', email: '', message: '' });
      setPreview('');
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.details || 'Unable to save feedback.' });
    }
  };

  return (
    <main className="page-shell public-page">
      <nav className="top-nav">
        <div className="brand-mark">SV</div>
        <div>
          <strong>SignalVoice</strong>
          <span>Customer Experience Portal</span>
        </div>
        <button className="ghost-button" onClick={onGoAdmin}>Admin Portal</button>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Customer Feedback</div>
          <h1>Help us build a better product experience.</h1>
          <p>
            Share what worked, what did not, and where we can improve. Your feedback is routed directly to our customer experience team.
          </p>
          <div className="metric-row">
            <div><strong>24h</strong><span>response goal</span></div>
            <div><strong>100%</strong><span>reviewed</span></div>
            <div><strong>3 min</strong><span>average time</span></div>
          </div>
        </div>

        <form className="card feedback-card" onSubmit={submit}>
          <h2>Submit feedback</h2>
          <label>
            Name
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jordan Smith" required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jordan@example.com" required />
          </label>
          <label>
            Feedback
            <textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us what happened..." required />
          </label>
          <button className="primary-button" type="submit">Submit feedback</button>
          {status && <div className={`status ${status.type}`}>{status.text}</div>}

          <div className="preview-box">
            <span>Live preview</span>
            {/* Intentionally vulnerable: unsafe rendering for Snyk Code / XSS demo. */}
            <div dangerouslySetInnerHTML={{ __html: preview || '<em>Your feedback preview appears here.</em>' }} />
          </div>
        </form>
      </section>
    </main>
  );
}

function AdminLogin({ onLogin, onBack }) {
  const [creds, setCreds] = useState({ username: 'admin', password: 'hideme' });
  const [error, setError] = useState('');

  const login = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/admin/login`, creds);
      localStorage.setItem('adminToken', response.data.token);
      onLogin(response.data.token);
    } catch (_err) {
      setError('Invalid admin credentials');
    }
  };

  return (
    <main className="page-shell admin-login-page">
      <button className="ghost-button back-button" onClick={onBack}>← Back to feedback form</button>
      <form className="card login-card" onSubmit={login}>
        <div className="admin-icon">🔐</div>
        <h1>Administration Portal</h1>
        <p>Review submitted customer feedback and platform signals.</p>
        <label>
          Username
          <input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
        </label>
        <button className="primary-button" type="submit">Sign in</button>
        {error && <div className="status error">{error}</div>}
        <div className="demo-note">Demo credentials are intentionally hardcoded in source: admin / hideme</div>
      </form>
    </main>
  );
}

function AdminDashboard({ token, onLogout }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [direction, setDirection] = useState('DESC');
  const [error, setError] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadData = async () => {
    setError('');
    try {
      const [feedbackResponse, statsResponse] = await Promise.all([
        axios.get(`${API_BASE}/admin/feedback`, { params: { search, sort, direction }, headers }),
        axios.get(`${API_BASE}/admin/stats`, { headers })
      ]);
      setItems(feedbackResponse.data.feedback);
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.response?.data?.details || 'Unable to load admin data.');
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark">SV</div><strong>SignalVoice</strong></div>
        <a className="active">Feedback Inbox</a>
        <a>Analytics</a>
        <a>Security Review</a>
        <a>Settings</a>
        <button className="ghost-button logout" onClick={onLogout}>Logout</button>
      </aside>

      <section className="admin-content">
        <div className="admin-header">
          <div>
            <div className="eyebrow">Admin Dashboard</div>
            <h1>Customer Feedback Inbox</h1>
            <p>Review customer submissions and identify trends across product experience.</p>
          </div>
          <button className="primary-button" onClick={loadData}>Refresh</button>
        </div>

        {stats && (
          <div className="stat-grid">
            <div className="stat-card"><span>Total feedback</span><strong>{stats.totalFeedback}</strong></div>
            <div className="stat-card"><span>Last 24 hours</span><strong>{stats.last24Hours}</strong></div>
            <div className="stat-card"><span>Risk posture</span><strong>Demo</strong></div>
            <div className="stat-card"><span>Lodash</span><strong>{stats.lodashVersion}</strong></div>
          </div>
        )}

        <div className="toolbar card">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, or feedback" />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_at">Created date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
          <button className="secondary-button" onClick={loadData}>Apply</button>
        </div>

        {error && <div className="status error">{error}</div>}

        <div className="feedback-list">
          {items.map((item) => (
            <article className="card feedback-item" key={item.id}>
              <div className="item-header">
                <div>
                  {/* Intentionally vulnerable: unsafe admin rendering of user-supplied fields for XSS demo. */}
                  <h3 dangerouslySetInnerHTML={{ __html: item.name }} />
                  <span dangerouslySetInnerHTML={{ __html: item.email }} />
                </div>
                <time>{new Date(item.created_at).toLocaleString()}</time>
              </div>
              <div className="message" dangerouslySetInnerHTML={{ __html: item.message }} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function App() {
  const [route, setRoute] = useState('public');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  if (route === 'admin' && !token) {
    return <AdminLogin onLogin={(newToken) => { setToken(newToken); setRoute('dashboard'); }} onBack={() => setRoute('public')} />;
  }

  if (route === 'dashboard' || (route === 'admin' && token)) {
    return <AdminDashboard token={token} onLogout={() => { localStorage.removeItem('adminToken'); setToken(null); setRoute('public'); }} />;
  }

  return <PublicFeedbackForm onGoAdmin={() => setRoute('admin')} />;
}

createRoot(document.getElementById('root')).render(<App />);
