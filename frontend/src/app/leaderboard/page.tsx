"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Trophy, Medal, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/leaderboard").then((data) => { setEntries(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-warning mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-2">Top performers across all batches</p>
      </div>
      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No submissions graded yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                entry.rank === 1 ? "bg-yellow-50 border-yellow-200" :
                entry.rank === 2 ? "bg-gray-50 border-gray-200" :
                entry.rank === 3 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
              }`}
            >
              <div className="w-10 text-center">
                {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500 mx-auto" /> :
                 entry.rank === 2 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> :
                 entry.rank === 3 ? <Medal className="w-6 h-6 text-orange-400 mx-auto" /> :
                 <span className="text-lg font-bold text-gray-400">{entry.rank}</span>}
              </div>
              {entry.image ? (
                <img src={entry.image} alt={entry.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                  {entry.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{entry.name}</p>
                <p className="text-xs text-gray-500">{entry.batchName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{entry.totalMarks}</p>
                <p className="text-xs text-gray-500">{entry.completedDays} days</p>
              </div>
              <div className="hidden sm:block text-right w-20">
                <p className="text-sm font-medium text-gray-700">{entry.averageMarks}%</p>
                <p className="text-xs text-gray-500">avg</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
