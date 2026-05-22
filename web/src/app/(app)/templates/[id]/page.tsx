import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TemplateDetailClient } from "./TemplateDetailClient";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: template } = await supabase
    .from("inspection_templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!template) notFound();

  const { data: sections } = await supabase
    .from("template_sections")
    .select("*, questions:template_questions(*)")
    .eq("template_id", id)
    .order("order_index");

  return (
    <TemplateDetailClient
      template={template}
      sections={sections ?? []}
      userRole={profile?.role}
    />
  );
}
