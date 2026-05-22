"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Layers, HelpCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface Props {
  template: any;
  sections: any[];
  userRole: string;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  yes_no: "Yes / No",
  pass_fail: "Pass / Fail",
  multiple_choice: "Multiple Choice",
  dropdown: "Dropdown",
  notes: "Notes",
  evidence_upload: "Evidence Upload",
  signature: "Signature",
  severity: "Severity Rating",
  conditional: "Conditional",
};

export function TemplateDetailClient({ template, sections, userRole }: Props) {
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const triggeringQuestions = sections
    .flatMap((s) => s.questions || [])
    .filter((q: any) => q.triggers_finding).length;

  return (
    <div>
      <div className="mb-8">
        <Link href="/templates" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
              {template.description && (
                <p className="text-sm text-slate-500 mt-1">{template.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={template.is_active ? "success" : "muted"}>
                  {template.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-slate-400 capitalize">{template.category}</span>
                <span className="text-xs text-slate-400">v{template.version}</span>
              </div>
            </div>
          </div>
          {["admin", "manager"].includes(userRole) && (
            <Link href={`/templates/${template.id}/edit`} className="btn-secondary text-sm">
              Edit Template
            </Link>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{sections.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Sections</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalQuestions}</p>
          <p className="text-xs text-slate-500 mt-0.5">Questions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{triggeringQuestions}</p>
          <p className="text-xs text-slate-500 mt-0.5">Finding Triggers</p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => {
          const questions = section.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.08, duration: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{section.title}</h2>
                  {section.description && <p className="text-xs text-slate-500">{section.description}</p>}
                </div>
                <span className="ml-auto text-xs text-slate-400">{questions.length} questions</span>
              </div>

              <div className="space-y-2.5">
                {questions.map((question: any, qIdx: number) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs text-slate-400 w-5 flex-shrink-0 mt-0.5 font-mono">
                      {qIdx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-slate-800 flex-1">{question.question_text}</p>
                        {question.is_required && (
                          <span className="text-red-500 text-xs flex-shrink-0">required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600">
                          {QUESTION_TYPE_LABELS[question.question_type] || question.question_type}
                        </span>
                        {question.triggers_finding && (
                          <span className="flex items-center gap-1 text-xs text-orange-600">
                            <AlertTriangle className="w-3 h-3" />
                            Triggers finding on: {question.finding_on_values?.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="card p-8 text-center">
          <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No sections configured for this template.</p>
        </div>
      )}
    </div>
  );
}
