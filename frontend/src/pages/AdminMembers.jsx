import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

const STATUS_STYLES = {
  ACTIVE:   'bg-green-900/30 text-green-400 border-green-800',
  INACTIVE: 'bg-slate-800 text-slate-400 border-slate-700',
  ON_LEAVE: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
};

export default function AdminMembers() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const { data, isLoading } = useQuery({
    queryKey: ['adminMembers', page, limit],
    queryFn: () => api.get(`/admin/members?page=${page}&limit=${limit}`).then(res => res.data),
    keepPreviousData: true
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const { members = [], pagination = {} } = data || {};
  
  // Basic client-side filtering for status if needed, 
  // though in a real large-scale app this should be a backend filter query parameter.
  // We'll filter client-side here for simplicity since limit is 10.
  const filteredMembers = statusFilter === 'ALL' 
    ? members 
    : members.filter(m => m.status === statusFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-brand-400 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Team Members</h1>
        <p className="text-base text-slate-400 mt-1">Detailed overview of team workload and status.</p>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4 bg-slate-800/50">
          <div className="flex items-center gap-2">
             {['ALL', 'ACTIVE', 'INACTIVE', 'ON_LEAVE'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-900'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
             ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="input pl-9 h-9 text-sm w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Member</th>
                <th className="px-6 py-4 font-semibold">Role / Dept</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Workload</th>
                <th className="px-6 py-4 font-semibold">Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No members found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{member.systemRole}</p>
                      <p className="text-xs text-slate-400">{member.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${STATUS_STYLES[member.status]}`}>
                        {member.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className="text-white font-semibold">{member.workloadCount}</span>
                         <span className="text-xs text-slate-500">active tasks</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.projects.length === 0 ? (
                          <span className="text-slate-500 text-xs italic">None</span>
                        ) : (
                          member.projects.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/30">
          <p className="text-xs text-slate-400">
            Showing page <span className="font-semibold text-white">{pagination.page}</span> of <span className="font-semibold text-white">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
