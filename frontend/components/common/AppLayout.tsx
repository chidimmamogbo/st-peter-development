import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "@/context/AuthContext";

interface AppLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSE_STORAGE_KEY = "st_peters_sidebar_collapsed";

export const AppLayout: React.FC<AppLayoutProps> = ({
  title = "St. Peter's Result Portal",
  description = "Centralized academic results portal for St. Peter's College",
  children,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const handleOpenMobileDrawer = () => {
    setIsMobileDrawerOpen(true);
  };

  const handleCloseMobileDrawer = () => {
    setIsMobileDrawerOpen(false);
  };

  // If unauthenticated (e.g. public screen), render clean container
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col antialiased">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onToggleCollapse={handleToggleCollapse}
        onCloseMobileDrawer={handleCloseMobileDrawer}
      />

      {/* Main Column (with dynamic left margin on desktop) */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${mounted && isCollapsed ? "lg:ml-20" : "lg:ml-64"}
          ml-0
        `}
      >
        {/* Sticky Top Header Bar */}
        <TopBar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onOpenMobileDrawer={handleOpenMobileDrawer}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <p>© {new Date().getFullYear()} St. Peter&apos;s College. All rights reserved.</p>
            <p className="text-slate-400">Continuous Assessment &amp; Examination Engine</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
