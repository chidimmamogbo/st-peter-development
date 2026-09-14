import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { StatCardSkeleton } from "@/components/common/LoadingSkeleton";
import { subjectsApi, scoresApi, parseApiError } from "@/lib/api";
import { Subject, SubjectStats } from "@/types";
import {
  BarChart3,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
} from "lucide-react";

export default function TeacherStatisticsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [term, setTerm] = useState("2026-Term1");

  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    subjectsApi
      .listSubjects(true)
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].id);
        }
      })
      .catch((err) => setErrorMsg(parseApiError(err)));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId || !term) return;

    async function loadStats() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await scoresApi.getSubjectStats(Number(selectedSubjectId), term);
        setStats(data);
      } catch (err) {
        setErrorMsg(parseApiError(err));
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [selectedSubjectId, term]);

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AppLayout title="Subject Statistics | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-brand-600" />
              <span>Subject Academic Statistics</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Analyze class averages, score ranges, and performance trends across your assigned subjects.
            </p>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          {/* Subject & Term Selector Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="2026-Term1">2026 - Term 1</option>
                <option value="2026-Term2">2026 - Term 2</option>
                <option value="2026-Term3">2026 - Term 3</option>
              </select>
            </div>
          </div>

          {/* Metrics Overview */}
          {loading ? (
            <StatCardSkeleton />
          ) : stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Average Score */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Class Average</span>
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-slate-900">{stats.average}%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Mean cohort score</p>
                </div>

                {/* Highest Score */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Highest Score</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-slate-900">{stats.highest}</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Top student performance</p>
                </div>

                {/* Lowest Score */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Lowest Score</span>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-slate-900">{stats.lowest}</span>
                  </div>
                  <p className="mt-1 text-xs text-rose-500 font-medium">Minimum mark recorded</p>
                </div>

                {/* Total Students Assessed */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Students Assessed</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-slate-900">{stats.total_students}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Total recorded scores</p>
                </div>
              </div>

              {/* Performance Indicator Bar */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {stats.subject_name} • Academic Summary ({stats.term})
                </h3>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, stats.average))}%` }}
                    className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span className="font-semibold text-brand-700">Average: {stats.average}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center text-slate-400 text-sm">
              No recorded scores found for this subject and term.
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}