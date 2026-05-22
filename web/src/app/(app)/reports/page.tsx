import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
  const orgId = profile?.organization_id;

  const [
    { count: totalInspections },
    { count: totalFindings },
    { count: openFindings },
    { count: resolvedFindings },
    { count: totalActions },
    { count: completedActions },
    { count: overdueActions },
    { data: findingsBySeverity },
    { data: inspectionsByStatus },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("inspections").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("findings").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("findings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "open"),
    supabase.from("findings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "resolved"),
    supabase.from("corrective_actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("corrective_actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["completed", "verified"]),
    supabase.from("corrective_actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "overdue"),
    supabase.from("findings").select("severity").eq("organization_id", orgId),
    supabase.from("inspections").select("status").eq("organization_id", orgId),
    supabase.from("inspections")
      .select("id, created_at, status, template:inspection_templates(name), site:sites(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <ReportsClient
      stats={{
        totalInspections: totalInspections ?? 0,
        totalFindings: totalFindings ?? 0,
        openFindings: openFindings ?? 0,
        resolvedFindings: resolvedFindings ?? 0,
        totalActions: totalActions ?? 0,
        completedActions: completedActions ?? 0,
        overdueActions: overdueActions ?? 0,
      }}
      findingsBySeverity={findingsBySeverity ?? []}
      inspectionsByStatus={inspectionsByStatus ?? []}
      recentActivity={recentActivity ?? []}
    />
  );
}
