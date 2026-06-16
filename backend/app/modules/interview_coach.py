from __future__ import annotations

from typing import Any

from app.modules.llm_provider import LLMProvider


async def generate_first_question(mode: str, difficulty: str, context: dict[str, Any] | None = None) -> str:
    fallback_q = (
        f"Let's begin a {difficulty.lower()} {mode.lower()} interview. "
        "Tell me about a project that best proves you are a strong fit for this role."
    )
    prompt = f"""
Generate the VERY FIRST question to start a {mode} interview at a {difficulty} difficulty level.
The question must be highly tailored to the provided profile and role. Do not include any greetings, just the question itself.

Context: {context or {}}
"""
    result = await LLMProvider().chat_text(
        "You are an expert interviewer starting an interview. Ask exactly one tailored question.",
        prompt,
        fallback_q,
    )
    return result


async def evaluate_answer(
    mode: str,
    difficulty: str,
    question: str,
    answer: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    fallback = {
        "score": 60,
        "technical_depth": 3,
        "clarity": 3,
        "communication": 3,
        "structure": 3,
        "strengths": ["Answer gives a starting point."],
        "weaknesses": ["Add clearer structure, evidence, and measurable impact."],
        "improved_answer": "Use Situation, Task, Action, Result, then connect the result to the target role.",
        "next_question": "What tradeoffs did you make, and how did you evaluate success?",
    }
    prompt = f"""
Evaluate this interview answer.
Mode: {mode}
Difficulty: {difficulty}
Question: {question}
Answer: {answer}
Context: {context or {}}

Return JSON with score, technical_depth, clarity, communication, structure,
strengths, weaknesses, improved_answer, next_question.
"""
    return await LLMProvider().chat_json(
        "You are a direct but supportive interview coach.",
        prompt,
        fallback,
    )


async def generate_session_feedback(
    history: list[dict[str, Any]],
    question_count: int,
) -> dict[str, Any]:
    """Generate comprehensive feedback for interview session."""
    evaluations = []
    answered_count = 0
    
    # Extract all evaluations from history
    for entry in history:
        if "evaluation" in entry:
            evaluations.append(entry["evaluation"])
            answered_count += 1
    
    if not evaluations:
        return {
            "answered_questions": 0,
            "total_questions": question_count,
            "average_score": 0,
            "breakdown": {
                "technical_depth": 0,
                "clarity": 0,
                "communication": 0,
                "structure": 0,
            },
            "strengths": ["Complete the interview to receive feedback."],
            "weaknesses": [],
            "improvements": ["Answer more questions to get detailed feedback."],
        }
    
    # Calculate average scores
    avg_score = sum(e.get("score", 0) for e in evaluations) / len(evaluations)
    avg_technical = sum(e.get("technical_depth", 0) for e in evaluations) / len(evaluations)
    avg_clarity = sum(e.get("clarity", 0) for e in evaluations) / len(evaluations)
    avg_comm = sum(e.get("communication", 0) for e in evaluations) / len(evaluations)
    avg_struct = sum(e.get("structure", 0) for e in evaluations) / len(evaluations)
    
    # Aggregate strengths and weaknesses
    all_strengths = []
    all_weaknesses = []
    for e in evaluations:
        all_strengths.extend(e.get("strengths", []))
        all_weaknesses.extend(e.get("weaknesses", []))
    
    # Deduplicate and limit
    unique_strengths = list(dict.fromkeys(all_strengths))[:5]
    unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:5]
    
    return {
        "answered_questions": answered_count,
        "total_questions": question_count,
        "average_score": round(avg_score, 1),
        "breakdown": {
            "technical_depth": round(avg_technical, 1),
            "clarity": round(avg_clarity, 1),
            "communication": round(avg_comm, 1),
            "structure": round(avg_struct, 1),
        },
        "strengths": unique_strengths or ["Good effort!"],
        "weaknesses": unique_weaknesses or ["Keep practicing."],
        "improvements": [
            f"Your average score was {round(avg_score, 0)}/100. Focus on improving your {unique_weaknesses[0].lower() if unique_weaknesses else 'answers'}."
        ],
    }

