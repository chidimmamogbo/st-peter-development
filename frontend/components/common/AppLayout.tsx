import React from "react";
import Head from "next/head";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  title = "St. Peter's Result Portal",
  description = "Centralized academic results portal for St. Peter's College",
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} St. Peter&apos;s College. All rights reserved.</p>
          <p className="text-slate-400">Continuous Assessment &amp; Examination Engine</p>
        </div>
      </footer>
    </div>
  );
};
