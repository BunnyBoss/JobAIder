from __future__ import annotations

from typing import Any

from app.modules.llm_provider import LLMProvider


def _as_strings(value: Any) -> set[str]:
    if value is None:
        return set()
    if isinstance(value, dict):
        strings: set[str] = set()
        for key, nested in value.items():
            strings.add(str(key).lower())
            strings |= _as_strings(nested)
        return strings
    if isinstance(value, list | tuple | set):
        strings = set()
        for item in value:
            strings |= _as_strings(item)
        return strings
    if isinstance(value, str):
        return {part.strip().lower() for part in value.replace("\n", ",").split(",") if part.strip()}
    return {str(value).lower()}


def _score_overlap(profile_skills: set[str], role_skills: set[str]) -> int:
    if not role_skills:
        return 50
    return round(100 * len(profile_skills & role_skills) / len(role_skills))


def fallback_gap_analysis(profile: dict[str, Any], role: dict[str, Any]) -> dict[str, Any]:
    profile_skills = _as_strings(profile.get("skills"))
    role_skills = _as_strings(role.get("required_skills"))
    skills_match = _score_overlap(profile_skills, role_skills)
    matching = sorted(profile_skills & role_skills)
    missing = sorted(role_skills - profile_skills)
    overall = round((skills_match * 0.45) + 25 + 15 + 10)
    return {
        "overall_match_score": min(100, overall),
        "skills_match": skills_match,
        "experience_match": 50,
        "domain_match": 50,
        "leadership_match": 50,
        "matching_skills": matching,
        "missing_skills": missing,
        "strengths": [
            f"Demonstrates proficiency in {skill}" for skill in matching[:5]
        ] if matching else ["Profile provided for analysis."],
        "suitability_summary": f"The candidate matches {len(matching)} of {len(role_skills)} required skills."
        if role_skills else "Unable to determine suitability without role skill requirements.",
        "evidence_mapping": [
            {
                "requirement": skill,
                "evidence": "No explicit evidence found" if skill in missing else "Profile skill match",
                "confidence": "Low" if skill in missing else "Medium",
            }
            for skill in sorted(role_skills)
        ],
        "quick_wins": ["Add evidence-backed bullets for matching skills.", "Move role keywords into Skills."],
        "skills_to_learn": [
            {"skill": skill, "estimated_effort": "2-5 days", "reason": "Required by target role"}
            for skill in missing[:5]
        ],
        "portfolio_projects": [
            {
                "project": "Small role-aligned proof project",
                "estimated_impact": "Medium",
                "reason": "Creates evidence for missing requirements.",
            }
        ],
    }


async def analyze_gap(profile: dict[str, Any], role: dict[str, Any]) -> dict[str, Any]:
    fallback = fallback_gap_analysis(profile, role)
    prompt = f"""
Compare this professional profile against the target role. Return JSON with:
overall_match_score, skills_match, experience_match, domain_match, leadership_match,
matching_skills (list of skills the candidate already has that match the role),
missing_skills (list of skills the role requires that the candidate lacks),
strengths (list of 3-6 strings describing what makes this candidate suited for the role),
suitability_summary (a 2-4 sentence paragraph explaining why this candidate is or isn't a good fit),
evidence_mapping, quick_wins, skills_to_learn, portfolio_projects.
Scores must be 0-100. Evidence mapping entries need requirement, evidence, confidence.

Profile:
{profile}

Role:
{role}
"""
    result = await LLMProvider().chat_json(
        "You are a precise career gap analyst. Be helpful but do not flatter. Highlight both strengths and gaps objectively.",
        prompt,
        fallback,
    )
    return _normalize_gap_analysis(result)


def _normalize_gap_analysis(analysis: dict[str, Any]) -> dict[str, Any]:
    """Normalize gap analysis to ensure all fields have correct types."""
    def to_string(val):
        """Convert value to string, extracting text from dicts if needed."""
        if isinstance(val, str):
            return val
        if isinstance(val, dict):
            return (val.get("description") or val.get("text") or val.get("content") or str(val)).strip()
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
    
    def to_int(val, default=0):
        """Convert value to int."""
        try:
            return int(val) if val is not None else default
        except (ValueError, TypeError):
            return default
    
    normalized = {
        "overall_match_score": to_int(analysis.get("overall_match_score"), 0),
        "skills_match": to_int(analysis.get("skills_match"), 0),
        "experience_match": to_int(analysis.get("experience_match"), 0),
        "domain_match": to_int(analysis.get("domain_match"), 0),
        "leadership_match": to_int(analysis.get("leadership_match"), 0),
        "matching_skills": to_string_list(analysis.get("matching_skills", [])),
        "missing_skills": to_string_list(analysis.get("missing_skills", [])),
        "strengths": to_string_list(analysis.get("strengths", [])),
        "suitability_summary": to_string(analysis.get("suitability_summary", "")),
        "evidence_mapping": analysis.get("evidence_mapping", []),  # Keep as-is, usually already structured
        "quick_wins": to_string_list(analysis.get("quick_wins", [])),
        "skills_to_learn": analysis.get("skills_to_learn", []),  # Keep as-is, usually already structured
        "portfolio_projects": analysis.get("portfolio_projects", []),  # Keep as-is, usually already structured
    }
    return normalized

