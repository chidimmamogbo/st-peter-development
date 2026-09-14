import React, { useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AlertBanner } from "@/components/common/AlertBanner";
import { authApi, studentsApi, parseApiError } from "@/lib/api";
import {
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  Users,
} from "lucide-react";

export default function RegisterStudentPage() {
  const router = useRouter();

  // Wizard Step: 1 (User Account) or 2 (Student Academic Profile) or 3 (Success)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form Data
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Captured Step 1 Output
  const [createdUser, setCreatedUser] = useState<{ id: number; username: string; full_name: string } | null>(null);

  // Step 2 Form Data
  const [admissionNo, setAdmissionNo] = useState("");
  const [classLevel, setClassLevel] = useState("SS2");

  // State flags
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Step 1 Submit: POST /auth/register
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorMsg("Please fill in all account fields.");
      return;
    }

    try {
      setSubmitting(true);
      const userRes = await authApi.register({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role: "student",
      });

      // Automatically capture user id and username, auto-generate default admission pattern
      setCreatedUser({
        id: userRes.id,
        username: userRes.username,
        full_name: userRes.full_name,
      });

      const year = new Date().getFullYear();
      setAdmissionNo(`STP/${year}/${String(userRes.id).padStart(3, "0")}`);
      setStep(2);
      setSuccessMsg(`User account created for ${userRes.full_name}. Now link the academic profile.`);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Step 2 Submit: POST /students
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!createdUser) {
      setErrorMsg("Session missing created user account. Please start from Step 1.");
      setStep(1);
      return;
    }

    if (!admissionNo.trim() || !classLevel.trim()) {
      setErrorMsg("Please provide admission number and class level.");
      return;
    }

    try {
      setSubmitting(true);
      await studentsApi.createProfile({
        user_id: createdUser.id,
        username: createdUser.username,
        admission_no: admissionNo.trim(),
        class_level: classLevel.trim(),
      });

      setStep(3);
      setSuccessMsg(`Student profile successfully registered and linked!`);
    } catch (err) {
      setErrorMsg(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFullName("");
    setUsername("");
    setPassword("");
    setCreatedUser(null);
    setAdmissionNo("");
    setClassLevel("SS2");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Register Student | St. Peter's Result Portal">
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-brand-600" />
              <span>Register New Student</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Two-step enrollment wizard: creates the authenticated student account and links institutional academic records.
            </p>
          </div>

          {/* Stepper Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 1 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                1
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Step 1</span>
                <span className="text-[11px] text-slate-400">User Account</span>
              </div>
            </div>

            <div className="w-12 sm:w-20 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 2 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                2
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Step 2</span>
                <span className="text-[11px] text-slate-400">Academic Profile</span>
              </div>
            </div>

            <div className="w-12 sm:w-20 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Done</span>
                <span className="text-[11px] text-slate-400">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Error & Info Banners */}
          {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          {successMsg && step < 3 && <AlertBanner type="info" message={successMsg} />}

          {/* Step 1: User Account Form */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">Step 1: Student Account Credentials</h2>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chukwuma Emmanuel"
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
                      placeholder="e.g. emmanuel_c"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Lowercase, letters and numbers.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Secret123!"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Default demo: Secret123!</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
                  >
                    <span>{submitting ? "Creating Account..." : "Next: Academic Profile"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Student Academic Profile Linking */}
          {step === 2 && createdUser && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">Step 2: Assign Admission &amp; Class</h2>
              </div>

              {/* Seamless Capture Banner */}
              <div className="p-3.5 rounded-xl bg-brand-50/80 border border-brand-200 text-xs text-brand-900 mb-6 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Linked User Account:</span>
                  <span>{createdUser.full_name} (@{createdUser.username}) • User ID: {createdUser.id}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-brand-200/70 text-brand-800 rounded-full font-bold">Auto-Captured</span>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    placeholder="e.g. STP/2026/015"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Institutional unique student identifier.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Class Level *
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="JSS1">Junior Secondary 1 (JSS1)</option>
                    <option value="JSS2">Junior Secondary 2 (JSS2)</option>
                    <option value="JSS3">Junior Secondary 3 (JSS3)</option>
                    <option value="SS1">Senior Secondary 1 (SS1)</option>
                    <option value="SS2">Senior Secondary 2 (SS2)</option>
                    <option value="SS3">Senior Secondary 3 (SS3)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Back to Step 1
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
                  >
                    <span>{submitting ? "Registering Profile..." : "Complete Registration"}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Success Confirmation Screen */}
          {step === 3 && createdUser && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Student Registered Successfully!</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {createdUser.full_name} is now enrolled in <span className="font-semibold text-slate-800">{classLevel}</span> with admission number <span className="font-semibold text-slate-800">{admissionNo}</span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-semibold text-slate-800">{createdUser.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono font-semibold text-slate-800">{createdUser.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono font-semibold text-brand-700">{admissionNo}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Class:</span>
                  <span className="font-semibold text-slate-800">{classLevel}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Register Another Student</span>
                </button>
                <button
                  onClick={() => router.push("/officer/students")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  <Users className="w-4 h-4" />
                  <span>View Student Directory</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}