import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { subjectsApi, scoresApi, parseApiError, ApiError } from "@/lib/api";
import { Enrollment, Score, Subject } from "@/types";
import { Edit3, CheckCircle2, AlertCircle, RefreshCw, X, Pencil } from "lucide-react";

export default function TeacherScoresPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
  const [term, setTerm] = useState("2026-term1");
  const [scoreVal, setScoreVal] = useState<number | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Scores list & correction state
  const [scoresList, setScoresList] = useState<Score[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Helper for letter grade
  const computeClientGrade = (s: number | "") => {
    if (s === "" || isNaN(Number(s))) return "";
    const n = Number(s);
    if (n >= 70) return "A (Distinction)";
    if (n >= 60) return "B (Very Good)";
    if (n >= 50) return "C (Credit)";
    if (n >= 40) return "D (Pass)";
    return "F (Fail)";
  };

  // Load teacher assigned subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await subjectsApi.listSubjects(true);
        setSubjects(data);
        if (data.length > 0) {
          const defaultSub = router.query.subject_id
            ? Number(router.query.subject_id)
            : data[0].id;
          setSelectedSubjectId(defaultSub);
        }
      } catch (err) {
        console.error("Failed to load teacher subjects:", err);
      }
    };
    loadSubjects();
  }, [router.query.subject_id]);

  // When subject changes, fetch enrolled students
  useEffect(() => {
    if (!selectedSubjectId) {
      setEnrolledStudents([]);
      return;
    }

    const loadStudents = async () => {
      try {
        const list = await subjectsApi.getSubjectStudents(Number(selectedSubjectId));
        setEnrolledStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].student_id);
        } else {
          setSelectedStudentId("");
        }
      } catch (err) {
        console.error("Failed to load enrolled students:", err);
      }
    };

    loadStudents();
  }, [selectedSubjectId]);

  // Fetch recorded scores for this term
  const fetchScores = async () => {
    setIsLoadingScores(true);
    try {
      const list = await scoresApi.listScores({
        term: term.trim(),
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
      });
      setScoresList(list);
    } catch (err) {
      console.error("Failed to fetch scores:", err);
    } finally {
      setIsLoadingScores(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [selectedSubjectId, term]);

  // Handle Score Submission
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedStudentId || scoreVal === "") {
      setEntryError("Please select a subject, student, and enter a valid score.");
      return;
    }

    const numericScore = Number(scoreVal);
    if (numericScore < 0 || numericScore > 100) {
      setEntryError("Score must be between 0 and 100.");
      return;
    }

    setIsSubmitting(true);
    setEntryError(null);
    setEntrySuccess(null);

    try {
      const created = await scoresApi.createScore({
        subject_id: Number(selectedSubjectId),
        student_id: Number(selectedStudentId),
        term: term.trim(),
        score: numericScore,
      });

      setEntrySuccess(
        `Successfully recorded score of ${created.score} (Grade: ${created.grade}) for student #${created.student_id} in ${created.subject_name}!`
      );
      setScoreVal("");
      fetchScores();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setEntryError(
            "Access Forbidden (403): You can only enter scores for subjects assigned to you in your department."
          );
        } else if (err.status === 409) {
          setEntryError(
            "Duplicate Score Conflict (409): A score has already been recorded for this student in this subject for this term. Please use the correction table below to modify it."
          );
        } else if (err.status === 422) {
          setEntryError(
            "Validation Error (422): Invalid score format or value out of bounds. Score must be an integer between 0 and 100."
          );
        } else {
          setEntryError(parseApiError(err));
        }
      } else {
        setEntryError(parseApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Score Correction (PATCH)
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScore) return;

    if (editScoreValue < 0 || editScoreValue > 100) {
      setEditError("Score must be between 0 and 100.");
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const updated = await scoresApi.correctScore(editingScore.id, editScoreValue);
      setEditingScore(null);
      fetchScores();
    } catch (err: any) {
      setEditError(parseApiError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AppLayout title="Score Entry & Corrections — St. Peter's Portal">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
              <Edit3 className="w-8 h-8 text-emerald-600" />
              <span>Score Entry &amp; Mark Corrections</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Record continuous assessment marks for students in your assigned subjects and apply official mark corrections.
            </p>
          </div>

          {entrySuccess && (
            <AlertBanner
              type="success"
              title="Score Recorded Successfully"
              message={entrySuccess}
              onClose={() => setEntrySuccess(null)}
            />
          )}

          {entryError && (
            <AlertBanner
              type="error"
              title="Score Entry Error"
              message={entryError}
              onClose={() => setEntryError(null)}
            />
          )}

          {/* Score Entry Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-navy-900 mb-5 pb-3 border-b border-slate-100">
              New Continuous Assessment Mark
            </h2>

            <form onSubmit={handleScoreSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Subject Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Subject (My Assigned Classes)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Enrolled Student
                </label>
                {enrolledStudents.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No students currently enrolled in this subject.
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {enrolledStudents.map((enr) => (
                      <option key={enr.student_id} value={enr.student_id}>
                        {enr.student_name} ({enr.admission_no})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Term Input */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Academic Term
                </label>
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="2026-term1"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 font-mono bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Score Input (0-100 validation) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-slate-700">
                    Score (0 - 100)
                  </label>
                  {scoreVal !== "" && (
                    <span className="text-xs font-bold text-emerald-700">
                      {computeClientGrade(scoreVal)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={scoreVal}
                  onChange={(e) => setScoreVal(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 85"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || enrolledStudents.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Mark...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Record Student Score</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Scores & Correction Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-navy-900">Recorded Scores &amp; Corrections</h2>
                <p className="text-xs text-slate-500">
                  Manage previously entered marks. Click &quot;Correct&quot; to modify an existing score via PATCH.
                </p>
              </div>
              <button
                onClick={fetchScores}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScores ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </button>
            </div>

            {isLoadingScores ? (
              <TableSkeleton rows={4} columns={6} />
            ) : scoresList.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No scores recorded for this subject/term combination yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Score ID</th>
                      <th className="px-6 py-3.5">Student ID</th>
                      <th className="px-6 py-3.5">Subject</th>
                      <th className="px-6 py-3.5">Term</th>
                      <th className="px-6 py-3.5 text-center">Current Score</th>
                      <th className="px-6 py-3.5 text-center">Grade</th>
                      <th className="px-6 py-3.5 text-right">Correction Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scoresList.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          #{sc.id}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
                          Student #{sc.student_id}
                        </td>
                        <td className="px-6 py-4 font-medium text-navy-900 whitespace-nowrap">
                          {sc.subject_name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-brand-700 whitespace-nowrap">
                          {sc.term}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-base text-slate-900 whitespace-nowrap">
                          {sc.score}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              sc.grade === "A"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : sc.grade === "B"
                                ? "bg-sky-100 text-sky-800 border-sky-200"
                                : sc.grade === "C"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-rose-100 text-rose-800 border-rose-200"
                            }`}
                          >
                            {sc.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingScore(sc);
                              setEditScoreValue(sc.score);
                              setEditError(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200"
                          >
                            <Pencil className="w-3 h-3 text-slate-600" />
                            <span>Correct Score</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Score Correction Modal */}
          {editingScore && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative">
                <button
                  onClick={() => setEditingScore(null)}
                  className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-navy-900">Correct Student Score</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Updating record #{editingScore.id} for Student #{editingScore.student_id} in {editingScore.subject_name}.
                </p>

                {editError && (
                  <div className="mb-4">
                    <AlertBanner type="error" message={editError} onClose={() => setEditError(null)} />
                  </div>
                )}

                <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold uppercase text-slate-700">
                        New Corrected Score (0-100)
                      </label>
                      <span className="text-xs font-bold text-emerald-700">
                        {computeClientGrade(editScoreValue)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={editScoreValue}
                      onChange={(e) => setEditScoreValue(Number(e.target.value))}
                      className="w-full text-lg font-bold rounded-lg border border-slate-300 px-3 py-2 text-navy-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingScore(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {isUpdating ? "Saving..." : "Save Correction"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
