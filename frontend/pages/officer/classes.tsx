import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { classesApi, usersApi, parseApiError } from "@/lib/api";
import { ClassLevelInfo, StaffUser } from "@/types";
import {
  Layers,
  UserCheck,
  Users,
  X,
  CheckCircle2,
  GraduationCap,
  School,
} from "lucide-react";

export default function OfficerClassesPage() {
  const [classes, setClasses] = useState<ClassLevelInfo[]>([]);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Assign Class Teacher Modal
  const [modalClass, setModalClass] = useState<ClassLevelInfo | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);

  const fetchClassesData = async () => {
    try {
      setLoading(true);
      const [classList, teacherList] = await Promise.all([
        classesApi.listClasses(),
        usersApi.listUsers({ role: "teacher" }).catch(() => []),
      ]);
      setClasses(classList);
      setTeachers(teacherList);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesData();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalClass || !selectedTeacherId) return;

    try {
      setAssigning(true);
      setErrorMsg(null);
      await classesApi.assignTeacher(modalClass.class_level, Number(selectedTeacherId));
      setSuccessMsg(`Class teacher successfully assigned to ${modalClass.class_level}.`);
      setModalClass(null);
      setSelectedTeacherId("");
      await fetchClassesData();
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Classes &amp; Form Tutors | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-brand-600" />
              <span>Classes &amp; Class Teachers</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Assign form tutors and oversee grade levels across Junior and Senior secondary schools.
            </p>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

          {/* Classes Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={6} />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No class cohorts currently configured.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {classes.map((cls) => (
                  <div key={cls.class_level} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 font-bold text-sm flex items-center justify-center shrink-0 border border-brand-100">
                        {cls.class_level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">
                            {cls.class_level.startsWith("JSS") ? `Junior Secondary (${cls.class_level})` : `Senior Secondary (${cls.class_level})`}
                          </h3>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {cls.student_count || 0} Students
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <span>Class Teacher:</span>
                          {cls.teacher_name ? (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              {cls.teacher_name}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">No class teacher assigned yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setModalClass(cls);
                        setSelectedTeacherId(cls.teacher_id || "");
                      }}
                      className="self-end sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                    >
                      <UserCheck className="w-4 h-4 text-brand-600" />
                      <span>{cls.teacher_id ? "Reassign Teacher" : "Assign Class Teacher"}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal: Assign Class Teacher */}
          {modalClass && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Assign Class Teacher</h3>
                  <button onClick={() => setModalClass(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  Select a registered faculty member to oversee <span className="font-bold text-slate-800">{modalClass.class_level}</span>:
                </div>

                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Faculty Member --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} (@{t.username})
                      </option>
                    ))}
                  </select>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalClass(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigning || !selectedTeacherId}
                      className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                    >
                      {assigning ? "Saving..." : "Confirm Assignment"}
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