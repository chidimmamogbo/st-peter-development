import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { subjectsApi, parseApiError } from "@/lib/api";
import { Subject, TeacherStudentItem } from "@/types";
import {
  Users,
  Search,
  Filter,
  BookOpen,
  Edit3,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export default function TeacherMyStudentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);

  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "">("");
  const [selectedClassLevel, setSelectedClassLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFiltersAndStudents = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Load teacher's subjects first
      const subjs = await subjectsApi.listSubjects(true);
      setMySubjects(subjs);

      // Fetch students with current filters
      const data = await subjectsApi.getMineStudents({
        subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        class_level: selectedClassLevel || undefined,
        search: searchQuery.trim() || undefined,
      });

      setStudents(data);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndStudents();
  }, [selectedSubjectId, selectedClassLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiltersAndStudents();
  };

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AppLayout title="My Students | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-brand-600" />
              <span>My Enrolled Students</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse students registered across your assigned subject offerings and record continuous assessment marks.
            </p>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or admission number..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </form>

            {/* Subject Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 w-full sm:w-auto"
              >
                <option value="">All My Subjects</option>
                {mySubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              {/* Class Level Dropdown */}
              <select
                value={selectedClassLevel}
                onChange={(e) => setSelectedClassLevel(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 w-full sm:w-auto"
              >
                <option value="">All Classes</option>
                <option value="JSS1">JSS 1</option>
                <option value="JSS2">JSS 2</option>
                <option value="JSS3">JSS 3</option>
                <option value="SS1">SS 1</option>
                <option value="SS2">SS 2</option>
                <option value="SS3">SS 3</option>
              </select>

              <button
                type="button"
                onClick={fetchFiltersAndStudents}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Student Roster Cards/Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No students found matching your selected filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((st) => (
                  <div key={st.student_id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-100">
                        {st.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{st.full_name}</h3>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {st.admission_no}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            {st.class_level}
                          </span>
                        </div>

                        {/* Enrolled Subjects with this teacher as tags (Mandatory Requirement) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-slate-400 font-medium mr-1">Enrolled in:</span>
                          {st.enrolled_subjects && st.enrolled_subjects.length > 0 ? (
                            st.enrolled_subjects.map((subj) => (
                              <span
                                key={subj.subject_id}
                                className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/80 font-medium text-[11px] flex items-center gap-1"
                              >
                                <BookOpen className="w-3 h-3 text-brand-500" />
                                <span>{subj.subject_name} ({subj.subject_code})</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Enrolled</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Enter Score Action */}
                    <button
                      onClick={() => {
                        const firstSubjId = st.enrolled_subjects?.[0]?.subject_id || selectedSubjectId || "";
                        router.push(`/teacher/scores?student_id=${st.student_id}&subject_id=${firstSubjId}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition self-end sm:self-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Enter Score</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}