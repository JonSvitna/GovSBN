import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InspectionsClient } from "./InspectionsClient";

export default async function InspectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: inspections } = await supabase
    .from("inspections")
    .select("*, template:inspection_templates(name,category), site:sites(name,city,state), inspector:profiles(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const { data: sites } = await supabase.from("sites").select("id,name").eq("organization_id", orgId).eq("active", true);
  const { data: templates } = await supabase.from("inspection_templates").select("id,name").eq("organization_id", orgId).eq("is_active", true);

  return <InspectionsClient inspections={inspections ?? []} sites={sites ?? []} templates={templates ?? []} />;
}
