"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  batchId: string;
  existingStudents: any[];
  onEnroll: () => void;
}

export function EnrollStudent({ batchId, existingStudents, onEnroll }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const existingIds = new Set(existingStudents.map((s) => s.userId || s.user?.id));

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const data = await apiFetch(`/api/users?search=${encodeURIComponent(search)}`);
    setResults((data || []).filter((u: any) => !existingIds.has(u.id)));
    setLoading(false);
  };

  const handleEnroll = async (userId: string) => {
    setEnrolling(userId);
    try {
      await apiFetch("/api/enrollments", { method: "POST", body: JSON.stringify({ userId, batchId }) });
      onEnroll();
      setResults(results.filter((r) => r.id !== userId));
    } catch {
      alert("Failed to enroll");
    }
    setEnrolling(null);
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Enroll Students</h3>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search by name or email..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 outline-none" />
        </div>
        <button onClick={handleSearch} disabled={loading} className="btn-primary text-sm disabled:opacity-50">{loading ? "..." : "Search"}</button>
      </div>
      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {user.image ? <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{user.name?.charAt(0)}</div>}
                <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
              </div>
              <button onClick={() => handleEnroll(user.id)} disabled={enrolling === user.id} className="flex items-center gap-1 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                <UserPlus className="w-3 h-3" />{enrolling === user.id ? "..." : "Enroll"}
              </button>
            </div>
          ))}
        </div>
      )}
      {search && !loading && results.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No students found. They need to sign in first.</p>}
    </div>
  );
}
