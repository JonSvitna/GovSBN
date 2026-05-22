import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  const { data: onboardingState } = await supabase
    .from("onboarding_state")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <OnboardingClient
      userId={user.id}
      userEmail={user.email ?? ""}
      profile={profile}
      initialStep={onboardingState?.current_step ?? 1}
      initialData={onboardingState?.data ?? {}}
    />
  );
}
