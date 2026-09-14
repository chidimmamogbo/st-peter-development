import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { usersApi, parseApiError } from "@/lib/api";
import { StaffUser } from "@/types";
import {
  Briefcase,
  Search,
  Filter,
  UserCheck,
  BookOpen,
  Calendar,
  X,
  Eye,
  CheckCircle2,
} from "lucide-react";

export default function OfficerStaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [detailUser, setDetailUser] = useState<StaffUser | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await usersApi.listUsers({
        role: roleFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setStaffList(data);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const u = await usersApi.getUser(id);
      setDetailUser(u);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Staff Directory | St. Peter's Result Portal">
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-purple-600" />
              <span>Staff &amp; Faculty Directory</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse, search, and inspect academic profiles, assigned curricula, and faculty roles.
            </p>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          {/* Search & Role Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name or username..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 w-full sm:w-auto"
              >
                <option value="">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="exams_officer">Exams Officers</option>
              </select>

              <button
                type="button"
                onClick={fetchStaff}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : staffList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No staff members found matching your search.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staffList.map((st) => (
                  <div key={st.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {st.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{st.full_name}</h3>
                          <span className="font-mono text-xs text-slate-400">@{st.username}</span>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              st.role === "exams_officer"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {st.role === "exams_officer" ? "Exams Officer" : "Teacher"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenDetail(st.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Profile</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal: Staff Details & Subjects Taught */}
          {detailUser && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      {detailUser.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{detailUser.full_name}</h3>
                      <span className="text-[11px] text-slate-400">@{detailUser.username}</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailUser(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">System Role:</span>
                    <span className="font-semibold capitalize text-slate-800">{detailUser.role.replace("_", " ")}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-slate-700">#{detailUser.id}</span>
                  </div>

                  {/* Subjects Taught (Mandatory Requirement) */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      {detailUser.role === "teacher" ? "Curriculum Subjects Taught:" : "Administrative Authority:"}
                    </span>

                    {detailUser.role === "teacher" ? (
                      detailUser.subjects_taught && detailUser.subjects_taught.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {detailUser.subjects_taught.map((subj, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 font-medium text-xs flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                              <span>{subj}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-500 italic">
                          Assigned to active school subjects in directory.
                        </div>
                      )
                    ) : (
                      <div className="p-2.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-100 font-medium">
                        Institution-wide Examination &amp; Publication Authority
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDetailUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
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