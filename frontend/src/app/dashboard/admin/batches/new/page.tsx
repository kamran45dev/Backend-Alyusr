"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, GripVertical, Clock } from "lucide-react";

export default function NewBatchPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [weeks, setWeeks] = useState<any[]>([
    {
      title: "Week 1",
      days: [
        { title: "Day 1 - Introduction", deadline: "", slides: [{ type: "title", content: "Welcome to Week 1" }] },
        { title: "Day 2 - Basics", deadline: "", slides: [{ type: "title", content: "Basic Concepts" }] },
        { title: "Day 3 - Practice", deadline: "", slides: [{ type: "title", content: "Hands-on Practice" }] },
      ],
    },
  ]);
  const [saving, setSaving] = useState(false);

  const addWeek = () => setWeeks([...weeks, { title: `Week ${weeks.length + 1}`, days: [] }]);
  const removeWeek = (wi: number) => setWeeks(weeks.filter((_, i) => i !== wi));

  const addDay = (wi: number) => {
    const nw = [...weeks];
    nw[wi].days.push({ title: `Day ${nw[wi].days.length + 1}`, deadline: "", slides: [{ type: "title", content: "New Day" }] });
    setWeeks(nw);
  };
  const removeDay = (wi: number, di: number) => {
    const nw = [...weeks];
    nw[wi].days = nw[wi].days.filter((_: any, i: number) => i !== di);
    setWeeks(nw);
  };

  const updateWeekTitle = (wi: number, title: string) => { const nw = [...weeks]; nw[wi].title = title; setWeeks(nw); };
  const updateDayTitle = (wi: number, di: number, title: string) => { const nw = [...weeks]; nw[wi].days[di].title = title; setWeeks(nw); };
  const updateDayDeadline = (wi: number, di: number, deadline: string) => { const nw = [...weeks]; nw[wi].days[di].deadline = deadline; setWeeks(nw); };

  const addSlide = (wi: number, di: number, type: string) => {
    const nw = [...weeks];
    nw[wi].days[di].slides.push({ type, content: type === "code" ? "// Your code here" : "Enter content...", ...(type === "code" ? { language: "javascript" } : {}) });
    setWeeks(nw);
  };
  const updateSlide = (wi: number, di: number, si: number, field: string, value: string) => {
    const nw = [...weeks];
    (nw[wi].days[di].slides[si] as any)[field] = value;
    setWeeks(nw);
  };
  const removeSlide = (wi: number, di: number, si: number) => {
    const nw = [...weeks];
    nw[wi].days[di].slides = nw[wi].days[di].slides.filter((_: any, i: number) => i !== si);
    setWeeks(nw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert deadline strings to ISO or null before sending
      const payload = {
        name,
        description,
        startDate,
        weeks: weeks.map((w) => ({
          ...w,
          days: w.days.map((d: any) => ({
            ...d,
            deadline: d.deadline ? new Date(d.deadline).toISOString() : null,
          })),
        })),
      };
      await apiFetch("/api/batches", { method: "POST", body: JSON.stringify(payload) });
      router.push("/dashboard/admin");
    } catch {
      alert("Failed to create batch");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Batch</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Batch Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., JavaScript Fundamentals - May 2026" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="input min-h-[80px] resize-none" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Curriculum Structure</h2>
            <button type="button" onClick={addWeek} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Week
            </button>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="card border-l-4 border-l-primary-500">
              <div className="flex items-center gap-3 mb-4">
                <GripVertical className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={week.title}
                  onChange={(e) => updateWeekTitle(wi, e.target.value)}
                  className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none flex-1"
                />
                <button type="button" onClick={() => removeWeek(wi)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 ml-8">
                {week.days.map((day: any, di: number) => (
                  <div key={di} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium text-gray-500 w-12">Day {di + 1}</span>
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => updateDayTitle(wi, di, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:border-primary-500 outline-none"
                      />
                      <button type="button" onClick={() => removeDay(wi, di)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Deadline field */}
                    <div className="flex items-center gap-2 mb-3 ml-12">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      <label className="text-xs text-gray-500 w-20 shrink-0">Deadline</label>
                      <input
                        type="datetime-local"
                        value={day.deadline}
                        onChange={(e) => updateDayDeadline(wi, di, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-primary-500 outline-none text-gray-700"
                      />
                      {day.deadline && (
                        <button
                          type="button"
                          onClick={() => updateDayDeadline(wi, di, "")}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 ml-12">
                      {day.slides.map((slide: any, si: number) => (
                        <div key={si} className="flex gap-2">
                          <select
                            value={slide.type}
                            onChange={(e) => updateSlide(wi, di, si, "type", e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1.5 w-24"
                          >
                            <option value="title">Title</option>
                            <option value="text">Text</option>
                            <option value="code">Code</option>
                            <option value="tip">Tip</option>
                          </select>
                          {slide.type === "code" && (
                            <select
                              value={slide.language || "javascript"}
                              onChange={(e) => updateSlide(wi, di, si, "language", e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1.5 w-28"
                            >
                              <option value="javascript">JavaScript</option>
                              <option value="typescript">TypeScript</option>
                              <option value="html">HTML</option>
                              <option value="css">CSS</option>
                              <option value="python">Python</option>
                            </select>
                          )}
                          <textarea
                            value={slide.content}
                            onChange={(e) => updateSlide(wi, di, si, "content", e.target.value)}
                            className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 min-h-[60px] resize-y focus:border-primary-500 outline-none"
                          />
                          <button type="button" onClick={() => removeSlide(wi, di, si)} className="text-gray-400 hover:text-red-500 self-start">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addSlide(wi, di, "text")} className="text-xs text-secondary-600 hover:bg-secondary-50 px-2 py-1 rounded">+ Text</button>
                        <button type="button" onClick={() => addSlide(wi, di, "code")} className="text-xs text-secondary-600 hover:bg-secondary-50 px-2 py-1 rounded">+ Code</button>
                        <button type="button" onClick={() => addSlide(wi, di, "tip")} className="text-xs text-secondary-600 hover:bg-secondary-50 px-2 py-1 rounded">+ Tip</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addDay(wi)} className="text-sm text-secondary-600 hover:bg-secondary-50 px-3 py-2 rounded-lg flex items-center gap-1 ml-8">
                  <Plus className="w-3 h-3" /> Add Day
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary px-8">{saving ? "Creating..." : "Create Batch"}</button>
          <Link href="/dashboard/admin" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}