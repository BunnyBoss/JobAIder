# JobRadar API Contracts

Base URL: `http://localhost:4000`

## Health

`GET /api/health`

Response:

```json
{ "status": "ok" }
```

## Settings

`GET /api/settings`

Returns current model settings and resolved DB path.

`PUT /api/settings`

Body:

```json
{
  "model_name": "gpt-4o-mini",
  "openai_api_key": "",
  "openai_base_url": "https://api.openai.com/v1"
}
```

## User Profile

`POST /api/profile/obsidian`

Body:

```json
{ "vault_path": "/path/to/obsidian-vault" }
```

Scans `*.md` and `*.txt` recursively and stores career-related documents.

`POST /api/profile/files`

Multipart upload field: `files`

Supports PDF, DOCX, Markdown, and TXT.

`POST /api/profile/build`

Body:

```json
{
  "document_ids": [1, 2, 3],
  "raw_text": ""
}
```

Builds a unified professional profile.

`GET /api/profiles/latest`

Returns the latest stored profile.

`GET /api/profiles`

Lists saved profiles newest first.

`GET /api/profile/{profile_id}`

Returns one saved profile.

`PUT /api/profile/{profile_id}`

Body:

```json
{
  "name": "Master Profile",
  "profile": {
    "summary": "Profile summary",
    "skills": ["Python"]
  }
}
```

Updates a saved profile.

`DELETE /api/profile/{profile_id}`

Deletes only that profile row. Existing resumes and analyses are not deleted.

## Role Analysis

`POST /api/role/analyze`

Body:

```json
{
  "title": "Senior AI Engineer",
  "company": "ExampleCo",
  "content": "Job description or company material..."
}
```

Returns required skills, nice-to-have skills, responsibilities, technologies, seniority level, and domain focus.

`GET /api/roles`

Lists saved role analyses newest first.

`GET /api/role/{role_analysis_id}`

Returns one saved role analysis.

`PUT /api/role/{role_analysis_id}`

Body:

```json
{
  "title": "Senior AI Engineer",
  "company": "ExampleCo",
  "source_text": "Original job description",
  "analysis": {
    "role_summary": "Role summary",
    "required_skills": ["Python"]
  }
}
```

Updates a saved role analysis.

`DELETE /api/role/{role_analysis_id}`

Deletes only that role analysis row. Existing tailored resumes are not deleted.

## Resume Studio

`POST /api/resume/generic`

Body:

```json
{ "profile_id": 1 }
```

Returns ATS and human-friendly Markdown resumes.

`POST /api/resume/generate`

Body:

```json
{
  "profile_id": 1,
  "kind": "ats",
  "role_analysis_id": null
}
```

`kind` can be `ats`, `human`, or `tailored`. Tailored resumes require `role_analysis_id`. The generated resume is saved and returned.

`POST /api/resume/tailored`

Body:

```json
{
  "profile_id": 1,
  "role_analysis_id": 1
}
```

Returns a tailored Markdown resume plus added keywords, rewritten sections, and match improvements.

`GET /api/resumes`

Lists saved resume drafts.

`GET /api/resume/{resume_id}`

Returns one saved resume draft.

`PUT /api/resume/{resume_id}`

Body:

```json
{
  "title": "Tailored Resume",
  "markdown": "# Resume..."
}
```

Updates an edited resume draft.

`DELETE /api/resume/{resume_id}`

Deletes a saved resume draft.

## Gap Analysis

`POST /api/gap/analyze`

Body:

```json
{
  "profile_id": 1,
  "role_analysis_id": 1
}
```

Returns overall match score, skills/experience/domain/leadership match, missing skills, evidence mapping, quick wins, skills to learn, and portfolio projects.

`GET /api/gaps`

Lists saved gap analyses newest first.

`GET /api/gap/{gap_id}`

Returns one saved gap analysis.

`PUT /api/gap/{gap_id}`

Body:

```json
{
  "analysis": {
    "overall_match_score": 80
  }
}
```

Updates a saved gap analysis.

`DELETE /api/gap/{gap_id}`

Deletes a saved gap analysis.

## Interview Prep

`POST /api/interview/start`

Body:

```json
{
  "profile_id": 1,
  "role_analysis_id": 1,
  "mode": "Mixed",
  "difficulty": "Medium"
}
```

`POST /api/interview/answer`

Body:

```json
{
  "session_id": 1,
  "answer": "My answer..."
}
```

Returns score, strengths, weaknesses, improved answer, and next question.
