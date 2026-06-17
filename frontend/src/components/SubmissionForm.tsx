"use client";

import { useState } from "react";
import { ExternalLink, Send, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  dayId: string;
  existingSubmission: any;
  isLocked: boolean;
  isAdmin: boolean;
  isExpired: boolean;
}

export function SubmissionForm({ dayId, existingSubmission, isLocked, isAdmin, isExpired }: Props) {
  const [url, setUrl] = useState(existingSubmission?.stackblitzUrl || "");
  const [text, setText] = useState(existingSubmission?.textAnswer || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingSubmission);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes("stackblitz.com")) { alert("Valid StackBlitz URL required"); return; }
    setSubmitting(true);
    try {
      await apiFetch("/api/submissions", { method: "POST", body: JSON.stringify({ dayId, stackblitzUrl: url, textAnswer: text }) });
      setSubmitted(true);
      alert("Submitted successfully!");
    } catch {
      alert("Failed to submit");
    }
    setSubmitting(false);
  };

  if (isAdmin) return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">Admin View</h3>
      <p className="text-sm text-gray-600">Students submit StackBlitz projects here.</p>
    </div>
  );

  if (isLocked) return (
    <div className="card text-center py-8">
      <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-900 mb-1">Day Locked</h3>
      <p className="text-sm text-gray-600">Complete the previous day to unlock.</p>
    </div>
  );

  if (isExpired && !existingSubmission) return (
    <div className="card text-center py-8">
      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-900 mb-1">Deadline Passed</h3>
      <p className="text-sm text-gray-600">Submissions are closed for this day.</p>
    </div>
  );

  if (submitted && existingSubmission?.status === "REVIEWED") {
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Reviewed</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">StackBlitz URL</label>
            <a href={existingSubmission.stackblitzUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-secondary-600 hover:text-secondary-700 text-sm mt-1">
              <ExternalLink className="w-3 h-3" /> Open Project
            </a>
          </div>
          {existingSubmission.textAnswer && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Your Notes</label>
              <p className="text-sm text-gray-700 mt-1">{existingSubmission.textAnswer}</p>
            </div>
          )}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{existingSubmission.marks}/100</p>
            <p className="text-xs text-gray-500">Marks awarded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">
        {submitted ? "Update Submission" : "Submit Your Work"}
      </h3>

      {/* Expired warning but already submitted — show read-only notice */}
      {isExpired && existingSubmission && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Deadline has passed. Your submission is locked in.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">StackBlitz Project URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://stackblitz.com/edit/..."
            className="input text-sm"
            required
            disabled={isExpired}
          />
          <p className="text-xs text-gray-500 mt-1">Paste your StackBlitz project link</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Additional notes for instructor..."
            className="input text-sm min-h-[100px] resize-none"
            disabled={isExpired}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || isExpired}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting..." : submitted ? "Update Submission" : "Submit Work"}
        </button>
      </form>

      {submitted && existingSubmission?.status === "PENDING" && (
        <p className="text-xs text-yellow-600 text-center mt-3">Your submission is pending review.</p>
      )}
    </div>
  );
}