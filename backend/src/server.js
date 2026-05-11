/*
  SECURITY DEMO WARNING:
  This backend intentionally contains vulnerabilities for local AppSec/Snyk demonstrations.
  Do not deploy this code to any shared, public, staging, or production environment.
*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 3001;

// Intentionally permissive CORS for security scanning/demo purposes.
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json({ limit: '2mb' }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Intentionally hardcoded credentials and weak JWT secret for Snyk demo findings.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'hideme';
const JWT_SECRET = 'super-secret-admin-jwt-key';

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  try {
    // Intentionally vulnerable: raw string interpolation allows SQL injection if request is tampered with.
    // Kept for Snyk Code / interview demo. Secure version would use parameterized queries.
    const query = `INSERT INTO feedback (name, email, message) VALUES ('${name}', '${email}', '${message}') RETURNING *`;
    const result = await pool.query(query);
    res.status(201).json({ saved: true, feedback: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback', details: err.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  // Intentionally insecure auth for demo purposes.
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
    return res.json({ token, user: { username, role: 'admin' } });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/api/admin/feedback', requireAdmin, async (req, res) => {
  const search = req.query.search || '';
  const sort = req.query.sort || 'created_at';
  const direction = req.query.direction || 'DESC';

  try {
    // Intentionally vulnerable: search, sort, and direction are concatenated into SQL.
    // This exists so Snyk and the interview panel have a realistic admin data-access finding to discuss.
    const query = `
      SELECT id, name, email, message, created_at
      FROM feedback
      WHERE name ILIKE '%${search}%'
         OR email ILIKE '%${search}%'
         OR message ILIKE '%${search}%'
      ORDER BY ${sort} ${direction}
    `;
    const result = await pool.query(query);
    res.json({ count: result.rows.length, feedback: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load feedback', details: err.message });
  }
});

app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*)::int AS count FROM feedback');
    const recent = await pool.query("SELECT COUNT(*)::int AS count FROM feedback WHERE created_at > NOW() - INTERVAL '24 hours'");
    res.json({
      totalFeedback: total.rows[0].count,
      last24Hours: recent.rows[0].count,
      riskPosture: 'Demo environment intentionally vulnerable',
      lodashVersion: _.VERSION
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Feedback backend listening on port ${port}`);
});
