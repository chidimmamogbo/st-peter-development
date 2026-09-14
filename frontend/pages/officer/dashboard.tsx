import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  studentsApi,
  subjectsApi,
  usersApi,
  resultsApi,
  parseApiError,
} from "@/lib/api";
import {
  Users,
  Briefcase,
  BookOpen,
  Send,
  Trophy,
  Bell,
  ArrowRight,
  UserPlus,
  Layers,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalSubjects: 0,
    publishedTermsCount: 1,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [students, subjects, staff, logs] = await Promise.all([
          studentsApi.listStudents().catch(() => []),
          subjectsApi.listSubjects().catch(() => []),
          usersApi.listUsers().catch(() => []),
          resultsApi.getNotifications("2026-Term1").catch(() => []),
        ]);

        setStats({
          totalStudents: students.length,
          totalStaff: staff.length,
          totalSubjects: subjects.length,
          publishedTermsCount: 1,
        });
        setRecentLogs(logs.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Exams Officer Dashboard | St. Peter's Result Portal">
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-brand-700/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>2025/2026 Academic Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user?.full_name}
              </h1>
              <p className="mt-1 text-slate-100 text-sm sm:text-base max-w-xl">
                Central Examination Control Panel. Monitor cohort enrollments, assign faculty, and publish term assessment records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/officer/register-student")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 font-semibold text-sm shadow-sm hover:bg-slate-50 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Student</span>
              </button>
              <button
                onClick={() => router.push("/officer/publish")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-800/60 hover:bg-brand-800 text-white font-semibold text-sm border border-white/20 transition"
              >
                <Send className="w-4 h-4" />
                <span>Publish Term</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards (Layout Structure matching Image 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Students */}
            <div
              onClick={() => router.push("/officer/students")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Students
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalStudents}
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Active Cohort
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Enrolled across JSS1 - SS3</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Teaching & Admin Staff */}
            <div
              onClick={() => router.push("/officer/staff")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Registered Staff
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalStaff}
                </span>
                <span className="text-xs font-medium text-purple-600">Faculty &amp; Officers</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Manage staff profiles</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Curriculum Subjects */}
            <div
              onClick={() => router.push("/officer/subjects")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Offered Subjects
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalSubjects}
                </span>
                <span className="text-xs font-medium text-amber-600">Assigned Curricula</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>View &amp; assign instructors</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>

            {/* Academic Standings */}
            <div
              onClick={() => router.push("/officer/rankings")}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Term Rankings
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  2026-T1
                </span>
                <span className="text-xs font-medium text-emerald-600">Published</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>View cohort leaderboards</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Quick Actions Grid & Audit Log Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Examination &amp; Academic Workflows
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={() => router.push("/officer/register-student")}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Register Student</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Two-step wizard: create student user and assign admission profile.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/officer/register-staff")}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-left transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Register Staff</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Onboard new teachers or exams officers into the portal.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/officer/subjects")}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Manage Subjects</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create subjects, assign teachers, and enroll students.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/officer/classes")}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Class Allocations</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review secondary school classes and assign class teachers.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Audit Notifications Feed */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Recent Audit Logs</h2>
                  <button
                    onClick={() => router.push("/officer/notifications")}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    View all
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ) : recentLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No recent audit logs recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-100">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                          <span className="font-semibold text-brand-700 uppercase">{log.term}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700 font-medium line-clamp-1">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => router.push("/officer/publish")}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <Send className="w-3.5 h-3.5 text-brand-600" />
                  <span>Publication Control Center</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}