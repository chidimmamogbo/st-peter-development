import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else {
        switch (user.role) {
          case "exams_officer":
            router.replace("/officer/students");
            break;
          case "teacher":
            router.replace("/teacher/subjects");
            break;
          case "student":
            router.replace("/student/results");
            break;
          default:
            router.replace("/login");
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Redirecting to portal...</p>
      </div>
    </div>
  );
}
