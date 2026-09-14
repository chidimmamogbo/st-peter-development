import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { studentsApi, resultsApi } from "@/lib/api";
import { StudentTermSummary } from "@/types";
import {
  GraduationCap,
  FileText,
  Trophy,
  Award,
  ArrowRight,
  CheckCircle2,
  Calendar,
  BookOpen,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [termSummary, setTermSummary] = useState<StudentTermSummary | null>(null);
  const [term, setTerm] = useState("2026-Term1");

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        const data = await studentsApi.getMyResults(term);
        setTermSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [term]);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout title="Student Dashboard | St. Peter's Result Portal">
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Hero Card */}
          <div className="bg-gradient-to-r from-sky-700 via-brand-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-sky-700/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Student Academic Portal • 2025/2026 Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome, {user?.full_name}
              </h1>
              <p className="mt-1 text-slate-100 text-sm sm:text-base max-w-xl">
                Access your verified terminal examination transcripts, teacher assessments, and cohort standings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/student/results")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 font-semibold text-sm shadow-sm hover:bg-slate-50 transition"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Results</span>
              </button>
              <button
                onClick={() => router.push("/student/rankings")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-800/60 hover:bg-brand-800 text-white font-semibold text-sm border border-white/20 transition"
              >
                <Trophy className="w-4 h-4" />
                <span>Class Rankings</span>
              </button>
            </div>
          </div>

          {/* Key Metric Highlights (Matching Image 1 layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Term Average / GPA */}
            <div
              onClick={() => router.push("/student/results")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Term Average
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : termSummary ? `${termSummary.average_score}%` : "Pending"}
                </span>
                <span className="text-xs font-medium text-emerald-600">Continuous Assessment</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>View subject breakdown</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Assessed Subjects */}
            <div
              onClick={() => router.push("/student/results")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Subjects Evaluated
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : termSummary ? termSummary.results.length : 0}
                </span>
                <span className="text-xs font-medium text-sky-600">Curricula</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>With teacher notes</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Class Standings */}
            <div
              onClick={() => router.push("/student/rankings")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Class Cohort
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {termSummary ? termSummary.class_level : "SS2"}
                </span>
                <span className="text-xs font-medium text-purple-600">Rankings Active</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Check cohort leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Quick Result Preview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Latest Results Summary ({term})
              </h2>
              <button
                onClick={() => router.push("/student/results")}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Open Full Sheet &amp; Print
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : !termSummary || termSummary.results.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Results for {term} have not yet been published by the Exams Office.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {termSummary.results.slice(0, 4).map((r) => (
                  <div key={r.subject_id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 block">{r.subject_name}</span>
                      <span className="text-xs text-slate-400">Teacher: {r.teacher_name || "Assigned Faculty"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900">{r.score}/100</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          r.grade === "A"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.grade === "B"
                            ? "bg-blue-100 text-blue-800"
                            : r.grade === "C"
                            ? "bg-sky-100 text-sky-800"
                            : r.grade === "D"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        Grade {r.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}