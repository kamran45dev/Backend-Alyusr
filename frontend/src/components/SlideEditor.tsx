"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Slide {
  type: string;
  content: string;
  language?: string;
}

interface Props {
  dayId: string;
  dayTitle: string;
  initialSlides: Slide[];
  onSave: () => void;
  onCancel: () => void;
}

export function SlideEditor({ dayId, dayTitle, initialSlides, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(dayTitle);
  const [slides, setSlides] = useState<Slide[]>(initialSlides.map((s) => ({ ...s })));
  const [saving, setSaving] = useState(false);

  const addSlide = (type: string) => {
    setSlides([...slides, {
      type,
      content: type === "code" ? "// Your code here" : "",
      ...(type === "code" ? { language: "html" } : {}),
    }]);
  };

  const removeSlide = (i: number) => {
    setSlides(slides.filter((_, idx) => idx !== i));
  };

  const updateSlide = (i: number, field: string, value: string) => {
    const updated = [...slides];
    (updated[i] as any)[field] = value;
    setSlides(updated);
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const updated = [...slides];
    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
    setSlides(updated);
  };

  const moveDown = (i: number) => {
    if (i === slides.length - 1) return;
    const updated = [...slides];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    setSlides(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/days/${dayId}/slides`, {
        method: "PATCH",
        body: JSON.stringify({ slides, title }),
      });
      onSave();
    } catch {
      alert("Failed to save slides");
    }
    setSaving(false);
  };

  const slideTypeColors: Record<string, string> = {
    title: "border-l-purple-500",
    text: "border-l-secondary-500",
    code: "border-l-green-500",
    tip: "border-l-yellow-500",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto my-8 px-4">
        <div className="bg-white rounded-xl shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex-1 mr-4">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Day Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-secondary-500 outline-none w-full bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slides */}
          <div className="p-6 space-y-3">
            {slides.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No slides yet. Add one below.
              </div>
            )}

            {slides.map((slide, i) => (
              <div key={i} className={`border-l-4 ${slideTypeColors[slide.type] || "border-l-gray-300"} bg-gray-50 rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="w-4 h-4 text-gray-400" />

                  <select
                    value={slide.type}
                    onChange={(e) => updateSlide(i, "type", e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1.5 font-medium"
                  >
                    <option value="title">Title</option>
                    <option value="text">Text</option>
                    <option value="code">Code</option>
                    <option value="tip">Tip</option>
                  </select>

                  {slide.type === "code" && (
                    <select
                      value={slide.language || "html"}
                      onChange={(e) => updateSlide(i, "language", e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1.5"
                    >
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                    </select>
                  )}

                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === slides.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeSlide(i)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={slide.content}
                  onChange={(e) => updateSlide(i, "content", e.target.value)}
                  placeholder={
                    slide.type === "title" ? "Enter slide title..." :
                    slide.type === "tip" ? "Enter tip content..." :
                    slide.type === "code" ? "Enter code here..." :
                    "Enter text content..."
                  }
                  className={`w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-secondary-500 resize-y ${
                    slide.type === "code"
                      ? "font-mono bg-gray-900 text-gray-100 min-h-[120px]"
                      : "bg-white min-h-[80px]"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Add slide buttons */}
          <div className="px-6 pb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Add Slide</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => addSlide("title")} className="text-sm px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Title
              </button>
              <button onClick={() => addSlide("text")} className="text-sm px-3 py-1.5 rounded-lg border border-secondary-300 text-secondary-700 hover:bg-secondary-50 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Text
              </button>
              <button onClick={() => addSlide("code")} className="text-sm px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Code
              </button>
              <button onClick={() => addSlide("tip")} className="text-sm px-3 py-1.5 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tip
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}