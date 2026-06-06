# RoleAIder

Local-first AI job application assistant.

RoleAIder helps you:

- build a professional profile from an Obsidian vault or uploaded files;
- analyze job descriptions and company material;
- generate ATS and human-friendly resumes;
- tailor resumes for a target role;
- run gap analysis and improvement planning;
- practice mock interviews.

## How To Use

Run the backend in one terminal:

```bash
cd /home/poornachandra/Proyecto/DL/Repos/RoleRadar/backend
/home/poornachandra/miniconda3/envs/RoleAIder/bin/uvicorn app.main:app --reload
```

Run the frontend in another terminal:

```bash
cd /home/poornachandra/Proyecto/DL/Repos/RoleRadar/frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

API runs at:

```text
http://localhost:8000
```

## First Workflow

1. Open `User Profile`.
2. Paste your Obsidian vault path or upload/paste resume documents.
3. Click `Build Master Profile`.
4. Open `Role Analysis` and paste a job description.
5. Open `Resume Studio` and generate ATS/human resumes.
6. Generate a tailored resume using the profile ID and role analysis ID.
7. Open `Gap Analysis` to compare your profile with the role.
8. Open `Resume Editor` to edit saved drafts.
9. Open `Interview Prep` to practice for that role.

## LLM Settings

Set these in `backend/.env` or the app Settings page:

```text
MODEL_NAME=
OPENAI_API_KEY=
OPENAI_BASE_URL=
```

Supported providers: OpenAI, OpenRouter, Ollama, LM Studio, Azure OpenAI, or any OpenAI-compatible endpoint.

Without an API key, JobRadar still runs with local fallback extraction and draft generation.

## Project Structure

```text
backend/   FastAPI, SQLite, ingestion, analysis, resume, gap, interview APIs
frontend/  Next.js 15 app with sidebar pages
docs/      API contracts and database schema
```

## Useful Docs

- [API contracts](docs/jobradar-api-contracts.md)
- [Database schema](docs/jobradar-database-schema.md)
- [Original product PDF](JobRadar%20-%20Local-First%20AI%20Job%20Application%20Assistant.pdf)

