# JobAIder Usage Guide

Welcome to JobAIder! This guide will walk you through the recommended workflow to maximize your chances of landing your target role.

## Recommended Workflow

JobAIder is designed to be used sequentially. Follow these steps for the best results:

1. **Dashboard:** Start here to get an overview of the system health and the recommended workflow.
2. **User Profile:** Build your master profile. This is the foundation for everything else.
3. **Role Analysis:** Analyze the job descriptions for the roles you want.
4. **Gap Analysis:** Compare your profile against a role analysis to find what's missing.
5. **Improvement Plan:** Generate a structured plan to close those gaps.
6. **Resume Studio:** Generate highly tailored ATS and Human-friendly resumes.
7. **Interview Prep:** Practice answering questions specific to the role and your profile.

---

## 1. Dashboard

The Dashboard provides a quick system health check. Ensure the backend is "ok" and that your profile is "built". It also lists the recommended workflow steps.

## 2. User Profile

This is where you tell JobAIder about yourself. The more comprehensive this master profile is, the better your tailored resumes and interview prep will be.

*   **Input Data:** You can paste raw text from your existing resumes, LinkedIn profile, or even point it to a local directory (like an Obsidian vault) containing markdown notes about your career.
*   **Generate Profile:** Click "Build Master Profile". The AI will extract and structure your skills, experiences, projects, and education.
*   **Review and Edit:** Once generated, the profile is displayed cleanly. You can always click "Edit JSON" to make manual tweaks to the extracted data.

## 3. Role Analysis

Here, you dissect the job you are applying for.

*   **Input Job Description:** Paste the full text of the job description.
*   **Input Company Context (Optional but Recommended):** Paste information about the company's culture, recent news, or values. This helps tailor the tone of your resume and interview answers.
*   **Analyze Role:** Click the button to extract the core requirements, responsibilities, and key technologies needed for the job.

## 4. Gap Analysis

Compare what you have (User Profile) with what the job needs (Role Analysis).

*   **Select Profiles:** Choose your built User Profile and the specific Role Analysis you just created.
*   **Run Analysis:** The system will calculate a "Match Score" and identify specific missing skills and experience gaps.
*   **Review:** A lower score isn't a failure; it highlights exactly what you need to focus on in the next step.

## 5. Improvement Plan

Turn your gaps into a concrete action plan.

*   **Select Gap Analysis:** Choose the gap analysis you just generated.
*   **Generate Plan:** The AI creates a prioritized, multi-step plan:
    *   **Quick Wins:** Things you can do immediately (e.g., rephrase a bullet point).
    *   **Skills to Master:** A prioritized list of skills to learn, including estimated effort and resources.
    *   **Portfolio Projects:** Suggested projects to build that specifically demonstrate the missing skills required by the role.

## 6. Resume Studio

Create the perfect resume for the application.

*   **Select Source Profile:** Always select your master profile.
*   **Select Resume Type:**
    *   **Base Resume:** A general resume based solely on your profile. Good for general networking.
    *   **Tailored Resume:** Select this, then choose the Target Role Analysis. The AI will rewrite your experience bullets to highlight the skills demanded by the specific job.
*   **Select Output Format:**
    *   **ATS Friendly:** A clean, keyword-optimized format designed to pass through Applicant Tracking Systems.
    *   **Human Friendly:** A polished, narrative format designed to be read by a recruiter or hiring manager.
*   **Export:** You can export the generated resume as Markdown, PDF, or DOCX.

## 7. Interview Prep

Practice makes perfect.

*   **Select Profiles:** Choose your profile and the target role analysis.
*   **Start Session:** The AI acts as the interviewer. It will ask you questions based on the intersection of the job requirements and your stated experience.
*   **Answer & Evaluate:** Speak (or type) your answers. The AI will evaluate your response, provide constructive feedback, and then ask a follow-up question, simulating a real conversational interview.

---

## Settings & Configuration

JobAIder runs entirely locally, but it relies on Large Language Models (LLMs) to perform the analysis and generation.

*   **API Keys:** You need an API key from an LLM provider. The default configuration uses OpenAI (`gpt-4o-mini`).
*   **Custom Providers:** You can use alternative providers like OpenRouter, or even local models via Ollama or LM Studio, by changing the `OPENAI_BASE_URL` and `MODEL_NAME` in the Settings page (or your backend `.env` file).

**Privacy Note:** Because JobAIder connects directly to the LLM APIs from your machine (via the backend), your data is never stored on external JobAIder servers. However, the data you provide *is* sent to the LLM provider (e.g., OpenAI) for processing. Please refer to your chosen provider's privacy policy regarding data retention.
