import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CADetailClient } from "./CADetailClient";

export default async function CADetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: action } = await supabase
    .from("corrective_actions")
    .select("*, finding:findings(id, title, severity, status), assignee:profiles!corrective_actions_assigned_to_fkey(full_name, email)")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!action) notFound();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", orgId);

  return (
    <CADetailClient
      action={action}
      members={members ?? []}
      currentUserId={user.id}
      orgId={orgId}
    />
  );
}
