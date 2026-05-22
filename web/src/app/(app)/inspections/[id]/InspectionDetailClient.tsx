"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Calendar, User, FileText, AlertTriangle,
  CheckSquare, ClipboardList, CheckCircle2, XCircle, Minus
} from "lucide-react";
import { StatusBadge, SeverityBadge } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface Props {
  inspection: any;
  responses: any[];
  findings: any[];
  correctiveActions: any[];
  currentUserId: string;
  userRole: string;
}

export function InspectionDetailClient({ inspection, responses, findings, correctiveActions, currentUserId, userRole }: Props) {
  const getResponseIcon = (value: string) => {
    if (["yes", "pass"].includes(value?.toLowerCase())) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (["no", "fail"].includes(value?.toLowerCase())) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/inspections" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Inspections
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {inspection.template?.name || "Inspection"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {inspection.site && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {inspection.site.name}
                  {inspection.site.city && `, ${inspection.site.city}`}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {formatDate(inspection.created_at)}
              </span>
              {inspection.inspector && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <User className="w-4 h-4" />
                  {inspection.inspector.full_name}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={inspection.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Responses */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Inspection Responses</h2>
              <span className="text-xs text-slate-400">({responses.length})</span>
            </div>
            {responses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No responses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {responses.map((response) => (
                  <div key={response.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="mt-0.5">{getResponseIcon(response.response_value)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">{response.question_text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium capitalize ${
                          ["yes", "pass"].includes(response.response_value?.toLowerCase())
                            ? "text-green-600"
                            : ["no", "fail"].includes(response.response_value?.toLowerCase())
                            ? "text-red-600"
                            : "text-slate-600"
                        }`}>
                          {response.response_value}
                        </span>
                        {response.notes && (
                          <span className="text-xs text-slate-500 truncate">{response.notes}</span>
                        )}
                        {response.has_finding && (
                          <span className="text-xs text-orange-600 font-medium">Finding generated</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Findings */}
          {findings.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h2 className="font-semibold text-slate-900">Findings</h2>
                <span className="text-xs text-slate-400">({findings.length})</span>
              </div>
              <div className="space-y-3">
                {findings.map((finding) => (
                  <Link
                    key={finding.id}
                    href={`/findings/${finding.id}`}
                    className="flex items-start justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 group-hover:text-brand-700 transition-colors">
                        {finding.title}
                      </p>
                      {finding.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{finding.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <SeverityBadge severity={finding.severity} />
                      <StatusBadge status={finding.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Corrective Actions */}
          {correctiveActions.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-slate-900">Corrective Actions</h2>
                <span className="text-xs text-slate-400">({correctiveActions.length})</span>
              </div>
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
                      {action.due_date && (
                        <p className="text-xs text-slate-500 mt-0.5">Due: {formatDate(action.due_date)}</p>
                      )}
                    </div>
                    <StatusBadge status={action.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">Inspection Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Template", value: inspection.template?.name },
                { label: "Category", value: inspection.template?.category },
                { label: "Site", value: inspection.site?.name },
                { label: "Inspector", value: inspection.inspector?.full_name },
                { label: "Started", value: formatDate(inspection.started_at) },
                { label: "Submitted", value: inspection.submitted_at ? formatDate(inspection.submitted_at) : "—" },
                { label: "Responses", value: responses.length },
                { label: "Findings", value: findings.length },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-0.5 capitalize">{item.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          {inspection.status === "in_progress" && (
            <Link
              href={`/inspections/${inspection.id}/conduct`}
              className="btn-primary w-full justify-center"
            >
              <ClipboardList className="w-4 h-4" />
              Continue Inspection
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
