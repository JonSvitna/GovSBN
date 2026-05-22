import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { FindingDetailClient } from "./FindingDetailClient";

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: finding } = await supabase
    .from("findings")
    .select("*, site:sites(name,city,state), inspection:inspections(id, started_at), assignee:profiles!findings_assigned_to_fkey(full_name,email)")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!finding) notFound();

  const { data: corrective_actions } = await supabase
    .from("corrective_actions")
    .select("*, assignee:profiles!corrective_actions_assigned_to_fkey(full_name)")
    .eq("finding_id", id)
    .order("created_at");

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", orgId);

  return (
    <FindingDetailClient
      finding={finding}
      correctiveActions={corrective_actions ?? []}
      members={members ?? []}
      currentUserId={user.id}
      orgId={orgId}
    />
  );
}
