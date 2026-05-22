"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Save, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  inspection: any;
  sections: any[];
  existingResponses: any[];
  userId: string;
  orgId: string;
}

export function ConductInspectionClient({ inspection, sections, existingResponses, userId, orgId }: Props) {
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, { value: string; notes: string }>>(() => {
    const map: Record<string, { value: string; notes: string }> = {};
    existingResponses.forEach((r) => {
      map[r.question_id] = { value: r.response_value || "", notes: r.response_text || "" };
    });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const section = sections[currentSection];
  const questions = section?.questions?.sort((a: any, b: any) => a.order_index - b.order_index) ?? [];
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const answeredCount = Object.keys(responses).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const setResponse = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], value },
    }));
  };

  const setNotes = (questionId: string, notes: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes },
    }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    const upserts = Object.entries(responses).map(([questionId, resp]) => {
      const question = sections.flatMap((s) => s.questions).find((q: any) => q.id === questionId);
      const triggersFind = question?.triggers_finding && question?.finding_on_values?.includes(resp.value);
      return {
        inspection_id: inspection.id,
        organization_id: orgId,
        question_id: questionId,
        question_text: question?.question_text || "",
        question_type: question?.question_type || "yes_no",
        response_value: resp.value,
        response_text: resp.notes || null,
        has_finding: triggersFind || false,
      };
    });

    if (upserts.length > 0) {
      await supabase.from("inspection_responses").upsert(upserts, {
        onConflict: "inspection_id,question_id",
        ignoreDuplicates: false,
      });
    }
    setSaving(false);
  }, [responses, sections, inspection.id, orgId, supabase]);

  const handleSubmit = async () => {
    setSubmitting(true);
    await handleSave();

    // Generate findings for triggered responses
    const allQuestions = sections.flatMap((s) => s.questions);
    const findingsToCreate: any[] = [];

    Object.entries(responses).forEach(([questionId, resp]) => {
      const question = allQuestions.find((q: any) => q.id === questionId);
      if (question?.triggers_finding && question?.finding_on_values?.includes(resp.value)) {
        findingsToCreate.push({
          organization_id: orgId,
          inspection_id: inspection.id,
          question_id: questionId,
          title: `Finding: ${question.question_text}`,
          description: `Response recorded as "${resp.value}". ${resp.notes || ""}`.trim(),
          severity: question.reporting_metadata?.risk_level || "medium",
          status: "open",
          category: question.reporting_metadata?.category || "general",
          site_id: inspection.site_id,
          inspector_id: userId,
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          reporting_metadata: question.reporting_metadata || {},
        });
      }
    });

    if (findingsToCreate.length > 0) {
      const { data: createdFindings } = await supabase.from("findings").insert(findingsToCreate).select();

      // Create corrective actions for each finding
      if (createdFindings) {
        const caInserts = createdFindings.map((f) => ({
          organization_id: orgId,
          finding_id: f.id,
          inspection_id: inspection.id,
          title: `Corrective Action: ${f.title}`,
          description: `Address finding identified during inspection: ${f.description}`,
          status: "pending",
          priority: f.severity,
          assigned_to: userId,
          assigned_by: userId,
          due_date: f.due_date,
        }));
        await supabase.from("corrective_actions").insert(caInserts);
      }
    }

    await supabase
      .from("inspections")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", inspection.id);

    router.push(`/inspections/${inspection.id}`);
    router.refresh();
  };

  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{inspection.template?.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {inspection.site?.name}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-ghost text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progress: {answeredCount} of {totalQuestions} questions answered</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-2 bg-brand-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSection(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === currentSection
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Section Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="card p-6 space-y-6"
        >
          <div>
            <h2 className="font-semibold text-slate-900">{section?.title}</h2>
            {section?.description && <p className="text-sm text-slate-500 mt-1">{section.description}</p>}
          </div>

          {questions.map((question: any) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={responses[question.id]?.value || ""}
              notes={responses[question.id]?.notes || ""}
              onChange={(v) => setResponse(question.id, v)}
              onNotesChange={(n) => setNotes(question.id, n)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentSection(currentSection - 1)}
          disabled={currentSection === 0}
          className="btn-secondary disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isLastSection ? (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="btn-primary"
          >
            <Send className="w-4 h-4" />
            Submit Inspection
          </button>
        ) : (
          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            className="btn-primary"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Submit inspection?</h3>
            <p className="text-sm text-slate-500 mt-2">
              You have answered {answeredCount} of {totalQuestions} questions. Any triggered findings and corrective actions will be automatically created.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function QuestionRenderer({ question, value, notes, onChange, onNotesChange }: {
  question: any;
  value: string;
  notes: string;
  onChange: (v: string) => void;
  onNotesChange: (n: string) => void;
}) {
  const isTriggered = question.triggers_finding && question.finding_on_values?.includes(value);

  return (
    <div className={`space-y-3 pb-5 border-b border-slate-100 last:border-0 last:pb-0 ${isTriggered ? "bg-orange-50 rounded-xl p-4 -mx-2 border-orange-200 border" : ""}`}>
      <div className="flex items-start gap-2">
        {question.is_required && <span className="text-red-500 text-sm flex-shrink-0 mt-0.5">*</span>}
        <p className="text-sm font-medium text-slate-900">{question.question_text}</p>
      </div>

      {isTriggered && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-100 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          This response will generate a finding and corrective action
        </div>
      )}

      {/* Yes/No */}
      {question.question_type === "yes_no" && (
        <div className="flex gap-2">
          {["yes", "no"].map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                value === opt
                  ? opt === "yes"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Pass/Fail */}
      {question.question_type === "pass_fail" && (
        <div className="flex gap-2">
          {["pass", "fail"].map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                value === opt
                  ? opt === "pass"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Severity */}
      {question.question_type === "severity" && (
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { value: "info", label: "Info", color: "bg-slate-100 text-slate-700 border-slate-300" },
            { value: "low", label: "Low", color: "bg-blue-100 text-blue-700 border-blue-300" },
            { value: "medium", label: "Med", color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
            { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-400" },
            { value: "critical", label: "Crit", color: "bg-red-100 text-red-700 border-red-400" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                value === opt.value ? opt.color + " ring-2 ring-offset-1 ring-current" : "border-slate-200 text-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Multiple Choice */}
      {question.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {(question.options || []).map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border-2 transition-all ${
                value === opt.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {question.question_type === "dropdown" && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        >
          <option value="">Select...</option>
          {(question.options || []).map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Notes */}
      {(question.question_type === "notes" || (value && question.question_type !== "notes")) && (
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={question.question_type === "notes" ? "Enter notes..." : "Additional notes (optional)..."}
          rows={question.question_type === "notes" ? 4 : 2}
          className="input resize-none text-sm"
        />
      )}
    </div>
  );
}
