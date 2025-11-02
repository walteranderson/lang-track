-- DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- DROP TABLE IF EXISTS user_credentials;
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id INTEGER PRIMARY KEY NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DROP TABLE IF EXISTS time_entries;
CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_time TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON time_entries (user_id);
CREATE INDEX idx_start_time ON time_entries (start_time);
CREATE INDEX idx_end_time ON time_entries (end_time);
