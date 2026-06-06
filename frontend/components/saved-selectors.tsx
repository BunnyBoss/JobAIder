"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { SavedProfile, SavedResume, SavedRole } from "@/lib/api";

function stringList(value: unknown, limit = 5) {
  return Array.isArray(value) ? value.map(String).slice(0, limit).join(", ") : "";
}

export function ProfileSelect({
  profiles,
  value,
  onChange
}: {
  profiles: SavedProfile[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const selected = profiles.find((profile) => profile.id === value);
  return (
    <div className="space-y-3">
      <Select value={value?.toString() ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Select saved profile</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            #{profile.id} {profile.name || "Master Profile"}
          </option>
        ))}
      </Select>
      {selected && (
        <Card>
          <CardHeader><CardTitle>Selected Profile</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>ID #{selected.id}</div>
            <div>{selected.summary || String(selected.profile.summary ?? "No summary")}</div>
            <div>Experience: {String(selected.profile.years_experience ?? "Unknown")}</div>
            <div>Skills: {stringList(selected.profile.skills) || "No skills extracted"}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function RoleSelect({
  roles,
  value,
  onChange
}: {
  roles: SavedRole[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const selected = roles.find((role) => role.id === value);
  return (
    <div className="space-y-3">
      <Select value={value?.toString() ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Select saved role analysis</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            #{role.id} {role.company} - {role.title}
          </option>
        ))}
      </Select>
      {selected && (
        <Card>
          <CardHeader><CardTitle>Selected Role</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>ID #{selected.id}</div>
            <div>{String(selected.analysis.role_summary ?? "No summary")}</div>
            <div>Seniority: {String(selected.analysis.seniority_level ?? "Unknown")}</div>
            <div>Required: {stringList(selected.analysis.required_skills) || "No required skills extracted"}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ResumeSelect({
  resumes,
  value,
  onChange
}: {
  resumes: SavedResume[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const selected = resumes.find((resume) => resume.id === value);
  return (
    <div className="space-y-3">
      <Select value={value?.toString() ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Select saved resume</option>
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            #{resume.id} {resume.title} ({resume.kind}{resume.role_analysis_id ? `, role #${resume.role_analysis_id}` : ""})
          </option>
        ))}
      </Select>
      {selected && (
        <Card>
          <CardHeader><CardTitle>Selected Resume</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>ID #{selected.id}</div>
            <div>Kind: {selected.kind}</div>
            <div>Profile #{selected.profile_id}{selected.role_analysis_id ? ` · Role #${selected.role_analysis_id}` : ""}</div>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs">
              {selected.markdown.slice(0, 500)}
              {selected.markdown.length > 500 ? "..." : ""}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
