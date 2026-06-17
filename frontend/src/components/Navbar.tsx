"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Trophy, Users } from "lucide-react";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN";

  if (pathname === "/login" || pathname === "/auth/callback") return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">ALYUSR</span>
          </Link>

          {loading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className={`flex items-center gap-2 text-sm font-medium ${pathname === "/dashboard" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/leaderboard" className={`flex items-center gap-2 text-sm font-medium ${pathname === "/leaderboard" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"}`}>
                <Trophy className="w-4 h-4" /> Leaderboard
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin" className={`flex items-center gap-2 text-sm font-medium ${pathname === "/dashboard/admin" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"}`}>
                  <Users className="w-4 h-4" /> Admin
                </Link>
              )}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {user.image && <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors" title="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}