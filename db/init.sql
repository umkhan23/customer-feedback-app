CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feedback (name, email, message)
VALUES
('Ava Johnson', 'ava@example.com', 'The onboarding experience was clean and easy to follow.'),
('Marcus Lee', 'marcus@example.com', 'I would like richer reporting and export options.'),
('Demo XSS User', 'xss@example.com', $$<img src=x onerror="console.log('Intentional demo XSS executed')">$$);
