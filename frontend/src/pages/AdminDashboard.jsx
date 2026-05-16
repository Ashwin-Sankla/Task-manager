import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserMinus, Clock, PieChart as PieChartIcon } from 'lucide-react';
import api from '../lib/api';
import WorkloadChart from '../components/WorkloadChart';

function AdminStatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div 
      className={`card p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          <p className="text-sm font-medium text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: workload, isLoading: loadingWorkload } = useQuery({
    queryKey: ['adminWorkload'],
    queryFn: () => api.get('/admin/workload').then(res => res.data)
  });

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['adminMembersStats'],
    queryFn: () => api.get('/admin/members?limit=1').then(res => res.data) // minimal data just for stats
  });

  const isLoading = loadingWorkload || loadingMembers;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const { distribution } = workload || {};
  const { stats } = members || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <PieChartIcon className="h-8 w-8 text-brand-500" /> Admin Dashboard
        </h1>
        <p className="text-base text-slate-400 mt-1">Platform overview and team workload statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workload Status Pie Chart */}
        <div className="card p-6 flex flex-col">
          <div className="mb-4 pb-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Workload Distribution</h2>
            <p className="text-sm text-slate-400 mt-1">Global task distribution across all projects.</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <WorkloadChart data={distribution} />
          </div>
        </div>

        {/* Team Overview Section */}
        <div className="flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-white">Team Overview</h2>
            <p className="text-sm text-slate-400 mt-1">Click any card to view detailed member lists.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminStatCard 
              icon={Users} 
              label="Total Members" 
              value={stats?.total || 0} 
              color="bg-brand-900/30 text-brand-400 border border-brand-800"
              onClick={() => navigate('/admin/members')} 
            />
            <AdminStatCard 
              icon={UserCheck} 
              label="Active" 
              value={stats?.active || 0} 
              color="bg-green-900/30 text-green-400 border border-green-800"
              onClick={() => navigate('/admin/members?status=ACTIVE')} 
            />
            <AdminStatCard 
              icon={UserMinus} 
              label="Inactive" 
              value={stats?.inactive || 0} 
              color="bg-slate-800 text-slate-400 border border-slate-700"
              onClick={() => navigate('/admin/members?status=INACTIVE')} 
            />
            <AdminStatCard 
              icon={Clock} 
              label="On Leave" 
              value={stats?.onLeave || 0} 
              color="bg-yellow-900/30 text-yellow-400 border border-yellow-800"
              onClick={() => navigate('/admin/members?status=ON_LEAVE')} 
            />
          </div>
          <div className="mt-4 flex justify-end">
             <Link to="/admin/members" className="btn-secondary text-sm">
                View All Members &rarr;
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
