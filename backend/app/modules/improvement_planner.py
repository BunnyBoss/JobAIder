from __future__ import annotations

from typing import Any

from app.modules.llm_provider import LLMProvider


def _fallback_plan(gap_analysis: dict[str, Any], profile: dict[str, Any], role: dict[str, Any]) -> dict:
    """Create a fallback improvement plan."""
    missing_skills = gap_analysis.get("missing_skills", [])
    match_score = gap_analysis.get("overall_match_score", 0)
    
    quick_wins = [
        "Update resume with role-specific keywords from job description",
        "Rewrite professional summary to highlight relevant achievements",
        "Reorganize experience bullets to emphasize role-critical skills",
        "Add quantified metrics to existing projects",
    ]
    
    skills_to_learn = [
        {"skill": skill, "effort": "2-4 weeks", "resources": ["Online course", "Practice projects"]}
        for skill in missing_skills[:5]
    ]
    
    projects_to_build = [
        {"title": f"Build proof project for {missing_skills[0] if missing_skills else 'core skill'}", "description": "Create a compact project showcasing the most critical missing skill", "timeline": "2-4 weeks"},
        {"title": "Contribute to open source", "description": "Demonstrate skills through real-world contributions", "timeline": "Ongoing"},
    ]
    
    return {
        "overall_score": match_score,
        "improvement_potential": 100 - int(match_score),
        "quick_wins": quick_wins,
        "skills_to_learn": skills_to_learn,
        "projects_to_build": projects_to_build,
        "estimated_weeks": 8,
        "priority_order": ["quick wins", "critical skills", "portfolio projects"],
    }


async def generate_improvement_plan(
    gap_analysis: dict[str, Any],
    profile: dict[str, Any],
    role: dict[str, Any]
) -> dict[str, Any]:
    """Generate a structured improvement plan from gap analysis."""
    fallback = _fallback_plan(gap_analysis, profile, role)
    
    prompt = f"""
Based on this gap analysis between a professional profile and a target role,
generate a structured improvement plan with specific, actionable steps.

Return JSON with:
- overall_score (current match percentage)
- improvement_potential (percentage points to gain)
- quick_wins (list of 3-5 immediate resume/application improvements)
- skills_to_learn (list of critical skills with effort estimates)
- projects_to_build (list of portfolio projects to build)
- estimated_weeks (total timeline)
- priority_order (recommended order of work)

Gap Analysis:
{gap_analysis}

Profile Summary:
{profile.get("summary", "Unknown")}

Role Requirements:
{role.get("role_summary", "Unknown")}

Missing Skills:
{', '.join(gap_analysis.get("missing_skills", []))}
"""
    
    return await LLMProvider().chat_json(
        "Create actionable improvement plans to close skill gaps and increase job match.",
        prompt,
        fallback,
    )
