import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/common/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { AlertBanner } from "@/components/common/AlertBanner";
import { resultsApi, parseApiError } from "@/lib/api";
import { NotificationLog } from "@/types";
import { Bell, RefreshCw, CheckCircle2 } from "lucide-react";

export default function OfficerNotificationsPage() {
  const [term, setTerm] = useState("");
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resultsApi.getNotifications(term.trim() || undefined);
      setLogs(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["exams_officer"]}>
      <AppLayout title="Notification Logs — St. Peter's Portal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight flex items-center gap-3">
                <Bell className="w-8 h-8 text-brand-600" />
                <span>Background Notification Audit Log</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Audited background worker events dispatched to students upon official term publication.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-600" : ""}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Filter by Term</label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. 2026-term1"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 font-mono bg-white text-slate-900"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              Filter Logs
            </button>
            {term && (
              <button
                onClick={() => {
                  setTerm("");
                  resultsApi.getNotifications().then(setLogs).catch(() => {});
                }}
                className="w-full sm:w-auto px-3 py-2 text-slate-600 hover:text-slate-900 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No notification logs found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No background notifications have been recorded yet {term ? `for term "${term}"` : ""}. Publish a term to fire background notifications.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                Showing {logs.length} Recorded Worker Dispatch {logs.length === 1 ? "Event" : "Events"}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Log ID</th>
                      <th className="px-6 py-3.5">Term</th>
                      <th className="px-6 py-3.5">Target Student ID</th>
                      <th className="px-6 py-3.5">Audit Message</th>
                      <th className="px-6 py-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          #{log.id}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700 whitespace-nowrap">
                          {log.term}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                          Student #{log.student_id}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-medium">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{log.message}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
