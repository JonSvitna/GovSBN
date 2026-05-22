"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckSquare, Edit2, Save, X, User, Calendar, AlertTriangle } from "lucide-react";
import { StatusBadge, SeverityBadge } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  action: any;
  members: any[];
  currentUserId: string;
  orgId: string;
}

export function CADetailClient({ action, members, currentUserId, orgId }: Props) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(action.status);
  const [assignedTo, setAssignedTo] = useState(action.assigned_to || "");
  const [dueDate, setDueDate] = useState(action.due_date || "");
  const [notes, setNotes] = useState(action.notes || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("corrective_actions")
      .update({
        status,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        notes: notes || null,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", action.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/corrective-actions" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Corrective Actions
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{action.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <SeverityBadge severity={action.priority} />
                <StatusBadge status={action.status} />
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-ghost text-sm">
            {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Action Description</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {action.description || "No description provided."}
            </p>
            {action.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{action.notes}</p>
              </div>
            )}
          </div>

          {/* Related Finding */}
          {action.finding && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h2 className="font-semibold text-slate-900 text-sm">Related Finding</h2>
              </div>
              <Link
                href={`/findings/${action.finding.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700">
                  {action.finding.title}
                </p>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={action.finding.severity} />
                  <StatusBadge status={action.finding.status} />
                </div>
              </Link>
            </div>
          )}

          {/* Edit Panel */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 border-brand-200 bg-brand-50"
            >
              <h2 className="font-semibold text-slate-900 mb-4">Update Action</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="verified">Verified</option>
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
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder="Add notes or resolution details..."
                  />
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Action Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Status", value: <StatusBadge status={action.status} /> },
                { label: "Priority", value: <SeverityBadge severity={action.priority} /> },
                { label: "Assigned to", value: action.assignee?.full_name || "Unassigned" },
                { label: "Due date", value: action.due_date ? formatDate(action.due_date) : "No due date" },
                { label: "Created", value: formatRelativeTime(action.created_at) },
                { label: "Completed", value: action.completed_at ? formatDate(action.completed_at) : "—" },
                { label: "Verified", value: action.verified_at ? formatDate(action.verified_at) : "—" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-0.5">
                    {typeof item.value === "string" ? item.value : item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
