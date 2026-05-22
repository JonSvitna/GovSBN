import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FindingsClient } from "./FindingsClient";

export default async function FindingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: findings } = await supabase
    .from("findings")
    .select("*, site:sites(name,city), inspection:inspections(id), assignee:profiles!findings_assigned_to_fkey(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return <FindingsClient findings={findings ?? []} />;
}
