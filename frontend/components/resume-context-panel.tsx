"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavedResume } from "@/lib/api";
import { cn } from "@/lib/utils";

function ResumePreview({
  resume,
  highlighted
}: {
  resume: SavedResume;
  highlighted?: boolean;
}) {
  return (
    <div className={cn("rounded-md border p-3", highlighted && "border-primary bg-muted")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{resume.title}</div>
        <div className="text-xs text-muted-foreground">
          #{resume.id} · {resume.kind}
          {resume.role_analysis_id ? ` · Role #${resume.role_analysis_id}` : ""}
        </div>
      </div>
      {highlighted && <div className="mb-2 text-xs font-medium text-primary">Matches selected role</div>}
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs">
        {resume.markdown.slice(0, 700)}
        {resume.markdown.length > 700 ? "..." : ""}
      </pre>
    </div>
  );
}

export function ResumeContextPanel({
  profileId,
  roleId,
  resumes
}: {
  profileId: number | null;
  roleId?: number | null;
  resumes: SavedResume[];
}) {
  if (!profileId) return null;

  const profileResumes = resumes.filter((resume) => resume.profile_id === profileId);
  const genericResumes = profileResumes.filter((resume) => !resume.role_analysis_id);
  const tailoredResumes = profileResumes.filter((resume) => resume.role_analysis_id);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Resume Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Generic Resumes</h3>
          {genericResumes.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No generic resumes saved for this profile.
            </div>
          ) : (
            <div className="grid gap-3">
              {genericResumes.map((resume) => (
                <ResumePreview key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Tailored Resumes</h3>
          {tailoredResumes.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No tailored resumes saved for this profile.
            </div>
          ) : (
            <div className="grid gap-3">
              {tailoredResumes.map((resume) => (
                <ResumePreview
                  key={resume.id}
                  resume={resume}
                  highlighted={Boolean(roleId && resume.role_analysis_id === roleId)}
                />
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

