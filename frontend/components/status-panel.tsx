import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function StatusPanel({
  loading,
  error,
  success
}: {
  loading?: boolean;
  error?: unknown;
  success?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Working...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" /> {error instanceof Error ? error.message : "Something went wrong"}
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle2 className="h-4 w-4" /> {success}
      </div>
    );
  }
  return null;
}

