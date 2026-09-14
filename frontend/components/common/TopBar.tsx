import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface TopBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobileDrawer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleCollapse,
  onOpenMobileDrawer,
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (user.role === "exams_officer") {
      router.push(`/officer/students?class_level=${encodeURIComponent(searchQuery.trim())}`);
    } else if (user.role === "teacher") {
      router.push(`/teacher/my-students?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = () => {
    if (user.role === "exams_officer") {
      router.push("/officer/notifications");
    } else {
      router.push(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-2xs no-print">
      {/* Left side: Hamburger Toggle & Quick Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        {/* Toggle Button: Mobile Drawer on < lg, Desktop Collapse on >= lg */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              onOpenMobileDrawer();
            } else {
              onToggleCollapse();
            }
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Toggle Navigation Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar Input (matching Image 1 layout) */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              user.role === "exams_officer"
                ? "Search students or classes..."
                : user.role === "teacher"
                ? "Search my students or subjects..."
                : "Search portal..."
            }
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </form>
      </div>

      {/* Right side: Notifications, Profile Chip, Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications Icon Button */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Audit Notifications & Logs"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
        </button>

        {/* User Info Chip (Avatar + Name) */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2 py-1 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user.full_name}
            </div>
            <div className="text-[10px] text-slate-400 capitalize">
              {user.role.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Logout Action Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
