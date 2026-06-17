"use client";

import { useState } from "react";
import { ExternalLink, Send, Star } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  submission: any;
  onGraded?: () => void;
}

export function GradeSubmissions({ submission, onGraded }: Props) {
  const [marks, setMarks] = useState(submission.marks?.toString() || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);
  const [graded, setGraded] = useState(submission.status === "REVIEWED");

  const handleGrade = async () => {
    const m = parseInt(marks);
    if (isNaN(m) || m < 0 || m > 100) { alert("Marks must be 0-100"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/admin/grade", { method: "POST", body: JSON.stringify({ submissionId: submission.id, marks: m, feedback }) });
      setGraded(true);
      onGraded?.();
    } catch {
      alert("Failed to grade");
    }
    setSaving(false);
  };

  return (
    <div className="px-4 py-4 flex items-start gap-4">
      {submission.user?.image ? (
        <img src={submission.user.image} alt={submission.user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">{submission.user?.name?.charAt(0)}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div><p className="font-medium text-sm">{submission.user?.name}</p><p className="text-xs text-gray-500">{submission.user?.email}</p></div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${graded ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{graded ? "Reviewed" : "Pending"}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <a href={submission.stackblitzUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded"><ExternalLink className="w-3 h-3" /> Open StackBlitz</a>
          <span className="text-xs text-gray-400">{new Date(submission.submittedAt).toLocaleDateString()}</span>
        </div>
        {submission.textAnswer && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">Student Notes:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.textAnswer}</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Marks (0-100)</label>
              <div className="relative">
                <Star className="w-4 h-4 text-warning absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="number" min="0" max="100" value={marks} onChange={(e) => setMarks(e.target.value)} disabled={graded} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 outline-none disabled:bg-gray-100" />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={graded} placeholder="Provide feedback..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px] resize-none focus:border-primary-500 outline-none disabled:bg-gray-100" />
          </div>
          {!graded && (
            <button onClick={handleGrade} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              <Send className="w-3 h-3" />{saving ? "Saving..." : "Submit Grade"}
            </button>
          )}
          {graded && <p className="text-xs text-success font-medium">Graded: {submission.marks}/100</p>}
        </div>
      </div>
    </div>
  );
}
