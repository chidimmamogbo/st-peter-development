import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { studentsApi, subjectsApi, parseApiError } from "@/lib/api";
import { StudentProfile, Subject } from "@/types";
import { Users, Filter, Search, Eye, X, RefreshCw, UserCheck } from "lucide-react";

export default function OfficerStudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.listSubjects(false);
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentsApi.listStudents({
        subject_id: selectedSubject ? Number(selectedSubject) : undefined,
        class_level: selectedClass ? selectedClass : undefined,
      });
      setStudents(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedSubject, selectedClass]);

  const handleViewDetail = async (studentId: number) => {
    setIsLoadingDetail(true);
    try {
      const profile = await studentsApi.getStudent(studentId);
      setActiveStudent(profile);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Client-side quick filter by name/admission/username
  const filteredStudents = students.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(term) ||
      s.admission_no.toLowerCase().includes(term) ||
      s.username.toLowerCase().includes(term)
    );
  });

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Student Directory — St. Peter's Portal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
                <Users className="w-8 h-8 text-brand-600" />
                <span>Student Directory</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Institutional student directory with subject enrollment and class-level filters.
              </p>
            </div>
            <button
              onClick={fetchStudents}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-brand-600" />
                <span>Subject Enrollment</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              >
                <option value="">All Subjects (No Filter)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Level Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-brand-600" />
                <span>Class Level</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
              >
                <option value="">All Classes (No Filter)</option>
                <option value="JSS1">JSS1</option>
                <option value="JSS2">JSS2</option>
                <option value="JSS3">JSS3</option>
                <option value="SS1">SS1</option>
                <option value="SS2">SS2</option>
                <option value="SS3">SS3</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand-600" />
                <span>Search by Name, Admission No, or Username</span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to filter displayed records..."
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition placeholder-slate-400"
              />
            </div>
          </div>

          {/* Student Table */}
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No students found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No students match your selected subject or class level filters. Try selecting a different filter.
              </p>
              {(selectedSubject || selectedClass || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedSubject("");
                    setSelectedClass("");
                    setSearchTerm("");
                  }}
                  className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Showing {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}</span>
                {(selectedSubject || selectedClass) && (
                  <span className="text-brand-600 font-semibold">
                    Filters active: {[selectedSubject && "Subject Filter", selectedClass && `Class: ${selectedClass}`].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Full Name</th>
                      <th className="px-6 py-3.5">Admission No</th>
                      <th className="px-6 py-3.5">Username</th>
                      <th className="px-6 py-3.5">Class Level</th>
                      <th className="px-6 py-3.5">User ID</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-navy-900 whitespace-nowrap">
                          {st.full_name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700 whitespace-nowrap">
                          {st.admission_no}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {st.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {st.class_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          ID: #{st.user_id}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetail(st.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition border border-brand-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student Profile Detail Modal */}
          {activeStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative">
                <button
                  onClick={() => setActiveStudent(null)}
                  className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 leading-tight">
                      {activeStudent.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Admission: {activeStudent.admission_no}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Student Profile ID:</span>
                    <span className="font-semibold text-slate-800">#{activeStudent.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">User Account ID:</span>
                    <span className="font-semibold text-slate-800">#{activeStudent.user_id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Username:</span>
                    <span className="font-mono text-xs font-semibold text-brand-700">
                      {activeStudent.username}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Class Level:</span>
                    <span className="font-semibold text-slate-800">{activeStudent.class_level}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveStudent(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
