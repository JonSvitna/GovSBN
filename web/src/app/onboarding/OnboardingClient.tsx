"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Welcome", subtitle: "Let's get you set up" },
  { id: 2, title: "Organization", subtitle: "Tell us about your agency" },
  { id: 3, title: "Your Role", subtitle: "How will you use the platform?" },
  { id: 4, title: "Inspection Setup", subtitle: "Configure your workflow" },
  { id: 5, title: "Reporting", subtitle: "Set reporting preferences" },
  { id: 6, title: "Power BI Export", subtitle: "Data pipeline configuration" },
  { id: 7, title: "Starter Template", subtitle: "Choose your first template" },
  { id: 8, title: "All Set!", subtitle: "Your platform is ready" },
];

interface OnboardingClientProps {
  userId: string;
  userEmail: string;
  profile: any;
  initialStep: number;
  initialData: Record<string, any>;
}

export function OnboardingClient({ userId, userEmail, profile, initialStep, initialData }: OnboardingClientProps) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateData = (updates: Record<string, any>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const saveStep = async (nextStep: number) => {
    await supabase.from("onboarding_state").upsert({
      user_id: userId,
      current_step: nextStep,
      completed_steps: Array.from({ length: step }, (_, i) => i + 1),
      data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  };

  const handleNext = async () => {
    if (step < 8) {
      await saveStep(step + 1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Create organization
      const orgSlug = data.orgName?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `org-${Date.now()}`;
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: data.orgName || "My Organization",
          slug: orgSlug,
          plan: "starter",
          settings: {
            reporting_period: data.reportingPeriod || "monthly",
            powerbi_enabled: data.powerbiEnabled ?? true,
            timezone: data.timezone || "America/New_York",
          },
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Create division
      const { data: division } = await supabase
        .from("divisions")
        .insert({
          organization_id: org.id,
          name: data.divisionName || "Operations Division",
          code: data.divisionCode || "OPS",
        })
        .select()
        .single();

      // 3. Update profile
      await supabase
        .from("profiles")
        .update({
          organization_id: org.id,
          full_name: data.fullName || profile?.full_name || "",
          role: data.role || "admin",
          division_id: division?.id || null,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // 4. Seed starter data via RPC
      await supabase.rpc("seed_organization_starter_data", {
        p_organization_id: org.id,
        p_user_id: userId,
      });

      // 5. Mark onboarding complete
      await supabase
        .from("onboarding_state")
        .update({
          completed_at: new Date().toISOString(),
          current_step: 8,
          completed_steps: [1, 2, 3, 4, 5, 6, 7, 8],
          data,
        })
        .eq("user_id", userId);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Onboarding error:", err);
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col p-8">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">GovSBN</span>
        </div>

        <div className="space-y-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                s.id === step ? "bg-brand-50" : ""
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                s.id < step
                  ? "bg-brand-600 text-white"
                  : s.id === step
                  ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500"
                  : "bg-slate-100 text-slate-400"
              }`}>
                {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div>
                <p className={`text-sm font-medium ${s.id === step ? "text-brand-700" : s.id < step ? "text-slate-600" : "text-slate-400"}`}>
                  {s.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <motion.div
            className="h-1 bg-brand-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            {/* Step indicator (mobile) */}
            <p className="text-xs text-slate-400 mb-2 lg:hidden">Step {step} of {STEPS.length}</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 1 && <StepWelcome data={data} onChange={updateData} profile={profile} />}
                {step === 2 && <StepOrganization data={data} onChange={updateData} />}
                {step === 3 && <StepRole data={data} onChange={updateData} />}
                {step === 4 && <StepInspectionSetup data={data} onChange={updateData} />}
                {step === 5 && <StepReporting data={data} onChange={updateData} />}
                {step === 6 && <StepPowerBI data={data} onChange={updateData} />}
                {step === 7 && <StepTemplate data={data} onChange={updateData} />}
                {step === 8 && <StepFinish data={data} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {step < 8 ? (
                <button onClick={handleNext} className="btn-primary">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleComplete} disabled={loading} className="btn-primary">
                  {loading ? "Setting up..." : "Go to Dashboard"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step components
function StepWelcome({ data, onChange, profile }: any) {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
        <ShieldCheck className="w-7 h-7 text-brand-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Welcome to GovSBN</h1>
      <p className="text-slate-500 mt-2">
        The government inspection and operational reporting platform. We&apos;ll get you set up in a few minutes.
      </p>
      <div className="mt-6">
        <label className="label">Your full name</label>
        <input
          type="text"
          className="input"
          value={data.fullName || profile?.full_name || ""}
          onChange={(e) => onChange({ fullName: e.target.value })}
          placeholder="Jane Smith"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-5">
        {[
          { label: "Guided inspections", desc: "Step-by-step field workflows" },
          { label: "Auto findings", desc: "Findings generated automatically" },
          { label: "Power BI ready", desc: "Structured export datasets" },
        ].map((f) => (
          <div key={f.label} className="text-center">
            <p className="text-sm font-semibold text-slate-900">{f.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepOrganization({ data, onChange }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Your organization</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Tell us about your government agency or department.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Organization name</label>
          <input
            type="text"
            className="input"
            value={data.orgName || ""}
            onChange={(e) => onChange({ orgName: e.target.value })}
            placeholder="Department of Public Works"
          />
        </div>
        <div>
          <label className="label">Organization type</label>
          <select
            className="input"
            value={data.orgType || ""}
            onChange={(e) => onChange({ orgType: e.target.value })}
          >
            <option value="">Select type...</option>
            <option value="federal">Federal Agency</option>
            <option value="state">State Agency</option>
            <option value="county">County Government</option>
            <option value="municipal">Municipal Government</option>
            <option value="authority">Public Authority</option>
            <option value="other">Other Government Entity</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">State / Region</label>
            <input
              type="text"
              className="input"
              value={data.state || ""}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="e.g. California"
            />
          </div>
          <div>
            <label className="label">Primary city</label>
            <input
              type="text"
              className="input"
              value={data.city || ""}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="e.g. Sacramento"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRole({ data, onChange }: any) {
  const roles = [
    { value: "admin", label: "Administrator", desc: "Full platform access, manage users and templates" },
    { value: "manager", label: "Manager / Supervisor", desc: "Review inspections and manage findings" },
    { value: "inspector", label: "Field Inspector", desc: "Conduct inspections in the field" },
    { value: "analyst", label: "Analyst", desc: "Review data, generate reports" },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Your role</h2>
      <p className="text-slate-500 mt-1.5 text-sm">How will you primarily use GovSBN?</p>
      <div className="mt-6 space-y-3">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => onChange({ role: role.value })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              data.role === role.value
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <p className={`font-medium text-sm ${data.role === role.value ? "text-brand-700" : "text-slate-900"}`}>
              {role.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="label">Division / Department</label>
          <input
            type="text"
            className="input"
            value={data.divisionName || ""}
            onChange={(e) => onChange({ divisionName: e.target.value })}
            placeholder="Operations Division"
          />
        </div>
        <div>
          <label className="label">Division code</label>
          <input
            type="text"
            className="input"
            value={data.divisionCode || ""}
            onChange={(e) => onChange({ divisionCode: e.target.value })}
            placeholder="OPS"
          />
        </div>
      </div>
    </div>
  );
}

function StepInspectionSetup({ data, onChange }: any) {
  const approvalOptions = [
    { value: "none", label: "No approval required", desc: "Inspections are accepted on submission" },
    { value: "manager", label: "Manager approval", desc: "A manager must review and approve each inspection" },
    { value: "admin", label: "Admin approval", desc: "Platform administrator approves all inspections" },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Inspection workflow</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Configure how inspections move through your process.</p>
      <div className="mt-6">
        <p className="label">Approval workflow</p>
        <div className="space-y-3 mt-1.5">
          {approvalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ approvalWorkflow: opt.value })}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                data.approvalWorkflow === opt.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <p className={`font-medium text-sm ${data.approvalWorkflow === opt.value ? "text-brand-700" : "text-slate-900"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <label className="label">Default finding due date (days from finding creation)</label>
        <select
          className="input"
          value={data.defaultDueDays || "14"}
          onChange={(e) => onChange({ defaultDueDays: e.target.value })}
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>
    </div>
  );
}

function StepReporting({ data, onChange }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Reporting preferences</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Configure how the platform generates reports for your organization.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Reporting period</label>
          <select
            className="input"
            value={data.reportingPeriod || "monthly"}
            onChange={(e) => onChange({ reportingPeriod: e.target.value })}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div>
          <label className="label">Time zone</label>
          <select
            className="input"
            value={data.timezone || "America/New_York"}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Anchorage">Alaska Time (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
          </select>
        </div>
        <div className="space-y-3">
          <p className="label">Report types to enable</p>
          {[
            { key: "findingTrends", label: "Finding trends analysis" },
            { key: "complianceRates", label: "Inspection completion rates" },
            { key: "divisionPerformance", label: "Division performance reports" },
            { key: "executiveSummary", label: "Executive summary rollups" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data[opt.key] ?? true}
                onChange={(e) => onChange({ [opt.key]: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepPowerBI({ data, onChange }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Power BI export</h2>
      <p className="text-slate-500 mt-1.5 text-sm">Configure your data pipeline for Power BI and analytics platforms.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={data.powerbiEnabled ?? true}
              onChange={(e) => onChange({ powerbiEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Enable Power BI export</p>
              <p className="text-xs text-slate-500 mt-0.5">Generate normalized datasets for Power BI dashboards</p>
            </div>
          </label>
        </div>

        <div>
          <label className="label">Export format</label>
          <select
            className="input"
            value={data.exportFormat || "csv"}
            onChange={(e) => onChange({ exportFormat: e.target.value })}
          >
            <option value="csv">CSV (Power BI compatible)</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-900">Automatic normalization included</p>
          <p className="text-xs text-blue-700 mt-1">
            Every inspection response is automatically tagged with reporting metadata, category classifications,
            and Power BI-ready field mappings. No manual cleanup required.
          </p>
        </div>

        <div>
          <label className="label">Export schedule</label>
          <select
            className="input"
            value={data.exportSchedule || "manual"}
            onChange={(e) => onChange({ exportSchedule: e.target.value })}
          >
            <option value="manual">Manual (on demand)</option>
            <option value="daily">Daily automatic export</option>
            <option value="weekly">Weekly automatic export</option>
            <option value="monthly">Monthly automatic export</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StepTemplate({ data, onChange }: any) {
  const templates = [
    { value: "facility", label: "General Facility Inspection", desc: "Safety, security, and facility conditions", icon: "🏢" },
    { value: "vehicle", label: "Fleet Vehicle Inspection", desc: "Vehicle safety and maintenance checks", icon: "🚗" },
    { value: "environmental", label: "Environmental Compliance", desc: "Environmental safety and compliance", icon: "🌿" },
    { value: "workplace", label: "Workplace Safety", desc: "OSHA-aligned workplace safety inspection", icon: "⚠️" },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Starter template</h2>
      <p className="text-slate-500 mt-1.5 text-sm">
        We&apos;ll create your first inspection template. You can customize it after setup.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ starterTemplate: t.value })}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              data.starterTemplate === t.value
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <p className={`font-medium text-sm mt-2 ${data.starterTemplate === t.value ? "text-brand-700" : "text-slate-900"}`}>
              {t.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFinish({ data }: any) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900">You&apos;re all set!</h2>
      <p className="text-slate-500 mt-2 text-sm">
        Your platform is configured and ready. We&apos;ve set up your starter inspection template and seeded some example data so you can see how everything works.
      </p>
      <div className="mt-8 bg-slate-50 rounded-2xl p-6 text-left space-y-3">
        {[
          { label: "Organization", value: data.orgName || "My Organization" },
          { label: "Role", value: data.role || "Administrator" },
          { label: "Division", value: data.divisionName || "Operations Division" },
          { label: "Reporting period", value: data.reportingPeriod || "Monthly" },
          { label: "Power BI export", value: data.powerbiEnabled !== false ? "Enabled" : "Disabled" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-sm font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
