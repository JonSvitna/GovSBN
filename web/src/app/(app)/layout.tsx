import { AppLayout } from "@/components/layout";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return <AppLayout>{children}</AppLayout>;
}
