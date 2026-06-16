import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";


export type SavedProfile = {
  id: number;
  name: string;
  summary: string;
  profile: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SavedRole = {
  id: number;
  title: string;
  company: string;
  source_text: string;
  analysis: Record<string, unknown>;
  created_at: string;
};

export type SavedResume = {
  id: number;
  profile_id: number;
  role_analysis_id: number | null;
  title: string;
  kind: string;
  markdown: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

export type SavedGap = {
  id: number;
  profile_id: number;
  role_analysis_id: number;
  analysis: Record<string, unknown>;
  created_at: string;
};

export type SavedImprovementPlan = {
  id: number;
  gap_analysis_id: number;
  profile_id: number;
  role_analysis_id: number;
  plan: Record<string, unknown>;
  created_at: string;
};

export type SessionFeedback = {
  answered_questions: number;
  total_questions: number;
  average_score: number;
  breakdown: {
    technical_depth: number;
    clarity: number;
    communication: number;
    structure: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
};

async function request<T>(path: string, init?: RequestInit, _retry = true): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  // Auto-refresh on 401 (one retry)
  if (response.status === 401 && _retry) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshed.ok) {
          const data = await refreshed.json();
          setTokens(data.access_token, data.refresh_token);
          return request<T>(path, init, false); // retry once
        }
      } catch {
        // refresh failed – fall through to clear tokens
      }
    }
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type UserInfo = {
  id: number;
  username: string;
  email: string;
  created_at: string;
};

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  // Auth
  login: (username: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).detail ?? "Login failed");
      return r.json() as Promise<AuthTokenResponse>;
    }),
  signup: (username: string, email: string, password: string) =>
    fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    }).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).detail ?? "Signup failed");
      return r.json() as Promise<AuthTokenResponse>;
    }),
  me: () => request<UserInfo>("/auth/me"),
  settings: () => request<Record<string, string>>("/api/settings"),
  saveSettings: (body: Record<string, string>) =>
    request<{ saved: boolean }>("/api/settings", { method: "PUT", body: JSON.stringify(body) }),
  scanVault: (vault_path: string) =>
    request<{ documents: Array<{ id: number; name: string; characters: number }> }>(
      "/api/profile/obsidian",
      { method: "POST", body: JSON.stringify({ vault_path }) }
    ),
  uploadProfileFiles: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/api/profile/files`, { 
      method: "POST", 
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<{ documents: Array<{ id: number; name: string; characters: number }> }>;
  },
  extractText: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/api/utils/extract-text`, { 
      method: "POST", 
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<{ files: Array<{ name: string; text: string }> }>;
  },
  buildProfile: (document_ids: number[], raw_text = "") =>
    request<{ id: number; profile: Record<string, unknown> }>("/api/profile/build", {
      method: "POST",
      body: JSON.stringify({ document_ids, raw_text })
    }),
  latestProfile: () => request<{ id?: number; profile: Record<string, unknown> | null }>("/api/profiles/latest"),
  listProfiles: () => request<{ profiles: SavedProfile[] }>("/api/profiles"),
  saveProfile: (profile_id: number, body: { name?: string; profile: Record<string, unknown> }) =>
    request<{ saved: boolean; id: number }>(`/api/profile/${profile_id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteProfile: (profile_id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/profile/${profile_id}`, { method: "DELETE" }),
  analyzeRole: (body: { title: string; company: string; content: string }) =>
    request<{ id: number; title: string; company: string; analysis: Record<string, unknown> }>("/api/role/analyze", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  listRoles: () => request<{ roles: SavedRole[] }>("/api/roles"),
  saveRole: (
    role_analysis_id: number,
    body: { title: string; company: string; source_text?: string; analysis: Record<string, unknown> }
  ) =>
    request<{ saved: boolean; id: number }>(`/api/role/${role_analysis_id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteRole: (role_analysis_id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/role/${role_analysis_id}`, { method: "DELETE" }),
  genericResumes: (profile_id: number) =>
    request<{ resumes: Array<{ id: number; kind: string; markdown: string }> }>("/api/resume/generic", {
      method: "POST",
      body: JSON.stringify({ profile_id })
    }),
  generateResume: (body: { profile_id?: number | null; resume_id?: number | null; kind: "ats" | "human" | "tailored"; role_analysis_id?: number | null; custom_instructions?: string | null }) =>
    request<SavedResume>("/api/resume/generate", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  tailoredResume: (profile_id: number, role_analysis_id: number) =>
    request<Record<string, unknown>>("/api/resume/tailored", {
      method: "POST",
      body: JSON.stringify({ profile_id, role_analysis_id })
    }),
  listResumes: () =>
    request<{ resumes: SavedResume[] }>("/api/resumes"),
  saveResume: (resume_id: number, body: { title?: string; markdown: string }) =>
    request<{ saved: boolean; id: number }>(`/api/resume/${resume_id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteResume: (resume_id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/resume/${resume_id}`, { method: "DELETE" }),
  gap: (profile_id: number, role_analysis_id: number) =>
    request<{ id: number; analysis: Record<string, unknown> }>("/api/gap/analyze", {
      method: "POST",
      body: JSON.stringify({ profile_id, role_analysis_id })
    }),
  gapByResume: (resume_id: number, role_analysis_id: number) =>
    request<{ id: number; analysis: Record<string, unknown> }>("/api/gap/analyze", {
      method: "POST",
      body: JSON.stringify({ resume_id, role_analysis_id })
    }),
  listGaps: () => request<{ gaps: SavedGap[] }>("/api/gaps"),
  saveGap: (gap_id: number, body: { analysis: Record<string, unknown> }) =>
    request<{ saved: boolean; id: number }>(`/api/gap/${gap_id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteGap: (gap_id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/gap/${gap_id}`, { method: "DELETE" }),
  generateImprovementPlan: (gap_analysis_id: number) =>
    request<{ id: number; gap_analysis_id: number; plan: Record<string, unknown> }>("/api/improvement/generate", {
      method: "POST",
      body: JSON.stringify({ gap_analysis_id })
    }),
  listImprovementPlans: () => request<{ plans: SavedImprovementPlan[] }>("/api/improvement/plans"),
  deleteImprovementPlan: (plan_id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/improvement/${plan_id}`, { method: "DELETE" }),
  startInterview: (body: Record<string, unknown>) =>
    request<{
      session_id: number;
      question: string;
      question_count: number;
      question_number: number;
      history: unknown[];
    }>("/api/interview/start", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  answerInterview: (
    session_id: number,
    answer: string = "",
    action: "submit" | "skip" | "exit" = "submit"
  ) =>
    request<{
      evaluation?: Record<string, unknown>;
      next_question?: string;
      question_number?: number;
      question_count?: number;
      is_final_question: boolean;
      session_complete?: boolean;
      session_feedback?: SessionFeedback;
      exit_reason?: string;
    }>("/api/interview/answer", {
      method: "POST",
      body: JSON.stringify({ session_id, answer, action }),
    }),
};
