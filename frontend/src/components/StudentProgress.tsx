"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, UserX, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  batch: any;
  onRemove?: () => void;
}

export function StudentProgress({ batch, onRemove }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (enrollmentId: string) => {
    if (confirmRemove !== enrollmentId) {
      setConfirmRemove(enrollmentId);
      return;
    }
    setRemoving(enrollmentId);
    try {
      await apiFetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      setConfirmRemove(null);
      onRemove?.();
    } catch {
      alert("Failed to remove student");
    }
    setRemoving(null);
  };

  const studentData = (batch.enrollments || []).map((enrollment: any) => {
    const userSubmissions = (batch.weeks || []).flatMap((w: any) =>
      (w.days || []).flatMap((d: any) => (d.submissions || []).filter((s: any) => s.userId === enrollment.userId))
    );
    const totalDays = (batch.weeks || []).reduce((acc: number, w: any) => acc + (w.days?.length || 0), 0);
    const completedDays = userSubmissions.length;
    const totalMarks = userSubmissions.reduce((acc: number, s: any) => acc + (s.marks || 0), 0);
    const averageMarks = completedDays > 0 ? Math.round(totalMarks / completedDays) : 0;

    return {
      ...enrollment.user,
      enrollmentId: enrollment.id,
      completedDays,
      totalDays,
      progressPercent: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      totalMarks,
      averageMarks,
      submissions: userSubmissions,
    };
  });

  studentData.sort((a: any, b: any) => b.totalMarks - a.totalMarks);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        <h2 className="text-xl font-bold">Students ({studentData.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completed</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Avg</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr></thead>
          <tbody>
            {studentData.map((student: any) => (
              <>
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === student.id ? null : student.id)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {student.image ? <img src={student.image} alt={student.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{student.name?.charAt(0)}</div>}
                      <div><p className="font-medium text-sm">{student.name}</p><p className="text-xs text-gray-500">{student.email}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${student.progressPercent}%` }} /></div>
                    <span className="text-xs text-gray-500 mt-1">{student.progressPercent}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm">{student.completedDays}/{student.totalDays}</td>
                  <td className="py-3 px-4"><span className={`text-sm font-medium ${student.averageMarks >= 80 ? "text-success" : student.averageMarks >= 60 ? "text-warning" : "text-danger"}`}>{student.averageMarks}%</span></td>
                  <td className="py-3 px-4 text-sm font-medium">{student.totalMarks}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRemove(student.enrollmentId)}
                        disabled={removing === student.enrollmentId}
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors border ${confirmRemove === student.enrollmentId ? "bg-danger text-white border-danger hover:bg-red-600" : "bg-white text-gray-600 border-gray-300 hover:bg-red-50 hover:text-danger"}`}
                      >
                        {confirmRemove === student.enrollmentId ? (
                          <><AlertTriangle className="w-3 h-3" /> {removing === student.enrollmentId ? "..." : "Confirm"}</>
                        ) : (
                          <><UserX className="w-3 h-3" /> Remove</>
                        )}
                      </button>
                      {confirmRemove === student.enrollmentId && (
                        <button onClick={() => setConfirmRemove(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      )}
                      {expanded === student.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </td>
                </tr>
                {expanded === student.id && (
                  <tr><td colSpan={6} className="px-4 py-4 bg-gray-50">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase">Submissions</p>
                      {student.submissions.length === 0 ? <p className="text-sm text-gray-500">No submissions yet</p> : student.submissions.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                          <div><p className="font-medium">{sub.day?.title || "Day"}</p><a href={sub.stackblitzUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">View on StackBlitz</a></div>
                          <div className="text-right">{sub.status === "REVIEWED" ? <span className="text-success font-medium">{sub.marks}/100</span> : <span className="text-warning text-xs">Pending</span>}</div>
                        </div>
                      ))}
                    </div>
                  </td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}