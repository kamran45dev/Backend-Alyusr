"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Code, Type } from "lucide-react";

interface Slide {
  type: string;
  content: string;
  language?: string;
}

interface Props {
  slides: Slide[];
}

export function SlideViewer({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  if (!slides || slides.length === 0) return <div className="card py-12 text-center"><p className="text-gray-500">No slides available.</p></div>;

  const slide = slides[current];
  const next = () => setCurrent((p) => Math.min(p + 1, slides.length - 1));
  const prev = () => setCurrent((p) => Math.max(p - 1, 0));

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        {slides.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= current ? "bg-primary-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="min-h-[300px]">
        {slide.type === "title" && <div className="text-center py-8"><h2 className="text-2xl font-bold text-gray-900">{slide.content}</h2></div>}
        {slide.type === "text" && (
          <div className="flex items-start gap-3">
            <Type className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{slide.content}</div>
          </div>
        )}
        {slide.type === "code" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">{slide.language || "Code"}</span>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{slide.content}</code></pre>
          </div>
        )}
        {slide.type === "tip" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div><p className="font-medium text-yellow-800 mb-1">Pro Tip</p><p className="text-yellow-700 text-sm">{slide.content}</p></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button onClick={prev} disabled={current === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors"><ChevronLeft className="w-4 h-4" /> Previous</button>
        <span className="text-sm text-gray-500">{current + 1} / {slides.length}</span>
        <button onClick={next} disabled={current === slides.length - 1} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors">Next <ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
