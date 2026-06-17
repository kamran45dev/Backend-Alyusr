"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { GradeSubmissions } from "@/components/GradeSubmissions";
import { StudentProgress } from "@/components/StudentProgress";
import { EnrollStudent } from "@/components/EnrollStudent";
import { SlideEditor } from "@/components/SlideEditor";
import { ArrowLeft, Users, BookOpen, Calendar, Save, X, Pencil, AlertTriangle, Lock, Unlock, Trash2, Clock, Plus } from "lucide-react";

export default function BatchDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [batch, setBatch] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "", isActive: true });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});
  const [savingDeadline, setSavingDeadline] = useState<string | null>(null);
  const [editingSlides, setEditingSlides] = useState<{ dayId: string; dayTitle: string; slides: any[] } | null>(null);

  // Add day/week state
  const [addingDayToWeek, setAddingDayToWeek] = useState<string | null>(null);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [addingWeek, setAddingWeek] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") { router.push("/dashboard"); return; }
    apiFetch(`/api/batches/${id}`).then((data) => {
      setBatch(data);
      setEditData({ name: data.name, description: data.description || "", isActive: data.isActive });
      const existing: Record<string, string> = {};
      data.weeks?.forEach((w: any) => {
        w.days.forEach((d: any) => {
          if (d.deadline) {
            existing[d.id] = new Date(d.deadline).toISOString().slice(0, 16);
          }
        });
      });
      setDeadlines(existing);
    }).catch(console.error);
  }, [user, id, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSave = async () => {
    if (!confirmEdit) { setConfirmEdit(true); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          isActive: editData.isActive,
        }),
      });
      setConfirmEdit(false);
      setEditing(false);
      refresh();
    } catch {
      alert("Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await apiFetch(`/api/batches/${id}`, { method: "DELETE" });
      router.push("/dashboard/admin");
    } catch {
      alert("Failed to delete batch");
      setDeleting(false);
    }
  };

  const toggleDayLock = async (dayId: string, isLocked: boolean) => {
    const endpoint = isLocked ? `/api/days/${dayId}/unlock` : `/api/days/${dayId}/lock`;
    try {
      await apiFetch(endpoint, { method: "PATCH" });
      refresh();
    } catch {
      alert("Failed to toggle lock");
    }
  };

  const handleSetDeadline = async (dayId: string) => {
    setSavingDeadline(dayId);
    try {
      const value = deadlines[dayId];
      await apiFetch(`/api/days/${dayId}/deadline`, {
        method: "PATCH",
        body: JSON.stringify({ deadline: value ? new Date(value).toISOString() : null }),
      });
      refresh();
    } catch {
      alert("Failed to set deadline");
    }
    setSavingDeadline(null);
  };

  const handleClearDeadline = async (dayId: string) => {
    setSavingDeadline(dayId);
    try {
      await apiFetch(`/api/days/${dayId}/deadline`, {
        method: "PATCH",
        body: JSON.stringify({ deadline: null }),
      });
      setDeadlines((prev) => { const next = { ...prev }; delete next[dayId]; return next; });
      refresh();
    } catch {
      alert("Failed to clear deadline");
    }
    setSavingDeadline(null);
  };

  const handleAddDay = async (weekId: string) => {
    setAddingItem(true);
    try {
      await apiFetch(`/api/batches/${id}/weeks/${weekId}/days`, {
        method: "POST",
        body: JSON.stringify({ title: newDayTitle }),
      });
      setAddingDayToWeek(null);
      setNewDayTitle("");
      refresh();
    } catch {
      alert("Failed to add day");
    }
    setAddingItem(false);
  };

  const handleAddWeek = async () => {
    setAddingItem(true);
    try {
      await apiFetch(`/api/batches/${id}/weeks`, {
        method: "POST",
        body: JSON.stringify({ title: newWeekTitle }),
      });
      setAddingWeek(false);
      setNewWeekTitle("");
      refresh();
    } catch {
      alert("Failed to add week");
    }
    setAddingItem(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user || user.role !== "ADMIN") return null;
  if (!batch) return <div className="p-8 text-center">Loading batch...</div>;

  const totalDays = batch.weeks?.reduce((acc: number, w: any) => acc + w.days.length, 0) || 0;
  const pendingSubmissions = batch.weeks?.reduce(
    (acc: number, w: any) => acc + w.days.reduce((dacc: number, d: any) =>
      dacc + d.submissions?.filter((s: any) => s.status === "PENDING").length, 0), 0
  ) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-3 max-w-xl">
              <div>
                <label className="text-sm font-medium text-gray-700">Batch Name</label>
                <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="input mt-1 min-h-[60px] resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={editData.isActive} onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="active" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className={`btn-primary text-sm flex items-center gap-2 ${confirmEdit ? "bg-red-600 hover:bg-red-700" : ""}`}>
                  {confirmEdit ? <><AlertTriangle className="w-3 h-3" /> {saving ? "Saving..." : "Confirm Save"}</> : <><Save className="w-3 h-3" /> Save Changes</>}
                </button>
                {confirmEdit && (
                  <button onClick={() => setConfirmEdit(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                )}
                <button onClick={() => { setEditing(false); setConfirmEdit(false); setEditData({ name: batch.name, description: batch.description || "", isActive: batch.isActive }); }}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900">{batch.name}</h1>
              <p className="text-gray-600 mt-1">{batch.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(batch.startDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {batch.enrollments?.length || 0} students</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalDays} days</span>
                {pendingSubmissions > 0 && <span className="text-yellow-600 font-medium">{pendingSubmissions} pending reviews</span>}
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${batch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {batch.isActive ? "Active" : "Inactive"}
            </span>
            <button onClick={() => setEditing(true)} className="text-sm text-secondary-600 hover:bg-secondary-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-all border ${
                confirmDelete
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : "text-red-600 border-red-300 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3 h-3" />
              {confirmDelete ? (deleting ? "Deleting..." : "Confirm Delete") : "Delete Batch"}
            </button>
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-8">
        <EnrollStudent batchId={batch.id} existingStudents={batch.enrollments || []} onEnroll={refresh} />
      </div>

      <div className="mb-8">
        <StudentProgress batch={batch} onRemove={refresh} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Submissions & Grading</h2>
          <button
            onClick={() => { setAddingWeek(true); setNewWeekTitle(""); }}
            className="text-sm btn-primary flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Week
          </button>
        </div>

        {/* Add Week form */}
        {addingWeek && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
            <input
              type="text"
              value={newWeekTitle}
              onChange={(e) => setNewWeekTitle(e.target.value)}
              placeholder="Week title e.g. Week 2"
              className="input text-sm flex-1"
              autoFocus
            />
            <button
              onClick={handleAddWeek}
              disabled={addingItem || !newWeekTitle.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {addingItem ? "Adding..." : "Add"}
            </button>
            <button onClick={() => setAddingWeek(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {batch.weeks?.map((week: any) => (
            <div key={week.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Week {week.weekNumber}: {week.title}
                </h3>
                <button
                  onClick={() => { setAddingDayToWeek(week.id); setNewDayTitle(""); }}
                  className="text-xs text-secondary-600 hover:bg-secondary-50 px-2 py-1 rounded flex items-center gap-1 border border-secondary-300"
                >
                  <Plus className="w-3 h-3" /> Add Day
                </button>
              </div>

              {/* Add Day form */}
              {addingDayToWeek === week.id && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                  <input
                    type="text"
                    value={newDayTitle}
                    onChange={(e) => setNewDayTitle(e.target.value)}
                    placeholder="Day title e.g. Day 4 - CSS Basics"
                    className="input text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddDay(week.id)}
                  />
                  <button
                    onClick={() => handleAddDay(week.id)}
                    disabled={addingItem || !newDayTitle.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {addingItem ? "Adding..." : "Add"}
                  </button>
                  <button onClick={() => setAddingDayToWeek(null)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {week.days.map((day: any) => {
                  const locked = day.isLocked === true;
                  const deadlineValue = deadlines[day.id] ?? "";
                  const isExpired = day.deadline && new Date() > new Date(day.deadline);

                  return (
                    <div key={day.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">Day {day.dayNumber}: {day.title}</span>
                          {locked ? (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center gap-1 font-semibold border border-gray-300">
                              <Lock className="w-3 h-3" /> LOCKED
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1 font-semibold border border-green-300">
                              <Unlock className="w-3 h-3" /> UNLOCKED
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-semibold border border-red-300">
                              <Clock className="w-3 h-3" /> EXPIRED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setEditingSlides({
                              dayId: day.id,
                              dayTitle: day.title,
                              slides: JSON.parse(day.slides),
                            })}
                            className="text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1 border border-gray-300 hover:bg-gray-100 text-gray-700"
                          >
                            <Pencil className="w-3 h-3" /> Edit Slides
                          </button>

                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <input
                              type="datetime-local"
                              value={deadlineValue}
                              onChange={(e) => setDeadlines((prev) => ({ ...prev, [day.id]: e.target.value }))}
                              className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-secondary-500"
                            />
                            <button
                              onClick={() => handleSetDeadline(day.id)}
                              disabled={savingDeadline === day.id || !deadlineValue}
                              className="text-xs px-2 py-1 bg-secondary-600 text-white rounded hover:bg-secondary-700 disabled:opacity-50"
                            >
                              {savingDeadline === day.id ? "..." : "Set"}
                            </button>
                            {day.deadline && (
                              <button
                                onClick={() => handleClearDeadline(day.id)}
                                disabled={savingDeadline === day.id}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded border border-red-300"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => toggleDayLock(day.id, locked)}
                            className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 shadow-sm border-2 ${
                              locked
                                ? "bg-secondary-600 text-white border-secondary-600 hover:bg-secondary-700"
                                : "bg-white text-gray-700 border-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            {locked ? <><Unlock className="w-3 h-3" /> UNLOCK</> : <><Lock className="w-3 h-3" /> LOCK</>}
                          </button>
                          <span className="text-xs text-gray-500 font-medium">{day.submissions?.length || 0} submissions</span>
                        </div>
                      </div>

                      {day.submissions?.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {day.submissions.map((sub: any) => (
                            <GradeSubmissions key={sub.id} submission={sub} onGraded={refresh} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingSlides && (
        <SlideEditor
          dayId={editingSlides.dayId}
          dayTitle={editingSlides.dayTitle}
          initialSlides={editingSlides.slides}
          onSave={() => { setEditingSlides(null); refresh(); }}
          onCancel={() => setEditingSlides(null)}
        />
      )}
    </div>
  );
}