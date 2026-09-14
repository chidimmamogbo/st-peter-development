import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { subjectsApi, usersApi, studentsApi, parseApiError } from "@/lib/api";
import { Subject, Enrollment, StaffUser, StudentProfile } from "@/types";
import {
  BookOpen,
  Plus,
  UserCheck,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function OfficerSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Teachers & Students for assignment pickers
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  // Modals & Expand states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [creating, setCreating] = useState(false);

  // Assign Teacher Modal
  const [assignModalSubject, setAssignModalSubject] = useState<Subject | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [assigningTeacher, setAssigningTeacher] = useState(false);

  // Expanded Enrolled Students Drawer/Section
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);
  const [enrolledStudentsMap, setEnrolledStudentsMap] = useState<Record<number, Enrollment[]>>({});
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Enroll Student Modal
  const [enrollModalSubject, setEnrollModalSubject] = useState<Subject | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
  const [enrollingStudent, setEnrollingStudent] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.listSubjects();
      setSubjects(data);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();

    // Fetch teachers & students for pickers
    usersApi.listUsers({ role: "teacher" }).then(setTeachers).catch(() => {});
    studentsApi.listStudents().then(setAllStudents).catch(() => {});
  }, []);

  // Handle Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;

    try {
      setCreating(true);
      setErrorMsg(null);
      await subjectsApi.createSubject({
        name: newSubjectName.trim(),
        code: newSubjectCode.trim().toUpperCase(),
      });
      setSuccessMsg(`Subject '${newSubjectName}' created successfully.`);
      setShowCreateModal(false);
      setNewSubjectName("");
      setNewSubjectCode("");
      await fetchSubjects();
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setCreating(false);
    }
  };

  // Handle Assign Teacher
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalSubject || !selectedTeacherId) return;

    try {
      setAssigningTeacher(true);
      setErrorMsg(null);
      await subjectsApi.assignTeacher(assignModalSubject.id, Number(selectedTeacherId));
      setSuccessMsg(`Teacher assigned to ${assignModalSubject.name} successfully.`);
      setAssignModalSubject(null);
      setSelectedTeacherId("");
      await fetchSubjects();
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setAssigningTeacher(false);
    }
  };

  // Handle Toggle Enrolled Students
  const handleToggleEnrollments = async (subjectId: number) => {
    if (expandedSubjectId === subjectId) {
      setExpandedSubjectId(null);
      return;
    }

    setExpandedSubjectId(subjectId);
    if (!enrolledStudentsMap[subjectId]) {
      try {
        setLoadingEnrollments(true);
        const data = await subjectsApi.getSubjectStudents(subjectId);
        setEnrolledStudentsMap((prev) => ({ ...prev, [subjectId]: data }));
      } catch (err) {
        setErrorMsg(parseApiError(err));
      } finally {
        setLoadingEnrollments(false);
      }
    }
  };

  // Handle Enroll Student
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalSubject || !selectedStudentId) return;

    try {
      setEnrollingStudent(true);
      setErrorMsg(null);
      await subjectsApi.enrollStudent(enrollModalSubject.id, Number(selectedStudentId));
      setSuccessMsg(`Student enrolled into ${enrollModalSubject.name} successfully.`);
      setEnrollModalSubject(null);
      setSelectedStudentId("");

      // Refresh enrollments for this subject
      const data = await subjectsApi.getSubjectStudents(enrollModalSubject.id);
      setEnrolledStudentsMap((prev) => ({ ...prev, [enrollModalSubject.id]: data }));
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setEnrollingStudent(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Subjects Management | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Create Subject Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-brand-600" />
                <span>Curriculum Subjects</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Maintain academic subjects, assign instructors, and manage class enrollments.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subject</span>
            </button>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No subjects created yet. Click &quot;Create Subject&quot; to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjects.map((subj) => {
                  const isExpanded = expandedSubjectId === subj.id;
                  const enrollments = enrolledStudentsMap[subj.id] || [];

                  return (
                    <div key={subj.id} className="p-4 sm:p-5 transition hover:bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-100">
                            {subj.code.substring(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{subj.name}</h3>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                {subj.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>Instructor:</span>
                              {subj.teacher_name ? (
                                <span className="font-semibold text-slate-800">{subj.teacher_name}</span>
                              ) : (
                                <span className="text-amber-600 italic">Unassigned</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setAssignModalSubject(subj);
                              setSelectedTeacherId(subj.teacher_id || "");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                            <span>{subj.teacher_id ? "Change Teacher" : "Assign Teacher"}</span>
                          </button>

                          <button
                            onClick={() => handleToggleEnrollments(subj.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-600" />
                            <span>Enrolled</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Enrolled Students Drawer */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 pl-2 sm:pl-12 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Enrolled Students ({enrollments.length})
                            </span>
                            <button
                              onClick={() => {
                                setEnrollModalSubject(subj);
                                setSelectedStudentId("");
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Enroll Student</span>
                            </button>
                          </div>

                          {loadingEnrollments && !enrolledStudentsMap[subj.id] ? (
                            <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                          ) : enrollments.length === 0 ? (
                            <p className="text-xs text-slate-400 py-2">No students currently enrolled in this subject.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {enrollments.map((enr) => (
                                <div
                                  key={enr.id}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-900 block">{enr.student_name}</span>
                                    <span className="font-mono text-[10px] text-slate-500">{enr.admission_no}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    Enrolled
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal: Create Subject */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-600" />
                    <span>Create Subject</span>
                  </h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject Name *</label>
                    <input
                      type="text"
                      required
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Further Mathematics"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      placeholder="e.g. FMTH101"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Save Subject"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Assign Teacher */}
          {assignModalSubject && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Assign Instructor</h3>
                  <button onClick={() => setAssignModalSubject(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  Select a registered teacher for <span className="font-bold text-slate-800">{assignModalSubject.name} ({assignModalSubject.code})</span>:
                </div>

                <form onSubmit={handleAssignTeacher} className="space-y-4">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Instructor --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} (@{t.username})
                      </option>
                    ))}
                  </select>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignModalSubject(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigningTeacher || !selectedTeacherId}
                      className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                    >
                      {assigningTeacher ? "Assigning..." : "Confirm Assignment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Enroll Student */}
          {enrollModalSubject && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Enroll Student</h3>
                  <button onClick={() => setEnrollModalSubject(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  Register a student into <span className="font-bold text-slate-800">{enrollModalSubject.name}</span>:
                </div>

                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_no} • {s.class_level})
                      </option>
                    ))}
                  </select>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEnrollModalSubject(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enrollingStudent || !selectedStudentId}
                      className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                    >
                      {enrollingStudent ? "Enrolling..." : "Enroll Student"}
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