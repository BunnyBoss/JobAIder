from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ProviderSettings(BaseModel):
    model_name: str = "gpt-4o-mini"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"


class ObsidianScanRequest(BaseModel):
    vault_path: str


class DocumentSummary(BaseModel):
    id: int | None = None
    name: str
    source_type: str
    path: str | None = None
    characters: int


class BuildProfileRequest(BaseModel):
    document_ids: list[int] = Field(default_factory=list)
    raw_text: str = ""


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    profile: dict[str, Any]


class ProfessionalProfile(BaseModel):
    summary: str
    years_experience: str = "Unknown"
    experience: list[dict[str, Any]] = Field(default_factory=list)
    projects: list[dict[str, Any]] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    publications: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    resume_versions: list[str] = Field(default_factory=list)
    career_notes: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class ProfileResponse(BaseModel):
    id: int
    profile: ProfessionalProfile


class RoleAnalysisRequest(BaseModel):
    title: str = "Target Role"
    company: str = "Unknown Company"
    content: str


class RoleAnalysisUpdateRequest(BaseModel):
    title: str
    company: str
    source_text: str | None = None
    analysis: dict[str, Any]


class RoleAnalysis(BaseModel):
    role_summary: str
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    domain_knowledge: list[str] = Field(default_factory=list)
    seniority_level: str = "Unknown"
    domain_focus: str = "Unknown"


class RoleAnalysisResponse(BaseModel):
    id: int
    analysis: RoleAnalysis


class ResumeRequest(BaseModel):
    profile_id: int
    role_analysis_id: int | None = None


class ResumeGenerateRequest(BaseModel):
    profile_id: int
    kind: Literal["ats", "human", "tailored"]
    role_analysis_id: int | None = None


class ResumeResponse(BaseModel):
    id: int | None = None
    kind: Literal["ats", "human", "tailored"]
    markdown: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ResumeUpdateRequest(BaseModel):
    markdown: str
    title: str | None = None


class GapAnalysisRequest(BaseModel):
    profile_id: int | None = None
    role_analysis_id: int
    resume_id: int | None = None


class GapAnalysisUpdateRequest(BaseModel):
    analysis: dict[str, Any]


class GapAnalysis(BaseModel):
    overall_match_score: int
    skills_match: int
    experience_match: int
    domain_match: int
    leadership_match: int
    missing_skills: list[str] = Field(default_factory=list)
    evidence_mapping: list[dict[str, Any]] = Field(default_factory=list)
    quick_wins: list[str] = Field(default_factory=list)
    skills_to_learn: list[dict[str, str]] = Field(default_factory=list)
    portfolio_projects: list[dict[str, str]] = Field(default_factory=list)


class InterviewStartRequest(BaseModel):
    profile_id: int | None = None
    resume_id: int | None = None
    role_analysis_id: int | None = None
    mode: Literal["Technical", "Behavioral", "Hiring Manager", "System Design", "Mixed"] = "Mixed"
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    question_count: int = 3


class InterviewAnswerRequest(BaseModel):
    session_id: int
    answer: str = ""
    action: Literal["submit", "skip", "exit"] = "submit"
