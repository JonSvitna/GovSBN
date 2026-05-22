"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  triggers_finding: boolean;
  finding_on_values: string[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const DEFAULT_FINDING_VALUES: Record<string, string[]> = {
  yes_no: ["no"],
  pass_fail: ["fail"],
  severity: ["critical", "high"],
};

export function NewTemplateClient({ userId, orgId }: { userId: string; orgId: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [sections, setSections] = useState<Section[]>([
    { id: crypto.randomUUID(), title: "Section 1", description: "", questions: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const addSection = () => {
    setSections([...sections, {
      id: crypto.randomUUID(),
      title: `Section ${sections.length + 1}`,
      description: "",
      questions: [],
    }]);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const addQuestion = (sectionId: string) => {
    const q: Question = {
      id: crypto.randomUUID(),
      question_text: "",
      question_type: "yes_no",
      is_required: true,
      triggers_finding: false,
      finding_on_values: [],
    };
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, questions: [...s.questions, q] } : s
    ));
  };

  const updateQuestion = (sectionId: string, qId: string, updates: Partial<Question>) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, questions: s.questions.map((q) => q.id === qId ? { ...q, ...updates } : q) }
        : s
    ));
  };

  const removeQuestion = (sectionId: string, qId: string) => {
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== qId) } : s
    ));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    setSaving(true);
    setError("");

    const { data: template, error: tErr } = await supabase
      .from("inspection_templates")
      .insert({ organization_id: orgId, name, description, category, created_by: userId })
      .select()
      .single();

    if (tErr || !template) {
      setError(tErr?.message || "Failed to create template.");
      setSaving(false);
      return;
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const { data: sec } = await supabase
        .from("template_sections")
        .insert({
          template_id: template.id,
          organization_id: orgId,
          title: section.title,
          description: section.description,
          order_index: sIdx,
        })
        .select()
        .single();

      if (sec) {
        for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
          const q = section.questions[qIdx];
          await supabase.from("template_questions").insert({
            section_id: sec.id,
            template_id: template.id,
            organization_id: orgId,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            triggers_finding: q.triggers_finding,
            finding_on_values: q.finding_on_values,
            order_index: qIdx,
            reporting_metadata: { category },
          });
        }
      }
    }

    router.push(`/templates/${template.id}`);
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/templates" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Template</h1>
        <p className="text-sm text-slate-500 mt-1">Build your inspection template with sections and questions</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Template Info */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Template Information</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Template name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. General Facility Inspection"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Brief description of this inspection template..."
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="general">General</option>
              <option value="facility">Facility</option>
              <option value="safety">Safety</option>
              <option value="environmental">Environmental</option>
              <option value="vehicle">Vehicle / Fleet</option>
              <option value="workplace">Workplace</option>
              <option value="security">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4 mb-6">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <GripVertical className="w-4 h-4 text-slate-300 mt-2.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="input font-medium"
                  placeholder="Section title"
                />
                <input
                  type="text"
                  value={section.description}
                  onChange={(e) => updateSection(section.id, { description: e.target.value })}
                  className="input text-sm"
                  placeholder="Section description (optional)"
                />
              </div>
              {sections.length > 1 && (
                <button onClick={() => removeSection(section.id)} className="btn-ghost text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-3 ml-7">
              {section.questions.map((question) => (
                <div key={question.id} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(section.id, question.id, { question_text: e.target.value })}
                      className="input flex-1 text-sm"
                      placeholder="Question text..."
                    />
                    <button onClick={() => removeQuestion(section.id, question.id)} className="btn-ghost text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={question.question_type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateQuestion(section.id, question.id, {
                          question_type: newType,
                          finding_on_values: DEFAULT_FINDING_VALUES[newType] || [],
                        });
                      }}
                      className="input w-auto text-xs"
                    >
                      <option value="yes_no">Yes / No</option>
                      <option value="pass_fail">Pass / Fail</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="notes">Notes</option>
                      <option value="severity">Severity Rating</option>
                      <option value="evidence_upload">Evidence Upload</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.is_required}
                        onChange={(e) => updateQuestion(section.id, question.id, { is_required: e.target.checked })}
                        className="rounded"
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.triggers_finding}
                        onChange={(e) => updateQuestion(section.id, question.id, { triggers_finding: e.target.checked })}
                        className="rounded"
                      />
                      Triggers finding
                    </label>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addQuestion(section.id)}
                className="btn-ghost text-xs gap-1.5 w-full justify-center border border-dashed border-slate-300 py-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add question
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button onClick={addSection} className="btn-secondary w-full gap-2 mb-8">
        <Plus className="w-4 h-4" />
        Add Section
      </button>

      <div className="flex items-center justify-end gap-3">
        <Link href="/templates" className="btn-secondary">Cancel</Link>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Creating..." : "Create Template"}
        </button>
      </div>
    </div>
  );
}
