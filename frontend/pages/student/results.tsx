import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { studentsApi, resultsApi, parseApiError, ApiError } from "@/lib/api";
import { StudentTermSummary, PublishedTermItem } from "@/types";
import {
  FileText,
  Printer,
  Calendar,
  Award,
  BookOpen,
  Info,
  Clock,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export default function StudentResultsPage() {
  const [publishedTerms, setPublishedTerms] = useState<PublishedTermItem[]>([]);
  const [term, setTerm] = useState("2026-Term1");
  const [resultsData, setResultsData] = useState<StudentTermSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unpublishedMessage, setUnpublishedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load published terms dropdown list on mount
  useEffect(() => {
    async function loadTerms() {
      try {
        const terms = await resultsApi.getPublishedTerms();
        if (terms && terms.length > 0) {
          setPublishedTerms(terms);
          setTerm(terms[0].term);
        } else {
          setPublishedTerms([{ term: "2026-Term1", published_at: new Date().toISOString() }]);
        }
      } catch {
        setPublishedTerms([{ term: "2026-Term1", published_at: new Date().toISOString() }]);
      }
    }
    loadTerms();
  }, []);

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
    if (term) {
      fetchResults(term);
    }
  }, [term]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout title="My Official Result Sheet | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          {/* Print-Only School Crest & Header */}
          <div className="hidden print:block pb-6 mb-6 border-b-2 border-slate-900 text-center">
            <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
              St. Peter&apos;s College
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mt-0.5">
              Continuous Assessment &amp; Terminal Examination Report Card
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Academic Session 2025/2026 • Verified Institutional Transcript
            </p>
          </div>

          {/* Screen Header & Term Selector (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-brand-600" />
                <span>My Academic Results</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Your authenticated terminal grades, continuous assessments, and instructor remarks.
              </p>
            </div>

            {/* Term Dropdown Selector & Print Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {publishedTerms.map((t) => (
                    <option key={t.term} value={t.term}>
                      {t.term}
                    </option>
                  ))}
                  {/* Option to test unpublished term */}
                  <option value="2026-Term2">2026-Term2 (Unpublished Demo)</option>
                  <option value="2026-Term3">2026-Term3 (Unpublished Demo)</option>
                </select>
              </div>

              <button
                onClick={handlePrint}
                disabled={!resultsData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                <span>Print Result</span>
              </button>
            </div>
          </div>

          {/* Calm, Friendly Banner on 403 Unpublished Term (Mandatory Requirement) */}
          {unpublishedMessage && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 text-amber-900 flex items-start gap-3.5 shadow-xs">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-amber-900">Term Results Pending Publication</h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {unpublishedMessage}
                </p>
                <p className="text-[11px] text-amber-700/80 mt-2">
                  Teachers are currently finalizing continuous assessment marks. Please check back once the Exams Office officially publishes results for this term.
                </p>
              </div>
            </div>
          )}

          {error && <AlertBanner type="error" message={error} />}

          {/* Result Content */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <TableSkeleton rows={5} />
            </div>
          ) : resultsData ? (
            <div className="space-y-6">
              {/* Student Metadata Card (Shown on screen and formatted on print) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:border-none print:p-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-lg border border-brand-100 no-print">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider block">
                      Student Transcript
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{resultsData.full_name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>Admission No: <strong className="font-mono text-slate-800">{resultsData.admission_no}</strong></span>
                      <span>•</span>
                      <span>Class: <strong className="text-slate-800">{resultsData.class_level}</strong></span>
                      <span>•</span>
                      <span>Term: <strong className="text-slate-800">{resultsData.term.toUpperCase()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Average / GPA Score Badge */}
                <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-100 text-center sm:text-right shrink-0">
                  <span className="text-xs text-brand-700 font-semibold block uppercase tracking-wider">
                    Cumulative Average
                  </span>
                  <span className="text-3xl font-extrabold text-brand-800 block mt-0.5">
                    {resultsData.average_score}%
                  </span>
                  <span className="text-[11px] text-brand-600 font-medium">
                    {resultsData.results.length} Subjects Evaluated
                  </span>
                </div>
              </div>

              {/* Subject Results Table with Teacher Names (Mandatory Requirement) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border print:border-slate-300">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Subject Breakdown &amp; Teacher Assessments</h3>
                  <span className="text-xs text-slate-400 font-mono">Passing Grade: 40%</span>
                </div>

                {resultsData.results.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No scores recorded for this student in {resultsData.term}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5">Subject</th>
                          <th className="px-4 py-3.5">Code</th>
                          <th className="px-6 py-3.5">Instructor / Teacher</th>
                          <th className="px-4 py-3.5 text-center">Score</th>
                          <th className="px-4 py-3.5 text-center">Grade</th>
                          <th className="px-6 py-3.5 text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultsData.results.map((item) => (
                          <tr key={item.subject_id} className="hover:bg-slate-50/60 transition">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {item.subject_name}
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-slate-600">
                              {item.subject_code}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-700">
                              {/* Teacher Names Displayed Directly on Result Sheet */}
                              {item.teacher_name ? (
                                <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                                  <span>{item.teacher_name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Department Faculty</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-slate-900">
                              {item.score}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold ${
                                  item.grade === "A"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.grade === "B"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.grade === "C"
                                    ? "bg-sky-100 text-sky-800"
                                    : item.grade === "D"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {item.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-medium">
                              {item.score >= 70 ? (
                                <span className="text-emerald-700">Excellent Distinction</span>
                              ) : item.score >= 60 ? (
                                <span className="text-blue-700">Credit Performance</span>
                              ) : item.score >= 50 ? (
                                <span className="text-slate-700">Satisfactory Pass</span>
                              ) : item.score >= 40 ? (
                                <span className="text-amber-700">Pass</span>
                              ) : (
                                <span className="text-rose-600 font-bold">Unsatisfactory</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Grading Legend & Verification Footer */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold text-slate-700">Grading Key:</span>
                  <span>A: 70–100% (Distinction)</span>
                  <span>B: 60–69% (Very Good)</span>
                  <span>C: 50–59% (Credit)</span>
                  <span>D: 40–49% (Pass)</span>
                  <span>F: 0–39% (Fail)</span>
                </div>
                <div className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                  Report Generated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}