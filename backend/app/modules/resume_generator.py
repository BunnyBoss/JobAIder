from __future__ import annotations

import json
from typing import Any

from app.modules.llm_provider import LLMProvider


import re


def _strip_markdown_fences(text: str) -> str:
    """Remove wrapping ```markdown ... ``` fences that LLMs sometimes add."""
    stripped = text.strip()
    # Match ```markdown or ```md or just ``` at the start, and ``` at the end
    pattern = r"^```(?:markdown|md)?\s*\n(.*?)```\s*$"
    m = re.match(pattern, stripped, re.DOTALL)
    if m:
        return m.group(1).strip()
    return text


def _to_string(value: Any) -> str:
    """Convert a value to a string, handling dicts and other types."""
    if isinstance(value, str):
        return _strip_markdown_fences(value)
    if isinstance(value, dict):
        # If it's a dict, try to extract content/text/markdown fields
        if "content" in value:
            return _strip_markdown_fences(str(value["content"]))
        if "text" in value:
            return _strip_markdown_fences(str(value["text"]))
        if "markdown" in value:
            return _strip_markdown_fences(str(value["markdown"]))
        # Otherwise, serialize to JSON
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value)


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple | set):
        return list(value)
    if isinstance(value, dict):
        items: list[Any] = []
        for key, nested in value.items():
            if isinstance(nested, list):
                items.extend(f"{key}: {item}" for item in nested)
            elif isinstance(nested, dict):
                items.append(f"{key}: {nested}")
            elif nested:
                items.append(f"{key}: {nested}")
            else:
                items.append(key)
        return items
    if isinstance(value, str):
        return [part.strip() for part in value.replace("\n", ",").split(",") if part.strip()]
    return [value]


def _label(item: Any) -> str:
    if isinstance(item, dict):
        return str(item.get("name") or item.get("title") or item.get("skill") or item)
    return str(item)


def _skills(profile: dict[str, Any]) -> str:
    skills = _as_list(profile.get("skills"))
    return ", ".join(_label(skill) for skill in skills[:30]) or "Add verified skills"


def fallback_ats_resume(profile: dict[str, Any]) -> str:
    return f"""# ATS Resume

## Summary

{profile.get("summary", "Professional summary pending.")}

## Skills

{_skills(profile)}

## Experience

Add experience bullets from the master profile. Use action, scope, and result.

## Projects

{chr(10).join(f"- {_label(p)}" for p in _as_list(profile.get("projects"))[:6]) or "- Add strongest projects"}

## Education

Add education.

## Certifications

{chr(10).join(f"- {_label(c)}" for c in _as_list(profile.get("certifications"))[:6]) or "- Add relevant certifications"}
"""


def fallback_human_resume(profile: dict[str, Any]) -> str:
    return f"""# Human-Friendly Resume

## Profile

{profile.get("summary", "Professional summary pending.")}

## What I Bring

- Core skills: {_skills(profile)}
- Evidence-backed projects and achievements should be added from the profile inventory.

## Selected Work

{chr(10).join(f"### {_label(p)}{chr(10)}- Impact: add measurable result." for p in _as_list(profile.get("projects"))[:4]) or "Add selected work."}
"""


async def generate_generic_resumes(profile: dict[str, Any], custom_instructions: str | None = None) -> tuple[str, str]:
    instruction_block = f"\nUser Custom Instructions:\n{custom_instructions}\n" if custom_instructions else ""
    prompt = f"""
Generate two Markdown resumes from this professional profile:
1. ats_resume: ATS optimized, plain formatting, keyword supported.
2. human_resume: human-friendly, polished, readable.
Return JSON with keys ats_resume and human_resume.
{instruction_block}
Profile:
{profile}
"""
    fallback = {
        "ats_resume": fallback_ats_resume(profile),
        "human_resume": fallback_human_resume(profile),
    }
    result = await LLMProvider().chat_json(
        "You write truthful, evidence-backed resumes. Never invent experience.",
        prompt,
        fallback,
    )
    ats = _to_string(result.get("ats_resume", fallback["ats_resume"]))
    human = _to_string(result.get("human_resume", fallback["human_resume"]))
    return ats, human


async def generate_tailored_resume(
    source_content: dict[str, Any] | str,
    role: dict[str, Any],
    format_style: str = "ats",
    custom_instructions: str | None = None,
) -> dict[str, Any]:
    if isinstance(source_content, str):
        fallback_markdown = source_content + "\n\n## Tailoring Notes\n\n- Align bullets to the role requirements.\n"
    else:
        fallback_markdown = (
            fallback_ats_resume(source_content) if format_style == "ats" else fallback_human_resume(source_content)
        ) + "\n\n## Tailoring Notes\n\n- Align bullets to the role requirements.\n"
    fallback = {
        "markdown": fallback_markdown,
        "added_keywords": _as_list(role.get("required_skills"))[:10],
        "rewritten_sections": ["Summary", "Skills", "Experience"],
        "match_improvements": ["Promote evidence that maps to required skills."],
    }

    if format_style == "human":
        style_instruction = (
            "Format: Human-friendly, polished, and narrative. "
            "Use engaging language, clear section headers, and a professional but readable tone. "
            "Prioritize readability for human recruiters over keyword density."
        )
    else:
        style_instruction = (
            "Format: ATS-optimized, plain formatting. "
            "Use standard section headers (Summary, Skills, Experience, Education). "
            "Maximize keyword matching with the role requirements. "
            "Keep formatting simple for automated parsing systems."
        )

    instruction_block = f"\nUser Custom Instructions:\n{custom_instructions}\n" if custom_instructions else ""
    prompt = f"""
Create a role-specific Markdown resume from the provided source material and role analysis.
{style_instruction}
Return JSON with: markdown, added_keywords, rewritten_sections, match_improvements.
Do not invent credentials.
{instruction_block}
Source Material:
{source_content}

Role:
{role}
"""
    result = await LLMProvider().chat_json(
        "You tailor resumes honestly for a specific job description.",
        prompt,
        fallback,
    )
    # Ensure markdown is a string
    result["markdown"] = _to_string(result.get("markdown", fallback["markdown"]))
    return result

