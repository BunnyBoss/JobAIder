# JobRadar Database Schema

JobRadar uses local SQLite. Default path:

```text
backend/jobradar.db
```

Override with:

```text
JOBRADAR_DB_PATH=/path/to/jobradar.db
```

## Tables

### settings

Stores model settings edited from the Settings page.

- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

### documents

Stores extracted local documents from the Obsidian vault or uploads.

- `id INTEGER PRIMARY KEY`
- `source_type TEXT NOT NULL`
- `name TEXT NOT NULL`
- `path TEXT`
- `content TEXT NOT NULL`
- `metadata_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

### profiles

Stores unified professional profiles.

- `id INTEGER PRIMARY KEY`
- `name TEXT NOT NULL`
- `summary TEXT NOT NULL`
- `profile_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

### role_analyses

Stores parsed target roles.

- `id INTEGER PRIMARY KEY`
- `title TEXT NOT NULL`
- `company TEXT NOT NULL`
- `source_text TEXT NOT NULL`
- `analysis_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

### resumes

Stores ATS, human-friendly, and tailored resume drafts.

- `id INTEGER PRIMARY KEY`
- `profile_id INTEGER`
- `role_analysis_id INTEGER`
- `kind TEXT NOT NULL`
- `title TEXT NOT NULL`
- `markdown TEXT NOT NULL`
- `metadata_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

### gap_analyses

Stores profile-vs-role analysis.

- `id INTEGER PRIMARY KEY`
- `profile_id INTEGER`
- `role_analysis_id INTEGER`
- `analysis_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`

### interview_sessions

Stores mock interview state and evaluation history.

- `id INTEGER PRIMARY KEY`
- `profile_id INTEGER`
- `role_analysis_id INTEGER`
- `mode TEXT NOT NULL`
- `difficulty TEXT NOT NULL`
- `history_json TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

