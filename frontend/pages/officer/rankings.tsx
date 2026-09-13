import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { resultsApi, parseApiError } from "@/lib/api";
import { ClassRankingResponse } from "@/types";
import { Trophy, Medal, Filter, RefreshCw } from "lucide-react";

export default function OfficerRankingsPage() {
  const [term, setTerm] = useState("2026-term1");
  const [classLevel, setClassLevel] = useState("");
  const [rankingsData, setRankingsData] = useState<ClassRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resultsApi.getClassRankings({
        term: term.trim(),
        class_level: classLevel || undefined,
      });
      setRankingsData(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [classLevel]);

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
    <ProtectedRoute allowedRoles={["exams_officer"]}>
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
                Official student cohort standings calculated by cumulative GPA average.
              </p>
            </div>
            <button
              onClick={fetchRankings}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
              <span>Update Rankings</span>
            </button>
          </div>

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Academic Term
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="2026-term1"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={fetchRankings}
                  className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Go
                </button>
              </div>
            </div>

            <div className="w-full sm:w-56">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-brand-600" />
                <span>Class Filter</span>
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Cohorts (Overall)</option>
                <option value="JSS1">JSS1</option>
                <option value="JSS2">JSS2</option>
                <option value="JSS3">JSS3</option>
                <option value="SS1">SS1</option>
                <option value="SS2">SS2</option>
                <option value="SS3">SS3</option>
              </select>
            </div>
          </div>

          {/* Leaderboard Table */}
          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : !rankingsData || rankingsData.rankings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No rankings available</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No published score records found for term &quot;{term}&quot; {classLevel && `in class ${classLevel}`}.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-medium text-slate-600">
                <span>
                  Term: <strong className="font-mono text-slate-900">{rankingsData.term}</strong> • Total Ranked:{" "}
                  <strong className="text-slate-900">{rankingsData.total_students}</strong>
                </span>
                {classLevel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold">
                    Class Cohort: {classLevel}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-center">Position</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Admission No</th>
                      <th className="px-6 py-3.5">Class</th>
                      <th className="px-6 py-3.5 text-center">Subjects</th>
                      <th className="px-6 py-3.5 text-center">Average (GPA)</th>
                      <th className="px-6 py-3.5 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingsData.rankings.map((row) => (
                      <tr
                        key={row.student_id}
                        className={`hover:bg-slate-50 transition ${
                          row.rank === 1 ? "bg-amber-50/40" : row.rank === 2 ? "bg-slate-50/60" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getRankBadge(row.rank)}
                        </td>
                        <td className="px-6 py-4 font-bold text-navy-900 whitespace-nowrap">
                          {row.student_name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600 whitespace-nowrap">
                          {row.admission_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {row.class_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-medium text-slate-600 whitespace-nowrap">
                          {row.subjects_count} subjects
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="font-extrabold text-base text-brand-700">
                            {row.average_score}%
                          </span>
                          <span className="text-[11px] text-slate-400 block -mt-0.5">
                            ({row.total_score} pts total)
                          </span>
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
                    ))}
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
