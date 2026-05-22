"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NewInspectionClientProps {
  userId: string;
  orgId: string;
  divisionId: string | null;
  sites: any[];
  templates: any[];
}

export function NewInspectionClient({ userId, orgId, divisionId, sites, templates }: NewInspectionClientProps) {
  const [siteId, setSiteId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !templateId) {
      setError("Please select a site and template.");
      return;
    }
    setLoading(true);
    setError("");

    const { data: inspection, error: err } = await supabase
      .from("inspections")
      .insert({
        organization_id: orgId,
        template_id: templateId,
        inspector_id: userId,
        site_id: siteId,
        division_id: divisionId,
        status: "in_progress",
      })
      .select()
      .single();

    if (err || !inspection) {
      setError(err?.message || "Failed to create inspection.");
      setLoading(false);
      return;
    }

    router.push(`/inspections/${inspection.id}/conduct`);
  };

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedSite = sites.find((s) => s.id === siteId);

  return (
    <div>
      <div className="mb-8">
        <Link href="/inspections" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Inspections
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Start New Inspection</h1>
        <p className="text-sm text-slate-500 mt-1">Select a site and template to begin</p>
      </div>

      <div className="max-w-lg">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-6">
          {/* Step 1: Site */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Step 1 — Select Site</p>
                <p className="text-xs text-slate-500">Where is this inspection taking place?</p>
              </div>
            </div>
            {sites.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No sites configured.</p>
                <Link href="/settings/sites" className="text-xs text-brand-600 mt-1 inline-block">Add a site in Settings</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sites.map((site) => (
                  <button
                    type="button"
                    key={site.id}
                    onClick={() => setSiteId(site.id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                      siteId === site.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className={`font-medium text-sm ${siteId === site.id ? "text-brand-700" : "text-slate-900"}`}>
                      {site.name}
                    </p>
                    {(site.city || site.state) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[site.city, site.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Step 2: Template */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Step 2 — Select Template</p>
                <p className="text-xs text-slate-500">Which inspection type are you performing?</p>
              </div>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No templates available.</p>
                <Link href="/templates/new" className="text-xs text-brand-600 mt-1 inline-block">Create a template</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => setTemplateId(template.id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                      templateId === template.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className={`font-medium text-sm ${templateId === template.id ? "text-brand-700" : "text-slate-900"}`}>
                      {template.name}
                    </p>
                    {template.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                    )}
                    <span className="text-xs text-slate-400 mt-1 inline-block capitalize">{template.category}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Summary & Submit */}
          {siteId && templateId && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 bg-brand-50 border-brand-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <ClipboardList className="w-5 h-5 text-brand-600" />
                <p className="font-semibold text-brand-900 text-sm">Ready to begin</p>
              </div>
              <div className="space-y-1.5 text-sm text-brand-700">
                <p><strong>Site:</strong> {selectedSite?.name}</p>
                <p><strong>Template:</strong> {selectedTemplate?.name}</p>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !siteId || !templateId}
            className="btn-primary w-full"
          >
            {loading ? "Starting..." : "Begin Inspection"}
          </button>
        </form>
      </div>
    </div>
  );
}
