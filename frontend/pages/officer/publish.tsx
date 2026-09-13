import React, { useState } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { resultsApi, parseApiError, ApiError } from "@/lib/api";
import { PublicationResponse, StudentBelowThreshold } from "@/types";
import { Send, CheckCircle2, AlertTriangle, UserX, Search, Clock, ShieldAlert } from "lucide-react";

export default function OfficerPublishPage() {
  const [term, setTerm] = useState("2026-term1");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublicationResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Ad-hoc Below-Threshold Query State
  const [queryTerm, setQueryTerm] = useState("2026-term1");
  const [threshold, setThreshold] = useState(40);
  const [isQuerying, setIsQuerying] = useState(false);
  const [belowThresholdList, setBelowThresholdList] = useState<StudentBelowThreshold[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;

    setIsPublishing(true);
    setErrorMessage(null);
    setConflictMessage(null);
    setSuccessMessage(null);
    setPublishResult(null);

    try {
      const res = await resultsApi.publishTerm(term.trim());
      setPublishResult(res);
      setSuccessMessage(
        `Results for term "${res.term}" were officially published! Background notifications have been queued for students.`
      );
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictMessage(
          `Results for term "${term.trim()}" have already been officially published. Re-publishing an immutable term is not allowed.`
        );
      } else {
        setErrorMessage(parseApiError(err));
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleFetchBelowExisting = async (termToFetch: string) => {
    setIsQuerying(true);
    setQueryError(null);
    try {
      const data = await resultsApi.getStudentsBelowThreshold({
        term: termToFetch,
        threshold: 40,
      });
      setBelowThresholdList(data);
    } catch (err) {
      setQueryError(parseApiError(err));
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Publish Results — St. Peter's Portal">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
              <Send className="w-8 h-8 text-brand-600" />
              <span>Publish Term Results</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Officially sign off and publish academic results for a term. This unfreezes student viewing access and triggers asynchronous background notifications.
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <AlertBanner
              type="error"
              title="Publication Failed"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          )}

          {conflictMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">Term Already Published (409 Conflict)</h4>
                  <p className="text-sm text-amber-800 mt-0.5">{conflictMessage}</p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleFetchBelowExisting(term.trim())}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Inspect Failing Students for {term.trim()}
                </button>
              </div>
            </div>
          )}

          {successMessage && (
            <AlertBanner
              type="success"
              title="Term Published Successfully (HTTP 200 OK)"
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          )}

          {/* Publication Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <form onSubmit={handlePublish} className="max-w-xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Academic Term to Publish
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter the exact term identifier (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-700">2026-term1</code>). Normalization is case-insensitive.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. 2026-term1"
                    className="flex-1 text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono transition"
                  />
                  <button
                    type="submit"
                    disabled={isPublishing || !term.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Term</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* CRITICAL REQUIREMENT: Immediate Failing Students Display on the same screen */}
          {publishResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              <div className="px-6 py-5 bg-rose-50/70 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-rose-950">
                      Surfaced Failing Students (Score &lt; 40)
                    </h2>
                    <p className="text-xs text-rose-700">
                      Returned directly in the publish response for term &quot;{publishResult.term}&quot;
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-200 text-rose-900">
                  {publishResult.failing_students.length} {publishResult.failing_students.length === 1 ? "failing record" : "failing records"}
                </span>
              </div>

              {publishResult.failing_students.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Excellent! Zero failing students found.</p>
                  <p className="text-xs text-slate-500 mt-0.5">All enrolled students scored 40 or above for this term.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Student Name</th>
                        <th className="px-6 py-3.5">Admission No</th>
                        <th className="px-6 py-3.5">Subject</th>
                        <th className="px-6 py-3.5 text-center">Score</th>
                        <th className="px-6 py-3.5 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {publishResult.failing_students.map((st, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/40 transition">
                          <td className="px-6 py-4 font-semibold text-navy-900 whitespace-nowrap">
                            {st.student_name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600 whitespace-nowrap">
                            {st.admission_no}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                            {st.subject_name}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-rose-600 whitespace-nowrap">
                            {st.score} / 100
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              {st.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Ad-Hoc Diagnostic Audit Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-600" />
                <span>Ad-Hoc Diagnostic Failure Audit (GET /results/below)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Query students performing below threshold for any term at any time, independent of publishing.
              </p>
            </div>

            {queryError && <AlertBanner type="error" message={queryError} onClose={() => setQueryError(null)} />}

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Term</label>
                <input
                  type="text"
                  value={queryTerm}
                  onChange={(e) => setQueryTerm(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono"
                  placeholder="2026-term1"
                />
              </div>
              <div className="w-full sm:w-36">
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Threshold</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                />
              </div>
              <button
                onClick={() => handleFetchBelowExisting(queryTerm)}
                disabled={isQuerying || !queryTerm.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isQuerying ? "Auditing..." : "Run Audit Query"}
              </button>
            </div>

            {belowThresholdList && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600 flex justify-between items-center">
                  <span>Found {belowThresholdList.length} scores below {threshold} in {queryTerm}</span>
                </div>
                {belowThresholdList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No scores found below threshold {threshold} for term {queryTerm}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3">Student Name</th>
                          <th className="px-6 py-3">Admission No</th>
                          <th className="px-6 py-3">Subject</th>
                          <th className="px-6 py-3 text-center">Score</th>
                          <th className="px-6 py-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {belowThresholdList.map((st, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-3.5 font-semibold text-navy-900">{st.student_name}</td>
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{st.admission_no}</td>
                            <td className="px-6 py-3.5 text-slate-800">{st.subject_name}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-rose-600">{st.score}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                {st.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
