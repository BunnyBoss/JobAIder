from __future__ import annotations

import re
import json

from app.modules.llm_provider import LLMProvider


COMMON_TECH = [
    "python",
    "typescript",
    "react",
    "next.js",
    "fastapi",
    "sql",
    "aws",
    "azure",
    "docker",
    "kubernetes",
    "llm",
    "rag",
    "machine learning",
    "api",
    "microservices",
]


def _fallback_role(content: str) -> dict:
    lower = content.lower()
    technologies = sorted({tech for tech in COMMON_TECH if tech in lower})
    bullets = [line.strip("-• ").strip() for line in content.splitlines() if len(line.strip()) > 20]
    seniority = "Senior" if re.search(r"\bsenior|lead|staff|principal\b", lower) else "Mid/Unknown"
    return {
        "role_summary": bullets[0][:300] if bullets else "Role summary extracted from supplied text.",
        "required_skills": technologies[:8],
        "nice_to_have_skills": [],
        "responsibilities": bullets[:8],
        "technologies": technologies,
        "domain_knowledge": [],
        "seniority_level": seniority,
        "domain_focus": "Unknown",
    }


def _fallback_metadata(content: str) -> dict:
    """Extract role title and company from JD text."""
    lines = content.strip().split("\n")
    title = "Target Role"
    company = "Unknown Company"
    
    # Try to find company in first few lines
    for line in lines[:5]:
        if any(word in line.lower() for word in ["company", "hiring", "at ", "for "]):
            company = line.strip().strip("- •:").strip()[:100]
            break
    
    # Try to find job title in first few lines
    for line in lines[:10]:
        if any(word in line.lower() for word in ["engineer", "manager", "analyst", "developer", "designer", "specialist", "role", "position", "job"]):
            title = line.strip().strip("- •:").strip()[:100]
            if "job" not in title.lower() and "position" not in title.lower():
                break
    
    return {"title": title, "company": company}


async def extract_role_metadata(content: str) -> dict:
    """Extract role title and company from JD text using LLM."""
    fallback = _fallback_metadata(content)
    prompt = f"""
Extract the job title and company name from this job description.
Return JSON with exactly these keys: title, company
Title should be the role/position name (e.g., "Senior Python Engineer")
Company should be the company hiring (e.g., "Acme Corp")

JD:
{content[:3000]}
"""
    try:
        result = await LLMProvider().chat_json(
            "Extract job title and company from job descriptions.",
            prompt,
            fallback,
        )
        return {
            "title": str(result.get("title", fallback["title"]))[:100],
            "company": str(result.get("company", fallback["company"]))[:100],
        }
    except Exception:
        return fallback


def _normalize_role_analysis(analysis: dict) -> dict:
    """Normalize role analysis to ensure all expected fields are strings or arrays of strings."""
    def to_string(val):
        """Convert value to string, extracting text from dicts if needed."""
        if isinstance(val, str):
            return val
        if isinstance(val, dict):
            # For responsibility-like dicts with 'category' and 'tasks'
            if "category" in val and "tasks" in val:
                tasks = val.get("tasks", [])
                if isinstance(tasks, list):
                    tasks_str = " | ".join(str(t) for t in tasks if t)
                else:
                    tasks_str = str(tasks)
                return f"{val['category']}: {tasks_str}".strip()
            # Try other common fields
            return (val.get("description") or val.get("title") or val.get("text") or val.get("content") or str(val)).strip()
        if val is None:
            return ""
        return str(val).strip()
    
    def to_string_list(val):
        """Convert value to list of strings."""
        if isinstance(val, list):
            return [to_string(item) for item in val if item]
        if val:
            return [to_string(val)]
        return []
    
    normalized = {
        "role_summary": to_string(analysis.get("role_summary", "")),
        "required_skills": to_string_list(analysis.get("required_skills", [])),
        "nice_to_have_skills": to_string_list(analysis.get("nice_to_have_skills", [])),
        "responsibilities": to_string_list(analysis.get("responsibilities", [])),
        "technologies": to_string_list(analysis.get("technologies", [])),
        "domain_knowledge": to_string_list(analysis.get("domain_knowledge", [])),
        "seniority_level": to_string(analysis.get("seniority_level", "")),
        "domain_focus": to_string(analysis.get("domain_focus", "")),
    }
    return normalized


async def analyze_role(content: str) -> dict:
    fallback = _fallback_role(content)
    prompt = f"""
Analyze this target role or company material. Return JSON with:
role_summary, required_skills, nice_to_have_skills, responsibilities,
technologies, domain_knowledge, seniority_level, domain_focus.

Material:
{content[:60000]}
"""
    result = await LLMProvider().chat_json(
        "You analyze job descriptions for resume tailoring and interview preparation.",
        prompt,
        fallback,
    )
    return _normalize_role_analysis(result)

