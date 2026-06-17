from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import get_settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_text TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE SET NULL,
  FOREIGN KEY (role_analysis_id) REFERENCES role_analyses (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS gap_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE SET NULL,
  FOREIGN KEY (role_analysis_id) REFERENCES role_analyses (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  mode TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question_count INTEGER DEFAULT 3,
  history_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE SET NULL,
  FOREIGN KEY (role_analysis_id) REFERENCES role_analyses (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS improvement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gap_analysis_id INTEGER NOT NULL,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (gap_analysis_id) REFERENCES gap_analyses (id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE SET NULL,
  FOREIGN KEY (role_analysis_id) REFERENCES role_analyses (id) ON DELETE SET NULL
);
"""


MIGRATIONS = [
    ("interview_sessions", "question_count", "ALTER TABLE interview_sessions ADD COLUMN question_count INTEGER DEFAULT 3"),
    ("documents", "user_id", "ALTER TABLE documents ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("profiles", "user_id", "ALTER TABLE profiles ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("role_analyses", "user_id", "ALTER TABLE role_analyses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("resumes", "user_id", "ALTER TABLE resumes ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("gap_analyses", "user_id", "ALTER TABLE gap_analyses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("interview_sessions", "user_id", "ALTER TABLE interview_sessions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
    ("improvement_plans", "user_id", "ALTER TABLE improvement_plans ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1"),
]


def _ensure_default_user(conn: sqlite3.Connection) -> None:
    """Create a default admin user (user_id=1) if no users exist, so legacy data is always owned."""
    row = conn.execute("SELECT COUNT(*) FROM users").fetchone()
    if row[0] == 0:
        import hashlib
        # Use a bcrypt-compatible placeholder; user should reset via signup
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (1, 'admin', 'admin@jobaider.local', '$2b$12$placeholder_reset_required', ?)",
            (datetime.now(UTC).isoformat(),),
        )
        conn.commit()


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def encode_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def decode_json(data: str) -> Any:
    return json.loads(data) if data else None


def init_db() -> None:
    path = get_settings().resolved_db_path
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SCHEMA)
        for table, column, statement in MIGRATIONS:
            columns = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
            if column not in columns:
                conn.execute(statement)
        _ensure_default_user(conn)
        conn.commit()


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    init_db()
    conn = sqlite3.connect(get_settings().resolved_db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
