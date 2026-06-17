"use client";

import { Code2, Chrome } from "lucide-react";

export default function LoginPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Code2 className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CodeMaster</h1>
        <p className="text-gray-600 mb-8">Sign in to access your coding curriculum</p>
        <a
          href={`${API_URL}/api/auth/google`}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </a>
        <p className="text-xs text-gray-500 mt-6">By signing in, you agree to our terms.</p>
      </div>
    </div>
  );
}
