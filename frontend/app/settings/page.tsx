"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatusPanel } from "@/components/status-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const [form, setForm] = useState({ model_name: "", openai_api_key: "", openai_base_url: "" });
  const save = useMutation({ mutationFn: () => api.saveSettings(form) });

  useEffect(() => {
    if (settings.data) {
      setForm({
        model_name: settings.data.model_name ?? "",
        openai_api_key: settings.data.openai_api_key ?? "",
        openai_base_url: settings.data.openai_base_url ?? ""
      });
    }
  }, [settings.data]);

  return (
    <>
      <PageHeader title="Settings" description="Configure any OpenAI-compatible provider: OpenAI, OpenRouter, Ollama, LM Studio, Azure OpenAI, or a compatible endpoint." />
      <Card>
        <CardHeader><CardTitle>LLM Provider</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={form.model_name} onChange={(event) => setForm({ ...form, model_name: event.target.value })} placeholder="MODEL_NAME" />
          <Input value={form.openai_base_url} onChange={(event) => setForm({ ...form, openai_base_url: event.target.value })} placeholder="OPENAI_BASE_URL" />
          <Input value={form.openai_api_key} onChange={(event) => setForm({ ...form, openai_api_key: event.target.value })} placeholder="OPENAI_API_KEY" type="password" />
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Settings</Button>
          <StatusPanel loading={settings.isPending || save.isPending} error={settings.error ?? save.error} success={save.data ? "Settings saved" : undefined} />
          <div className="text-xs text-muted-foreground">The backend also reads MODEL_NAME, OPENAI_API_KEY, and OPENAI_BASE_URL from environment variables.</div>
        </CardContent>
      </Card>
    </>
  );
}

