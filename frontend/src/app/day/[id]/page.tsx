"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { SlideViewer } from "@/components/SlideViewer";
import { SubmissionForm } from "@/components/SubmissionForm";
import { ArrowLeft, Lock, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function DayPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [day, setDay] = useState<any>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/days/${id}`)
      .then(setDay)
      .catch((err) => setError(err.message));
  }, [user, id]);

  // Live countdown timer
  useEffect(() => {
    if (!day?.deadline || day.isExpired) return;

    const update = () => {
      const diff = new Date(day.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        setDay((prev: any) => ({ ...prev, isExpired: true }));
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [day?.deadline, day?.isExpired]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) { router.push("/login"); return null; }
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!day) return <div className="p-8 text-center">Loading day...</div>;

  const submission = day.submissions?.[0];
  const isAdmin = user.role === "ADMIN";
  const isExpired = day.isExpired && !isAdmin;
  const isLocked = day.isLocked && !isAdmin;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-sm text-gray-500">Week {day.week.weekNumber} &middot; Day {day.dayNumber}</span>

          {/* Submission status */}
          {submission ? (
            submission.status === "REVIEWED" ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Reviewed {submission.marks !== null && `• ${submission.marks}/100`}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" /> Pending Review
              </span>
            )
          ) : isLocked ? (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Locked
            </span>
          ) : null}

          {/* Expired badge */}
          {isExpired && (
            <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full font-semibold">
              <AlertTriangle className="w-3 h-3" /> Deadline Passed
            </span>
          )}

          {/* Live countdown (only if not expired and deadline exists) */}
          {!isExpired && timeLeft && !isAdmin && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
              timeLeft.startsWith("0m") || (!timeLeft.includes("h") && parseInt(timeLeft) < 10)
                ? "text-red-700 bg-red-100"
                : "text-yellow-700 bg-yellow-100"
            }`}>
              <Clock className="w-3 h-3" /> {timeLeft} left
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{day.title}</h1>

        {/* Deadline line under title */}
        {day.deadline && (
          <p className="text-sm text-gray-500 mt-1">
            Deadline: {new Date(day.deadline).toLocaleString()}
          </p>
        )}
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Submission deadline has passed</p>
            <p className="text-sm text-red-600">This assignment closed on {new Date(day.deadline).toLocaleString()}. You can still view the slides but can no longer submit.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SlideViewer slides={day.slides || []} />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <SubmissionForm
              dayId={day.id}
              existingSubmission={submission || null}
              isLocked={isLocked}
              isExpired={isExpired}
              isAdmin={isAdmin}
            />
            {submission?.feedback && (
              <div className="card mt-4 border-l-4 border-l-secondary-500">
                <h3 className="font-semibold text-gray-900 mb-2">Instructor Feedback</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}