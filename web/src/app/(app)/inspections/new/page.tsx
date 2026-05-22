import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewInspectionClient } from "./NewInspectionClient";

export default async function NewInspectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, division_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: sites } = await supabase.from("sites").select("id,name,city,state").eq("organization_id", orgId).eq("active", true).order("name");
  const { data: templates } = await supabase.from("inspection_templates").select("id,name,description,category").eq("organization_id", orgId).eq("is_active", true).order("name");

  return (
    <NewInspectionClient
      userId={user.id}
      orgId={orgId}
      divisionId={profile?.division_id}
      sites={sites ?? []}
      templates={templates ?? []}
    />
  );
}
