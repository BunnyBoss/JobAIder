# JobAIder

JobAIder is a powerful, production-ready AI job application assistant. It helps you build a master professional profile, analyze job descriptions, identify skill gaps, and generate ATS and human-friendly tailored resumes. It ensures privacy by processing data locally, with the option to use external LLM providers securely via API keys.

---

## Features

- **Master Profile Builder:** Extract your skills, experiences, projects, and education directly from your existing resume documents or an Obsidian vault.
- **Role Analysis:** Analyze job descriptions and company context to extract core requirements, responsibilities, and culture.
- **Gap Analysis & Improvement Plan:** Automatically compare your profile to a target role, identify skill gaps, and generate an actionable improvement plan with timelines and resources.
- **Resume Studio:** Generate clean, ATS-optimized, or beautifully formatted human-friendly resumes. Tailor resumes specifically for a target role to maximize your match score.
- **Interview Prep:** Practice with an interactive, AI-driven mock interview tailored to your target role and profile.

---

## Tech Stack

- **Backend:** FastAPI, Python, SQLite (local database), LangChain (for LLM interactions).
- **Frontend:** Next.js 15, React, Tailwind CSS, shadcn/ui.
- **LLM Support:** OpenAI, OpenRouter, Ollama, LM Studio, Azure OpenAI, or any OpenAI-compatible endpoint.

---

## Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- npm or yarn

### 1. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend

# Option A: Using Conda (Recommended)
conda create -n JobAIder python=3.13 -y
conda activate jobaider
pip install -r requirements.txt

# Option B: Using venv
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the `backend` directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

Configure the following variables in your `.env` file:
- `MODEL_NAME`: The model to use (e.g., `gpt-4o-mini`, `llama3`).
- `OPENAI_API_KEY`: Your API key for the LLM provider.
- `OPENAI_BASE_URL`: Base URL for your LLM provider (default: `https://api.openai.com/v1`).
- `JOBAIDER_DB_PATH`: Path to the SQLite database (default: `./jobaider.db`).

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

---

## Running the Application

You will need two terminal windows to run both the backend and frontend simultaneously.

### Start the Backend

In the first terminal, run the FastAPI server:

```bash
cd backend
source venv/bin/activate # If using a virtual environment
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### Start the Frontend

In the second terminal, run the Next.js development server:

```bash
cd frontend
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

---

## Usage Guide

For a detailed walkthrough of each section and how to get the most out of JobAIder, please refer to the [Usage Guide](docs/USAGE.md).

---

## Project Structure

```text
JobAIder/
├── backend/            # FastAPI backend, DB models, and LLM orchestration
│   ├── app/
│   │   ├── core/       # Configuration and DB setup
│   │   ├── modules/    # Domain logic (profile, role, resume, gap, interview)
│   │   └── main.py     # FastAPI application entry point
├── frontend/           # Next.js 15 frontend application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components (UI, layout, forms)
│   ├── lib/            # Utility functions and API client
│   └── tailwind.config.ts # Tailwind CSS configuration
├── docs/               # Additional documentation
└── README.md
```

## Troubleshooting

- **Database Issues:** If you encounter database errors, ensure the `JOBAIDER_DB_PATH` is correct and the directory is writable. You can delete the `jobaider.db` file to start fresh.
- **LLM Connection Errors:** Verify your `OPENAI_API_KEY` and `OPENAI_BASE_URL` in the `backend/.env` file or in the frontend Settings page.
- **Port Conflicts:** Ensure ports 3000 and 8000 are not being used by other applications.
