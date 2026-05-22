import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("organization_id", profile?.organization_id);

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("organization_id", profile?.organization_id)
    .order("name");

  return (
    <SettingsClient
      profile={profile}
      organization={profile?.organization}
      members={members ?? []}
      sites={sites ?? []}
    />
  );
}
