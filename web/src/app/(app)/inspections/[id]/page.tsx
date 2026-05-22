import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { InspectionDetailClient } from "./InspectionDetailClient";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const { data: inspection } = await supabase
    .from("inspections")
    .select("*, template:inspection_templates(name,category,description), site:sites(name,city,state,address), inspector:profiles(full_name,email)")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!inspection) notFound();

  const { data: responses } = await supabase
    .from("inspection_responses")
    .select("*")
    .eq("inspection_id", id)
    .order("created_at");

  const { data: findings } = await supabase
    .from("findings")
    .select("*, site:sites(name)")
    .eq("inspection_id", id)
    .order("created_at");

  const { data: corrective_actions } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("inspection_id", id)
    .order("created_at");

  return (
    <InspectionDetailClient
      inspection={inspection}
      responses={responses ?? []}
      findings={findings ?? []}
      correctiveActions={corrective_actions ?? []}
      currentUserId={user.id}
      userRole={profile?.role}
    />
  );
}
