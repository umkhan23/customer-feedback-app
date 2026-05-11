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

function formatDate(value) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function summarizeFeedback(records) {
  if (!records.length) {
    return 'There are no feedback records saved yet.';
  }

  const recent = records.slice(0, 3).map((item) => `${item.name} on ${formatDate(item.created_at)}: "${item.message}"`);
  return `There are ${records.length} saved feedback records. The latest notes are:\n${recent.map((line) => `- ${line}`).join('\n')}`;
}

function sentimentFor(message) {
  const text = message.toLowerCase();
  const positiveWords = ['clean', 'easy', 'great', 'good', 'love', 'helpful', 'fast', 'better', 'excellent'];
  const negativeWords = ['bad', 'broken', 'slow', 'confusing', 'hard', 'issue', 'problem', 'error', 'bug', 'would like'];
  const positive = positiveWords.filter((word) => text.includes(word)).length;
  const negative = negativeWords.filter((word) => text.includes(word)).length;

  if (positive > negative) return 'positive';
  if (negative > positive) return 'needs attention';
  return 'neutral';
}

function keywordSummary(records) {
  const stopWords = new Set(['the', 'and', 'for', 'was', 'with', 'that', 'this', 'from', 'have', 'more', 'like', 'would', 'your', 'you', 'are', 'but', 'not', 'can', 'our', 'they', 'their', 'what', 'when', 'where']);
  const counts = {};

  records.forEach((item) => {
    item.message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .forEach((word) => {
        counts[word] = (counts[word] || 0) + 1;
      });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => `${word} (${count})`);
}

function answerFeedbackQuestion(question, records) {
  const normalized = question.toLowerCase();

  if (!records.length) {
    return {
      answer: 'I do not see any saved feedback records yet. Once customers submit feedback, I can summarize trends, find records, and answer questions about them.',
      sources: []
    };
  }

  if (normalized.includes('total') || normalized.includes('how many') || normalized.includes('count')) {
    return {
      answer: `There are ${records.length} feedback records saved right now.`,
      sources: records.slice(0, 3)
    };
  }

  if (normalized.includes('latest') || normalized.includes('recent') || normalized.includes('newest')) {
    const latest = records.slice(0, 5);
    return {
      answer: `The most recent feedback is:\n${latest.map((item) => `- ${item.name} (${formatDate(item.created_at)}): ${item.message}`).join('\n')}`,
      sources: latest
    };
  }

  if (normalized.includes('sentiment') || normalized.includes('positive') || normalized.includes('negative') || normalized.includes('happy')) {
    const groups = records.reduce((acc, item) => {
      const sentiment = sentimentFor(item.message);
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});
    return {
      answer: `A quick read shows ${groups.positive || 0} positive, ${groups.neutral || 0} neutral, and ${groups['needs attention'] || 0} needing attention. This is a lightweight keyword-based analysis, so it is best treated as a directional signal.`,
      sources: records.slice(0, 5)
    };
  }

  if (normalized.includes('trend') || normalized.includes('theme') || normalized.includes('common') || normalized.includes('summary') || normalized.includes('summarize')) {
    const keywords = keywordSummary(records);
    return {
      answer: `${summarizeFeedback(records)}\n\nCommon themes I found: ${keywords.length ? keywords.join(', ') : 'not enough repeated terms yet'}.`,
      sources: records.slice(0, 5)
    };
  }

  const questionWords = normalized
    .replace(/[^a-z0-9\s@.]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const matches = records.filter((item) => {
    const haystack = `${item.name} ${item.email} ${item.message}`.toLowerCase();
    return questionWords.some((word) => haystack.includes(word));
  });

  if (matches.length) {
    return {
      answer: `I found ${matches.length} matching feedback record${matches.length === 1 ? '' : 's'}:\n${matches.slice(0, 5).map((item) => `- ${item.name} (${item.email}): ${item.message}`).join('\n')}`,
      sources: matches.slice(0, 5)
    };
  }

  return {
    answer: `${summarizeFeedback(records)}\n\nI could not find a direct match for that question, so I gave you the current high-level picture instead.`,
    sources: records.slice(0, 5)
  };
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

app.post('/api/admin/assistant', requireAdmin, async (req, res) => {
  const question = (req.body.question || '').trim();

  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, email, message, created_at
      FROM feedback
      ORDER BY created_at DESC
    `);
    const response = answerFeedbackQuestion(question, result.rows);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Assistant failed to analyze feedback', details: err.message });
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
