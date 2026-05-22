import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ConductInspectionClient } from "./ConductInspectionClient";

export default async function ConductInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: inspection } = await supabase
    .from("inspections")
    .select("*, template:inspection_templates(id,name), site:sites(name)")
    .eq("id", id)
    .eq("organization_id", orgId)
    .eq("inspector_id", user.id)
    .single();

  if (!inspection) notFound();

  if (!["draft", "in_progress"].includes(inspection.status)) {
    redirect(`/inspections/${id}`);
  }

  const { data: sections } = await supabase
    .from("template_sections")
    .select("*, questions:template_questions(*)")
    .eq("template_id", inspection.template_id)
    .order("order_index");

  const { data: existingResponses } = await supabase
    .from("inspection_responses")
    .select("*")
    .eq("inspection_id", id);

  return (
    <ConductInspectionClient
      inspection={inspection}
      sections={sections ?? []}
      existingResponses={existingResponses ?? []}
      userId={user.id}
      orgId={orgId}
    />
  );
}
