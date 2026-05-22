"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckSquare, MapPin, Calendar, User, Edit2, Save, X } from "lucide-react";
import { SeverityBadge, StatusBadge } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  finding: any;
  correctiveActions: any[];
  members: any[];
  currentUserId: string;
  orgId: string;
}

export function FindingDetailClient({ finding, correctiveActions, members, currentUserId, orgId }: Props) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(finding.status);
  const [assignedTo, setAssignedTo] = useState(finding.assigned_to || "");
  const [dueDate, setDueDate] = useState(finding.due_date || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("findings")
      .update({
        status,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", finding.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/findings" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Findings
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{finding.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <SeverityBadge severity={finding.severity} />
                <StatusBadge status={finding.status} />
                {finding.category && (
                  <span className="text-xs text-slate-500 capitalize">{finding.category.replace(/_/g, " ")}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="btn-ghost text-sm"
          >
            {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Finding Description</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {finding.description || "No description provided."}
            </p>
          </div>

          {/* Edit Panel */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 border-brand-200 bg-brand-50"
            >
              <h2 className="font-semibold text-slate-900 mb-4">Update Finding</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
                <div>
                  <label className="label">Assigned to</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input">
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input"
                  />
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Corrective Actions */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <CheckSquare className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-slate-900">Corrective Actions</h2>
              <span className="text-xs text-slate-400">({correctiveActions.length})</span>
            </div>
            {correctiveActions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No corrective actions assigned.</p>
            ) : (
              <div className="space-y-3">
                {correctiveActions.map((action) => (
                  <Link
                    key={action.id}
                    href={`/corrective-actions/${action.id}`}
                    className="flex items-start justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 group-hover:text-brand-700 transition-colors">
                        {action.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {action.assignee && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />{action.assignee.full_name}
                          </span>
                        )}
                        {action.due_date && (
                          <span className="text-xs text-slate-400">Due: {formatDate(action.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={action.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Finding Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Severity", value: <SeverityBadge severity={finding.severity} /> },
                { label: "Status", value: <StatusBadge status={finding.status} /> },
                { label: "Site", value: finding.site?.name },
                { label: "Category", value: finding.category?.replace(/_/g, " ") },
                { label: "Assigned to", value: finding.assignee?.full_name || "Unassigned" },
                { label: "Due date", value: finding.due_date ? formatDate(finding.due_date) : "No due date" },
                { label: "Reported", value: formatRelativeTime(finding.created_at) },
                { label: "Resolved", value: finding.resolved_at ? formatDate(finding.resolved_at) : "—" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-0.5 capitalize">
                    {typeof item.value === "string" ? item.value : item.value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {finding.inspection && (
            <Link
              href={`/inspections/${finding.inspection.id}`}
              className="card p-4 block hover:border-slate-300 transition-all group"
            >
              <p className="text-xs text-slate-500 mb-1">Source Inspection</p>
              <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                View Inspection →
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDate(finding.inspection.started_at)}
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
