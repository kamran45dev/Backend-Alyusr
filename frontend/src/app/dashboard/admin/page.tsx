"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, Clock, CheckCircle, TrendingUp, ArrowRight, Plus, Trash2, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") { router.push("/dashboard"); return; }
    loadAll();
  }, [user]);

  const loadAll = () => {
    apiFetch("/api/admin/stats").then(setStats).catch(console.error);
    apiFetch("/api/batches").then(setBatches).catch(console.error);
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setDeleting(id);
    try {
      await apiFetch(`/api/batches/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      loadAll(); // refresh both stats AND batch list
    } catch {
      alert("Failed to delete batch");
    }
    setDeleting(null);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage batches, students, and submissions</p>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div><div><p className="text-2xl font-bold">{stats.totalStudents}</p><p className="text-xs text-gray-600">Students</p></div></div></div>
          <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.totalBatches}</p><p className="text-xs text-gray-600">Total Batches</p></div></div></div>
          <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary-600" /></div><div><p className="text-2xl font-bold">{stats.activeBatches}</p><p className="text-xs text-gray-600">Active</p></div></div></div>
          <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.pendingSubmissions}</p><p className="text-xs text-gray-600">Pending</p></div></div></div>
          <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.totalSubmissions}</p><p className="text-xs text-gray-600">Total</p></div></div></div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Batches</h2>
          <Link href="/dashboard/admin/batches/new" className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Batch
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Students</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Weeks</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{batch.name}</p>
                    <p className="text-xs text-gray-500">{batch.description}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">{batch._count?.enrollments || 0}</td>
                  <td className="py-3 px-4 text-sm">{batch.weeks?.length || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {batch.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/admin/batches/${batch.id}`} className="text-secondary-600 hover:text-secondary-700 text-sm font-medium inline-flex items-center gap-1">
                        Manage <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        disabled={deleting === batch.id}
                        className={`text-sm px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                          confirmDelete === batch.id
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {confirmDelete === batch.id ? (
                          <><AlertTriangle className="w-3 h-3" /> {deleting === batch.id ? "Deleting..." : "Confirm"}</>
                        ) : (
                          <><Trash2 className="w-3 h-3" /> Delete</>
                        )}
                      </button>
                      {confirmDelete === batch.id && (
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:text-gray-700">
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}