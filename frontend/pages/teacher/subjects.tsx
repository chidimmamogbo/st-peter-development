import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { subjectsApi, scoresApi, parseApiError } from "@/lib/api";
import { Subject, SubjectStats } from "@/types";
import { BookOpen, Users, BarChart3, PlusCircle, ArrowUpRight } from "lucide-react";

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, SubjectStats>>({});
  const [enrolledMap, setEnrolledMap] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTeacherData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Teacher calls with mine=true to view only their assigned classes
        const mySubjects = await subjectsApi.listSubjects(true);
        setSubjects(mySubjects);

        // Fetch enrolled counts & stats in parallel
        const statsObj: Record<number, SubjectStats> = {};
        const enrollObj: Record<number, number> = {};

        await Promise.all(
          mySubjects.map(async (subj) => {
            try {
              const students = await subjectsApi.getSubjectStudents(subj.id);
              enrollObj[subj.id] = students.length;
            } catch {
              enrollObj[subj.id] = 0;
            }

            try {
              const stats = await scoresApi.getSubjectStats(subj.id, "2026-term1");
              statsObj[subj.id] = stats;
            } catch {
              // stats optional if term scores not entered yet
            }
          })
        );

        setStatsMap(statsObj);
        setEnrolledMap(enrollObj);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AppLayout title="My Subjects — St. Peter's Portal">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-emerald-600" />
                <span>My Assigned Curriculum Subjects</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview of subjects you are assigned to teach and grade for St. Peter&apos;s College.
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/scores")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enter Student Scores</span>
            </button>
          </div>

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Subject Cards */}
          {isLoading ? (
            <CardSkeleton count={3} />
          ) : subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No assigned subjects</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                You are not currently assigned to teach any subjects. Please contact the Exams Officer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subj) => {
                const stats = statsMap[subj.id];
                const studentCount = enrolledMap[subj.id] ?? 0;

                return (
                  <div
                    key={subj.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {subj.code}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{studentCount} Enrolled</span>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold text-navy-900 group-hover:text-emerald-700 transition">
                        {subj.name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Instructor: {subj.teacher_name || "Self"}</p>

                      {/* Performance Metric Box */}
                      {stats ? (
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Term 1 Performance Stats</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Average</span>
                              <span className="text-sm font-bold text-navy-900">{stats.average}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Highest</span>
                              <span className="text-sm font-bold text-emerald-700">{stats.highest}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Lowest</span>
                              <span className="text-sm font-bold text-rose-600">{stats.lowest}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
                          No scores finalized yet for this subject.
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => router.push(`/teacher/scores?subject_id=${subj.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
                      >
                        <span>Record / Manage Scores</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
