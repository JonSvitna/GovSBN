import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplatesClient } from "./TemplatesClient";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: templates } = await supabase
    .from("inspection_templates")
    .select("*, creator:profiles!inspection_templates_created_by_fkey(full_name), sections:template_sections(id)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return <TemplatesClient templates={templates ?? []} userRole={profile?.role} />;
}
