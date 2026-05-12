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
  const { name, email, message, stars, age } = req.body;

  if (!name || !email || !message || stars === undefined || age === undefined) {
    return res.status(400).json({ error: 'name, email, message, stars, and age are required' });
  }

  const starsNum = parseInt(stars, 10);
  if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
    return res.status(400).json({ error: 'stars must be an integer between 1 and 5' });
  }

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    return res.status(400).json({ error: 'age must be an integer between 1 and 120' });
  }

  try {
    const query = `INSERT INTO feedback (name, email, message, stars, age) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [name, email, message, starsNum, ageNum]);
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

  if (!['created_at', 'name', 'email', 'stars'].includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort field' });
  }
  
  if (!['DESC', 'ASC'].includes(direction.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid sort direction' });
  }

  try {
    const query = `
      SELECT id, name, email, message, stars, age, created_at
      FROM feedback
      WHERE name ILIKE $1
         OR email ILIKE $1
         OR message ILIKE $1
      ORDER BY ${sort} ${direction}
    `;
    const result = await pool.query(query, [`%${search}%`]);
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
