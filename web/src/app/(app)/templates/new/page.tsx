import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTemplateClient } from "./NewTemplateClient";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single();
  if (!["admin", "manager"].includes(profile?.role)) redirect("/templates");

  return <NewTemplateClient userId={user.id} orgId={profile?.organization_id} />;
}
