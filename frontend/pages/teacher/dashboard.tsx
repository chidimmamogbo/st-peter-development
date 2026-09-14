import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { subjectsApi, scoresApi } from "@/lib/api";
import { Subject, Score } from "@/types";
import {
  BookOpen,
  Edit3,
  FileCheck,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentScores, setRecentScores] = useState<Score[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const subjects = await subjectsApi.listSubjects(true);
        setMySubjects(subjects);

        // Calculate enrolled students across teacher's subjects
        const students = await subjectsApi.getMineStudents().catch(() => []);
        setTotalStudents(students.length);

        // Fetch recent scores entered
        const scores = await scoresApi.listScores({ term: "2026-Term1" }).catch(() => []);
        setRecentScores(scores.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AppLayout title="Teacher Dashboard | St. Peter's Result Portal">
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-brand-800/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Instructor Portal • 2025/2026 Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user?.full_name}
              </h1>
              <p className="mt-1 text-slate-100 text-sm sm:text-base max-w-xl">
                Record examination scores, review academic progress, and manage your assigned student cohorts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/teacher/scores")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-800 font-semibold text-sm shadow-sm hover:bg-slate-50 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Enter Score</span>
              </button>
              <button
                onClick={() => router.push("/teacher/my-students")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900/60 hover:bg-brand-900 text-white font-semibold text-sm border border-white/20 transition"
              >
                <Users className="w-4 h-4" />
                <span>My Students</span>
              </button>
            </div>
          </div>

          {/* Metric Cards (matching Image 1 layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Assigned Subjects */}
            <div
              onClick={() => router.push("/teacher/subjects")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Subjects
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : mySubjects.length}
                </span>
                <span className="text-xs font-medium text-brand-600">Assigned Curricula</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>View subject enrollments</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Enrolled Students */}
            <div
              onClick={() => router.push("/teacher/my-students")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Enrolled Students
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : totalStudents}
                </span>
                <span className="text-xs font-medium text-emerald-600">Across my classes</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Directory &amp; score entry</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Subject Performance */}
            <div
              onClick={() => router.push("/teacher/statistics")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Class Performance
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  2026-T1
                </span>
                <span className="text-xs font-medium text-indigo-600">Continuous Assessment</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Explore subject averages</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Assigned Subjects Summary & Quick Score Entry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">My Assigned Subjects</h2>
                <button
                  onClick={() => router.push("/teacher/subjects")}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              ) : mySubjects.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No subjects assigned yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {mySubjects.map((subj) => (
                    <div key={subj.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
                          {subj.code.substring(0, 3)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{subj.name}</span>
                          <span className="text-xs font-mono text-slate-400">{subj.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/teacher/scores?subject_id=${subj.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition"
                        >
                          Enter Scores
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900 mb-2">Teacher Shortcuts</h2>

              <button
                onClick={() => router.push("/teacher/scores")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition"
              >
                <Edit3 className="w-5 h-5 text-brand-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Record New Score</span>
                  <span className="text-[10px] text-slate-400">Score door (0-100) validation</span>
                </div>
              </button>

              <button
                onClick={() => router.push("/teacher/scores?mode=correct")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition"
              >
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Correct Existing Score</span>
                  <span className="text-[10px] text-slate-400">Inline PATCH correction</span>
                </div>
              </button>

              <button
                onClick={() => router.push("/teacher/statistics")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition"
              >
                <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Subject Statistics</span>
                  <span className="text-[10px] text-slate-400">Averages &amp; threshold audits</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}