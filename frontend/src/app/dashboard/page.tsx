"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { ChatBox } from "@/components/ChatBox";
import { BookOpen, CheckCircle, Clock, Lock, AlertTriangle } from "lucide-react";

function DeadlineLabel({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) return (
    <span className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
      <AlertTriangle className="w-3 h-3" /> Expired
    </span>
  );

  if (!timeLeft) return null;

  const isUrgent = !timeLeft.includes("h") && parseInt(timeLeft) < 10;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium mt-1 ${isUrgent ? "text-red-600" : "text-yellow-600"}`}>
      <Clock className="w-3 h-3" /> {timeLeft} left
    </span>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/batches").then(setBatches).catch(console.error);
  }, [user]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning</h1>
      <p className="text-gray-600 mb-8">Track your progress across all batches</p>

      {batches.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No enrollments yet</h3>
          <p className="text-gray-600">Contact your instructor to get enrolled.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => {
            const totalDays = batch.weeks.reduce((acc: number, w: any) => acc + w.days.length, 0);
            const completedDays = batch.weeks.reduce(
              (acc: number, w: any) => acc + w.days.filter((d: any) => d.submissions?.length > 0).length, 0
            );
            const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            return (
              <div key={batch.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{batch.name}</h2>
                    <p className="text-gray-600 text-sm mt-1">{batch.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                    {progress}% Complete
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div className="bg-secondary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid gap-4">
                  {batch.weeks.map((week: any) => (
                    <div key={week.id}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Week {week.weekNumber}: {week.title}
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {week.days.map((day: any) => {
                          const submitted = day.submissions?.length > 0;
                          const reviewed = submitted && day.submissions[0]?.status === "REVIEWED";
                          const marks = day.submissions?.[0]?.marks;
                          const isExpired = day.deadline && new Date() > new Date(day.deadline);

                          // Locked day
                          if (day.isLocked) {
                            return (
                              <div key={day.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                  <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-700 truncate">{day.title}</p>
                              </div>
                            );
                          }

                          // Unlocked day
                          return (
                            <Link
                              key={day.id}
                              href={`/day/${day.id}`}
                              className={`p-4 rounded-lg border transition-all ${
                                submitted
                                  ? reviewed
                                    ? "border-green-300 bg-green-50"
                                    : "border-yellow-300 bg-yellow-50"
                                  : isExpired
                                  ? "border-red-200 bg-red-50 hover:border-red-300"
                                  : "border-gray-200 bg-white hover:border-secondary-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                {submitted ? (
                                  reviewed
                                    ? <CheckCircle className="w-4 h-4 text-green-600" />
                                    : <Clock className="w-4 h-4 text-yellow-600" />
                                ) : isExpired ? (
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                ) : null}
                              </div>

                              <p className="text-sm text-gray-700 truncate">{day.title}</p>

                              {/* Marks */}
                              {reviewed && marks !== null && (
                                <p className="text-xs text-green-600 mt-1 font-medium">{marks}/100</p>
                              )}

                              {/* Deadline countdown or expired label */}
                              {day.deadline && !reviewed && (
                                <DeadlineLabel deadline={day.deadline} />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedBatch(selectedBatch === batch.id ? null : batch.id)}
                    className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                  >
                    {selectedBatch === batch.id ? "Hide Chat" : "Open Batch Chat"}
                  </button>
                </div>
                {selectedBatch === batch.id && <div className="mt-4"><ChatBox batchId={batch.id} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}