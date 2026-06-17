"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { BookOpen, Trophy, Code2, MessageCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">Master Coding with ALYUSR</h1>
            <p className="text-xl text-primary-100 mb-8">
              Join live batches, follow structured curriculum, submit StackBlitz projects,
              chat with your instructor, and compete on the leaderboard.
            </p>
            {user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Structured Curriculum</h3>
              <p className="text-gray-600 text-sm">Week-by-week learning with interactive slides.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code2 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">StackBlitz Projects</h3>
              <p className="text-gray-600 text-sm">Code in browser and submit project links.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
              <p className="text-gray-600 text-sm">Compete with classmates for top rankings.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm">Real-time chat with instructor and batchmates.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}