import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  BookOpen,
  Layers,
  Briefcase,
  Send,
  Trophy,
  Bell,
  Edit3,
  FileCheck,
  BarChart3,
  FileText,
  LogOut,
  X,
  CheckCircle2,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobileDrawer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  // Navigation items strictly by role
  const getNavLinks = () => {
    switch (user.role) {
      case "exams_officer":
        return [
          { href: "/officer/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/officer/students", label: "Student Directory", icon: Users },
          { href: "/officer/register-student", label: "Register Student", icon: UserPlus },
          { href: "/officer/register-staff", label: "Register Staff", icon: UserCheck },
          { href: "/officer/subjects", label: "Subjects", icon: BookOpen },
          { href: "/officer/classes", label: "Classes", icon: Layers },
          { href: "/officer/staff", label: "Staff Directory", icon: Briefcase },
          { href: "/officer/publish", label: "Publish Results", icon: Send },
          { href: "/officer/rankings", label: "Class Rankings", icon: Trophy },
          { href: "/officer/notifications", label: "Audit Logs", icon: Bell },
        ];
      case "teacher":
        return [
          { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/teacher/subjects", label: "My Subjects", icon: BookOpen },
          { href: "/teacher/scores", label: "Enter Score", icon: Edit3 },
          { href: "/teacher/scores?mode=correct", label: "Correct Score", icon: FileCheck },
          { href: "/teacher/statistics", label: "Subject Statistics", icon: BarChart3 },
          { href: "/teacher/my-students", label: "My Students", icon: Users },
        ];
      case "student":
        return [
          { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/student/results", label: "My Results", icon: FileText },
          { href: "/student/rankings", label: "Class Rankings", icon: Trophy },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadge = () => {
    switch (user.role) {
      case "exams_officer":
        return {
          label: "Exams Officer",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "teacher":
        return {
          label: "Teacher",
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      case "student":
        return {
          label: "Student",
          color: "bg-sky-100 text-sky-800 border-sky-200",
        };
      default:
        return { label: user.role, color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const roleBadge = getRoleBadge();

  // Avatar initials helper
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    onCloseMobileDrawer();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={onCloseMobileDrawer}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col
          transition-all duration-300 ease-in-out no-print shadow-sm
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          ${isMobileDrawerOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Top Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div
            onClick={() => {
              if (user.role === "exams_officer") handleNavClick("/officer/dashboard");
              else if (user.role === "teacher") handleNavClick("/teacher/dashboard");
              else handleNavClick("/student/dashboard");
            }}
            className="flex items-center gap-3 cursor-pointer select-none group w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:bg-brand-500 transition-all shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>

            {(!isCollapsed || isMobileDrawerOpen) && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="font-bold text-base tracking-tight text-slate-900 block group-hover:text-brand-600 transition truncate">
                  St. Peter&apos;s College
                </span>
                <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block -mt-1">
                  Result Portal
                </span>
              </div>
            )}
          </div>

          {/* Close button inside mobile drawer */}
          <button
            onClick={onCloseMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Block (Directly under the logo, matching Image 1) */}
        <div
          className={`
            p-3.5 border-b border-slate-100 bg-slate-50/70 transition-all
            ${isCollapsed && !isMobileDrawerOpen ? "text-center" : "flex items-center gap-3"}
          `}
        >
          <div className="relative shrink-0 mx-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {getInitials(user.full_name)}
            </div>
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
              title="Online"
            />
          </div>

          {(!isCollapsed || isMobileDrawerOpen) && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-slate-900 truncate block">
                  {user.full_name}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              </div>
              <div className="mt-0.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1 custom-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              router.asPath === link.href ||
              router.pathname === link.href.split("?")[0];

            return (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                title={isCollapsed && !isMobileDrawerOpen ? link.label : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                  ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }
                  ${isCollapsed && !isMobileDrawerOpen ? "justify-center px-0" : ""}
                `}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600"
                  }`}
                />

                {(!isCollapsed || isMobileDrawerOpen) ? (
                  <span className="truncate">{link.label}</span>
                ) : (
                  /* Floating tooltip for collapsed desktop */
                  <span className="hidden lg:group-hover:block absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none">
                    {link.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            onClick={logout}
            title={isCollapsed && !isMobileDrawerOpen ? "Sign Out" : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition
              ${isCollapsed && !isMobileDrawerOpen ? "justify-center px-0" : ""}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!isCollapsed || isMobileDrawerOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
