import React, { useState } from "react";
import Link from "next/router";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Users,
  Send,
  Trophy,
  Bell,
  BookOpen,
  Edit3,
  FileText,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case "exams_officer":
        return [
          { href: "/officer/students", label: "Student Directory", icon: Users },
          { href: "/officer/publish", label: "Publish Results", icon: Send },
          { href: "/officer/rankings", label: "Class Rankings", icon: Trophy },
          { href: "/officer/notifications", label: "Audit Logs", icon: Bell },
        ];
      case "teacher":
        return [
          { href: "/teacher/subjects", label: "My Subjects", icon: BookOpen },
          { href: "/teacher/scores", label: "Score Entry & Corrections", icon: Edit3 },
        ];
      case "student":
        return [
          { href: "/student/results", label: "My Result Sheet", icon: FileText },
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

  return (
    <nav className="bg-navy-900 text-white border-b border-navy-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (user.role === "exams_officer") router.push("/officer/students");
                else if (user.role === "teacher") router.push("/teacher/subjects");
                else router.push("/student/results");
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-inner group-hover:bg-brand-500 transition">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight block text-white group-hover:text-brand-300 transition">
                  St. Peter&apos;s College
                </span>
                <span className="text-xs text-slate-400 block -mt-1 font-medium tracking-wide">
                  Result Portal
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = router.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600/90 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile Info & Logout */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-white leading-tight">
                {user.full_name}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-800 bg-navy-950 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          {/* User Card on Mobile */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{user.full_name}</div>
                <span
                  className={`inline-block text-[10px] font-medium px-2 py-0.2 rounded-full border ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-lg border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Nav Links on Mobile */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = router.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(link.href);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/10 text-left"
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
