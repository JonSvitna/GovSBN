import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CorrectiveActionsClient } from "./CorrectiveActionsClient";

export default async function CorrectiveActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: actions } = await supabase
    .from("corrective_actions")
    .select("*, finding:findings(title, severity, site_id), assignee:profiles!corrective_actions_assigned_to_fkey(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return <CorrectiveActionsClient actions={actions ?? []} currentUserId={user.id} />;
}
