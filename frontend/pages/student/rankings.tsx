import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { resultsApi, parseApiError, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ClassRankingResponse } from "@/types";
import { Trophy, Medal, Clock, RefreshCw } from "lucide-react";

export default function StudentRankingsPage() {
  const { user } = useAuth();
  const [term, setTerm] = useState("2026-term1");
  const [rankingsData, setRankingsData] = useState<ClassRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unpublishedMessage, setUnpublishedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async (termToQuery: string) => {
    setIsLoading(true);
    setError(null);
    setUnpublishedMessage(null);
    try {
      const data = await resultsApi.getClassRankings({ term: termToQuery.trim() });
      setRankingsData(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setUnpublishedMessage(
          err.data?.detail || `Class rankings for term "${termToQuery}" have not been officially published yet.`
        );
        setRankingsData(null);
      } else {
        setError(parseApiError(err));
        setRankingsData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(term);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Medal className="w-3.5 h-3.5 text-amber-600" />
          <span>1st</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-500" />
          <span>2nd</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
          <Medal className="w-3.5 h-3.5 text-orange-600" />
          <span>3rd</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        #{rank}
      </span>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout title="Class Rankings — St. Peter's Portal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <span>Class Rankings Leaderboard</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View your academic standing relative to your cohort for the published term.
              </p>
            </div>
            <button
              onClick={() => fetchRankings(term)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Term Selector */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-72">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Academic Term
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="2026-term1"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={() => fetchRankings(term)}
              disabled={isLoading || !term.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Check Rankings
            </button>
          </div>

          {/* Calm, Friendly Banner for Unpublished Standings */}
          {unpublishedMessage && (
            <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-6 sm:p-7 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-sky-950">
                    Rankings Pending Official Publication
                  </h3>
                  <p className="text-sm text-sky-800 leading-relaxed max-w-2xl">
                    {unpublishedMessage}
                  </p>
                  <p className="text-xs text-sky-700 pt-1">
                    Class cohort rankings are calculated automatically upon official publication of results by the Exams Office.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Loading Skeleton */}
          {isLoading && <TableSkeleton rows={5} columns={6} />}

          {/* Rankings Table */}
          {rankingsData && !isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                Term {rankingsData.term} • Total Students Ranked: {rankingsData.total_students}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-center">Rank</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Admission No</th>
                      <th className="px-6 py-3.5">Class</th>
                      <th className="px-6 py-3.5 text-center">Subjects</th>
                      <th className="px-6 py-3.5 text-center">Average (GPA)</th>
                      <th className="px-6 py-3.5 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingsData.rankings.map((row) => {
                      const isMe = user?.full_name === row.student_name;
                      return (
                        <tr
                          key={row.student_id}
                          className={`transition ${
                            isMe
                              ? "bg-brand-50/80 font-semibold border-l-4 border-l-brand-600"
                              : row.rank === 1
                              ? "bg-amber-50/30"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {getRankBadge(row.rank)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-navy-900">{row.student_name}</span>
                            {isMe && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {row.admission_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                            {row.class_level}
                          </td>
                          <td className="px-6 py-4 text-center text-xs text-slate-600 whitespace-nowrap">
                            {row.subjects_count} subjects
                          </td>
                          <td className="px-6 py-4 text-center font-black text-base text-brand-700 whitespace-nowrap">
                            {row.average_score}%
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                row.grade === "A"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : row.grade === "B"
                                  ? "bg-sky-100 text-sky-800 border-sky-200"
                                  : row.grade === "C"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-rose-100 text-rose-800 border-rose-200"
                              }`}
                            >
                              {row.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
