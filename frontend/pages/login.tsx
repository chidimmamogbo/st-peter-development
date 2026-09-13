import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { parseApiError } from "@/lib/api";
import { GraduationCap, Lock, User, KeyRound, AlertCircle, ArrowRight } from "lucide-react";
import { AlertBanner } from "@/components/common/AlertBanner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to respective portal
    if (!isLoading && user) {
      if (user.role === "exams_officer") router.replace("/officer/students");
      else if (user.role === "teacher") router.replace("/teacher/subjects");
      else if (user.role === "student") router.replace("/student/results");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (router.query.message === "session_expired") {
      setErrorMessage("Your session has expired or authentication failed. Please sign in again.");
    }
  }, [router.query.message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Please provide both username and password.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const loggedUser = await login(username.trim(), password);
      // Route based on role
      if (loggedUser.role === "exams_officer") {
        router.push("/officer/students");
      } else if (loggedUser.role === "teacher") {
        router.push("/teacher/subjects");
      } else {
        router.push("/student/results");
      }
    } catch (err) {
      setErrorMessage(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (u: string, p: string = "Secret123!") => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <Head>
        <title>Sign In — St. Peter&apos;s Result Portal</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-600/30">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          St. Peter&apos;s College
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-slate-500">
          Academic Continuous Assessment &amp; Examination Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200">
          {errorMessage && (
            <div className="mb-6">
              <AlertBanner
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Username
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. officer1, teacher_math, student_ada"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400 text-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400 text-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 transition"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Demo Accounts (Password: <span className="font-mono text-slate-700">Secret123!</span>)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoCredentials("officer1")}
                className="p-2 text-left rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-medium transition"
              >
                <div className="font-semibold">Exams Officer</div>
                <div className="text-[11px] text-purple-700 font-mono">officer1</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("teacher_math")}
                className="p-2 text-left rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium transition"
              >
                <div className="font-semibold">Teacher (Math)</div>
                <div className="text-[11px] text-emerald-700 font-mono">teacher_math</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("teacher_eng")}
                className="p-2 text-left rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium transition"
              >
                <div className="font-semibold">Teacher (English)</div>
                <div className="text-[11px] text-emerald-700 font-mono">teacher_eng</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("student_ada")}
                className="p-2 text-left rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-medium transition"
              >
                <div className="font-semibold">Student (Ada)</div>
                <div className="text-[11px] text-sky-700 font-mono">student_ada</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
