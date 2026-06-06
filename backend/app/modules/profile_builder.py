from __future__ import annotations

import re
from collections import Counter

from app.modules.llm_provider import LLMProvider


SKILL_HINTS = [
    "python",
    "typescript",
    "javascript",
    "react",
    "next.js",
    "fastapi",
    "django",
    "sql",
    "sqlite",
    "postgres",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "machine learning",
    "llm",
    "rag",
    "data engineering",
    "leadership",
    "stakeholder",
]


def _fallback_profile(text: str) -> dict:
    lower = text.lower()
    skills = sorted({skill for skill in SKILL_HINTS if skill in lower})
    project_lines = [line.strip("- *#") for line in text.splitlines() if "project" in line.lower()]
    cert_lines = [line.strip("- *#") for line in text.splitlines() if "cert" in line.lower()]
    publication_lines = [line.strip("- *#") for line in text.splitlines() if "publication" in line.lower()]

    date_ranges = re.findall(r"(?:19|20)\d{2}\s*[-–]\s*(?:present|current|(?:19|20)\d{2})", text, re.I)
    frequent_terms = Counter(re.findall(r"\b[A-Za-z][A-Za-z+#.]{2,}\b", text))
    top_terms = [term for term, _ in frequent_terms.most_common(20)]

    return {
        "summary": "Draft profile built locally from supplied career documents. Add an API key in Settings for richer extraction.",
        "years_experience": "Unknown",
        "experience": [{"date_range": item, "description": "Detected timeline entry"} for item in date_ranges],
        "projects": [{"name": line[:120], "source": "document"} for line in project_lines[:12]],
        "skills": skills or top_terms[:12],
        "publications": publication_lines[:10],
        "certifications": cert_lines[:10],
        "resume_versions": [line.strip() for line in text.splitlines() if "resume" in line.lower()][:10],
        "career_notes": [],
        "evidence": [],
    }


async def build_profile(text: str) -> dict:
    fallback = _fallback_profile(text)
    prompt = f"""
Build a unified professional profile from these local career documents.
Return JSON with keys: summary, years_experience, experience, projects, skills,
publications, certifications, resume_versions, career_notes, evidence.

Documents:
{text[:60000]}
"""
    return await LLMProvider().chat_json(
        "You extract truthful, evidence-backed professional profiles for job applications.",
        prompt,
        fallback,
    )

