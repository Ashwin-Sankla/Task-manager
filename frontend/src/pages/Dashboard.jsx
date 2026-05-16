// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Link }     from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, FolderOpen, ListTodo } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = {
  HIGH:   'bg-red-900/30 border border-red-800 text-red-400',
  MEDIUM: 'bg-yellow-900/30 border border-yellow-800 text-yellow-400',
  LOW:    'bg-green-900/30 border border-green-800 text-green-400',
};
const STATUS_COLORS = {
  TODO:        'bg-slate-800 border border-slate-700 text-slate-300',
  IN_PROGRESS: 'bg-blue-900/30 border border-blue-800 text-blue-400',
  DONE:        'bg-green-900/30 border border-green-800 text-green-400',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
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

function TaskRow({ task }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-700 last:border-0 group transition-colors hover:bg-slate-700/30 -mx-6 px-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-brand-400 transition-colors">{task.title}</p>
        <div className="flex items-center gap-2.5 mt-1">
          {task.project && (
            <Link to={`/projects/${task.project.id}`} className="text-xs font-medium text-slate-500 hover:text-brand-400 hover:underline">
              {task.project.name}
            </Link>
          )}
          {task.dueDate && (
            <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
              {overdue ? 'Overdue · ' : ''}{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
        <span className={`badge ${STATUS_COLORS[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const { stats = {}, overdueTasks = [], myTasks = [] } = data || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 lg:mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-base text-slate-400">Here's what's happening across your projects today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={FolderOpen}   label="Projects"    value={stats.totalProjects ?? 0} color="bg-brand-900/30 text-brand-400 border border-brand-800" />
        <StatCard icon={ListTodo}     label="To do"       value={stats.todo         ?? 0} color="bg-slate-800 text-slate-300 border border-slate-700" />
        <StatCard icon={Clock}        label="In progress" value={stats.inProgress   ?? 0} color="bg-blue-900/30 text-blue-400 border border-blue-800"   />
        <StatCard icon={AlertCircle}  label="Overdue"     value={stats.overdue      ?? 0} color="bg-red-900/30 text-red-400 border border-red-800"     />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My open tasks */}
        <div className="card p-6">
          <div className="mb-4 pb-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Assigned to me</h2>
            <span className="badge bg-brand-900/40 text-brand-400 border border-brand-800">{myTasks.length}</span>
          </div>
          <div className="flex flex-col">
            {myTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} message="All caught up!" />
            ) : (
              myTasks.map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>

        {/* Overdue tasks */}
        <div className="card p-6">
          <div className="mb-4 pb-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Overdue tasks</h2>
            {overdueTasks.length > 0 && (
              <span className="badge bg-red-900/30 text-red-400 border border-red-800">{overdueTasks.length}</span>
            )}
          </div>
          <div className="flex flex-col">
            {overdueTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} message="No overdue tasks" />
            ) : (
              overdueTasks.map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
      <Icon className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
