CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feedback (name, email, message, stars)
VALUES
('Ava Johnson', 'ava@example.com', 'The onboarding experience was clean and easy to follow.', 5),
('Marcus Lee', 'marcus@example.com', 'I would like richer reporting and export options.', 4),
('Demo XSS User', 'xss@example.com', $$<img src=x onerror="console.log('Intentional demo XSS executed')">$$, 3);
