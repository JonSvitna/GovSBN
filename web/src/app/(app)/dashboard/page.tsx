import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const orgId = profile.organization_id;

  const [
    { count: inspectionCount },
    { count: openFindingCount },
    { count: overdueCACount },
    { count: pendingReviewCount },
    { data: recentInspections },
    { data: recentFindings },
  ] = await Promise.all([
    supabase.from("inspections").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("findings").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "open"),
    supabase.from("corrective_actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "overdue"),
    supabase.from("inspections").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "submitted"),
    supabase.from("inspections")
      .select("*, template:inspection_templates(name,category), site:sites(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("findings")
      .select("*, site:sites(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <DashboardClient
      profile={profile}
      stats={{
        totalInspections: inspectionCount ?? 0,
        openFindings: openFindingCount ?? 0,
        overdueActions: overdueCACount ?? 0,
        pendingReview: pendingReviewCount ?? 0,
      }}
      recentInspections={recentInspections ?? []}
      recentFindings={recentFindings ?? []}
    />
  );
}
