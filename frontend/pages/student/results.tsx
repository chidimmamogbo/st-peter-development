import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { studentsApi, parseApiError, ApiError } from "@/lib/api";
import { StudentTermSummary } from "@/types";
import {
  FileText,
  Printer,
  Calendar,
  Award,
  BookOpen,
  Info,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function StudentResultsPage() {
  const [term, setTerm] = useState("2026-term1");
  const [resultsData, setResultsData] = useState<StudentTermSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unpublishedMessage, setUnpublishedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (termToQuery: string) => {
    setIsLoading(true);
    setError(null);
    setUnpublishedMessage(null);
    try {
      // Calls GET /students/me/results (no client-supplied ID, derives from JWT)
      const data = await studentsApi.getMyResults(termToQuery.trim());
      setResultsData(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        // Requirement: Show unpublished message directly in a calm, friendly banner
        setUnpublishedMessage(
          err.data?.detail || `Results for term "${termToQuery}" have not been officially published yet.`
        );
        setResultsData(null);
      } else {
        setError(parseApiError(err));
        setResultsData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(term);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getOverallGrade = (avg: number) => {
    if (avg >= 70) return { grade: "A", text: "Excellent (Distinction)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (avg >= 60) return { grade: "B", text: "Very Good", color: "text-sky-700 bg-sky-50 border-sky-200" };
    if (avg >= 50) return { grade: "C", text: "Good (Credit)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (avg >= 40) return { grade: "D", text: "Pass", color: "text-orange-700 bg-orange-50 border-orange-200" };
    return { grade: "F", text: "Needs Improvement (Fail)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout title="My Result Sheet — St. Peter's Portal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-brand-600" />
                <span>My Academic Report Card</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Official continuous assessment and examination grades signed off by St. Peter&apos;s College.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrint}
                disabled={!resultsData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Official Sheet</span>
              </button>
            </div>
          </div>

          {/* Term Selector (No Print) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-end no-print">
            <div className="w-full sm:w-72">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Academic Term</span>
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
              onClick={() => fetchResults(term)}
              disabled={isLoading || !term.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Load Term Sheet
            </button>
          </div>

          {/* Calm, Friendly Banner for 403 Unpublished Term (Strict Requirement) */}
          {unpublishedMessage && (
            <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-6 sm:p-7 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-sky-950">
                    Results Pending Official Publication
                  </h3>
                  <p className="text-sm text-sky-800 leading-relaxed max-w-2xl">
                    {unpublishedMessage}
                  </p>
                  <p className="text-xs text-sky-700 pt-1">
                    Grade moderation is currently in progress. As soon as the Exams Office ratifies and officially publishes this term, your detailed subject grades will appear here automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Loading Skeleton */}
          {isLoading && <TableSkeleton rows={4} columns={5} />}

          {/* Published Results View */}
          {resultsData && !isLoading && (
            <div className="space-y-6">
              {/* Official School Header for Print & Display */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="border-b border-slate-200 pb-6 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block">
                      St. Peter&apos;s College, Junior &amp; Senior Academy
                    </span>
                    <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight mt-0.5">
                      Student Academic Transcript
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Official Termly Assessment Record
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ratified &amp; Published</span>
                    </span>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Term: {resultsData.term}
                    </div>
                  </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Full Name
                    </span>
                    <span className="font-bold text-navy-900 text-base">{resultsData.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Admission No
                    </span>
                    <span className="font-mono font-bold text-brand-700 text-sm">
                      {resultsData.admission_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Class Level
                    </span>
                    <span className="font-semibold text-slate-800">{resultsData.class_level}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Academic Term
                    </span>
                    <span className="font-semibold text-slate-800 font-mono">{resultsData.term}</span>
                  </div>
                </div>

                {/* Overall Average / GPA Card */}
                {(() => {
                  const gradeInfo = getOverallGrade(resultsData.average_score);
                  return (
                    <div className="mt-6 p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-slate-400">Cumulative GPA Average</div>
                          <div className="text-2xl sm:text-3xl font-black text-navy-900">
                            {resultsData.average_score}%
                          </div>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${gradeInfo.color}`}>
                          Grade: {gradeInfo.grade} — {gradeInfo.text}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Calculated across {resultsData.results.length} subjects
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Results Table */}
                <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Subject Code</th>
                        <th className="px-6 py-3.5">Subject Title</th>
                        <th className="px-6 py-3.5">Subject Teacher</th>
                        <th className="px-6 py-3.5 text-center">Score</th>
                        <th className="px-6 py-3.5 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resultsData.results.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">
                            No subject score entries found for this term.
                          </td>
                        </tr>
                      ) : (
                        resultsData.results.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700 whitespace-nowrap">
                              {item.subject_code}
                            </td>
                            <td className="px-6 py-4 font-bold text-navy-900 whitespace-nowrap">
                              {item.subject_name}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                              {item.teacher_name || "Assigned Faculty"}
                            </td>
                            <td className="px-6 py-4 text-center font-extrabold text-base text-slate-900 whitespace-nowrap">
                              {item.score} / 100
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  item.grade === "A"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : item.grade === "B"
                                    ? "bg-sky-100 text-sky-800 border-sky-200"
                                    : item.grade === "C"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-rose-100 text-rose-800 border-rose-200"
                                }`}
                              >
                                {item.grade}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Grading Scale Legend */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <strong>Grading Key:</strong> A: 70-100 (Distinction) | B: 60-69 (Very Good) | C: 50-59 (Credit) | D: 40-49 (Pass) | F: 0-39 (Fail)
                  </div>
                  <div>Rev. Fr. Benedict, Exams &amp; Records</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
