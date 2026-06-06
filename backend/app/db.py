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
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_text TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gap_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  mode TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question_count INTEGER DEFAULT 3,
  history_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS improvement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gap_analysis_id INTEGER NOT NULL,
  profile_id INTEGER,
  role_analysis_id INTEGER,
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
"""


MIGRATIONS = [
    ("interview_sessions", "question_count", "ALTER TABLE interview_sessions ADD COLUMN question_count INTEGER DEFAULT 3"),
]


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
