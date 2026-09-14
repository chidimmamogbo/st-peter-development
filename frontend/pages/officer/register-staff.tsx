import React, { useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { authApi, usersApi, parseApiError } from "@/lib/api";
import { Role } from "@/types";
import {
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";

export default function RegisterStaffPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("teacher");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdStaff, setCreatedStaff] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorMsg("Please fill in all staff details.");
      return;
    }

    try {
      setSubmitting(true);
      const userRes = await authApi.register({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role: role,
      });

      // Also record in fallback storage for directory indexing
      usersApi.recordLocalStaff({
        id: userRes.id,
        username: userRes.username,
        role: userRes.role,
        full_name: userRes.full_name,
        created_at: userRes.created_at,
      });

      setCreatedStaff(userRes);
      setSuccessMsg(`Staff account for ${userRes.full_name} (${role === "teacher" ? "Teacher" : "Exams Officer"}) registered successfully.`);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName("");
    setUsername("");
    setPassword("");
    setRole("teacher");
    setCreatedStaff(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Register Staff | St. Peter's Result Portal">
        <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-purple-600" />
              <span>Register Faculty &amp; Staff</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create authenticated portal credentials for subject teachers or administrative exams officers.
            </p>
          </div>

          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          {successMsg && <AlertBanner type="success" message={successMsg} />}

          {!createdStaff ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Staff Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="teacher">Subject Teacher</option>
                    <option value="exams_officer">Exams Officer (Administrator)</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {role === "teacher"
                      ? "Can be assigned to subjects, enroll students, and enter/correct continuous assessment scores."
                      : "Full administrative access: curriculum management, registration, and term publication."}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Patrick Okon"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. dr_okon"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Secret123!"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
                  >
                    <span>{submitting ? "Registering Staff..." : "Create Staff Account"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">Account Created Successfully</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Credentials for {createdStaff.full_name} are active.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono font-semibold text-slate-800">{createdStaff.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="capitalize font-semibold text-purple-700">{createdStaff.role}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Register Another</span>
                </button>
                <button
                  onClick={() => router.push("/officer/staff")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>View Staff Directory</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}