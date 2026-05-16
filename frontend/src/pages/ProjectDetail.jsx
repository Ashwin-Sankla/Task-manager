// src/pages/ProjectDetail.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import {
  ArrowLeft, Plus, Trash2, UserPlus, Users,
  Circle, PlayCircle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  TODO:        { cls: 'bg-slate-800 border border-slate-700 text-slate-300', label: 'To do',       icon: Circle       },
  IN_PROGRESS: { cls: 'bg-blue-900/30 border border-blue-800 text-blue-400',  label: 'In progress', icon: PlayCircle   },
  DONE:        { cls: 'bg-green-900/30 border border-green-800 text-green-400', label: 'Done',        icon: CheckCircle2 },
};
const PRIORITY_STYLES = {
  HIGH:   'bg-red-900/30 border border-red-800 text-red-400',
  MEDIUM: 'bg-yellow-900/30 border border-yellow-800 text-yellow-400',
  LOW:    'bg-green-900/30 border border-green-800 text-green-400',
};
const STATUSES   = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

// ── TaskForm modal ────────────────────────────────────────────────────────────
function TaskModal({ task, members, projectId, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:      task?.title       || '',
    description:task?.description || '',
    status:     task?.status      || 'TODO',
    priority:   task?.priority    || 'MEDIUM',
    dueDate:    task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    assigneeId: task?.assignee?.id || '',
  });

  const mutation = useMutation({
    mutationFn: data => isEdit
      ? api.patch(`/projects/${projectId}/tasks/${task.id}`, data).then(r => r.data)
      : api.post(`/projects/${projectId}/tasks`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onClose();
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to save task'),
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      dueDate:    form.dueDate || null,
      assigneeId: form.assigneeId || null,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border-slate-700 bg-slate-800 shadow-xl shadow-black/50">
        <h2 className="text-lg font-semibold text-white mb-4">
          {isEdit ? 'Edit task' : 'New task'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" autoFocus placeholder="Task title"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Optional details"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input"
                value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assigneeId}
                onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.title.trim() || mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MembersPanel ──────────────────────────────────────────────────────────────
function MembersPanel({ project, projectId, isAdmin }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [open,  setOpen]  = useState(false);

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/members`, { email }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Member added');
      setEmail('');
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to add member'),
  });

  const removeMutation = useMutation({
    mutationFn: userId => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Member removed');
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to remove member'),
  });

  return (
    <div className="card p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members ({project.members?.length})
        </h2>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {project.members?.map(m => (
            <div key={m.user.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-700/50 last:border-0">
              <div>
                <p className="text-slate-200 font-medium">{m.user.name}</p>
                <p className="text-slate-500 text-xs">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${m.role === 'ADMIN' ? 'bg-brand-900/30 text-brand-400 border border-brand-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {m.role}
                </span>
                {isAdmin && m.user.id !== project.owner?.id && (
                  <button
                    onClick={() => removeMutation.mutate(m.user.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div className="pt-2 flex gap-2">
              <input
                className="input flex-1 text-sm" placeholder="Invite by email"
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <button
                onClick={() => inviteMutation.mutate()}
                disabled={!email || inviteMutation.isPending}
                className="btn-primary shrink-0"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user }      = useAuth();
  const qc            = useQueryClient();
  const [filter, setFilter]         = useState('ALL');
  const [taskModal, setTaskModal]   = useState(null); // null | 'new' | task object

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => api.get(`/projects/${projectId}`).then(r => r.data),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', projectId, filter],
    queryFn:  () => {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      return api.get(`/projects/${projectId}/tasks${params}`).then(r => r.data.tasks);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskId => api.delete(`/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task deleted');
    },
    onError: err => toast.error(err.response?.data?.error || 'Delete failed'),
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      api.patch(`/projects/${projectId}/tasks/${taskId}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
    onError:   err => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const { project, membership } = projectData || {};
  const isAdmin = membership?.role === 'ADMIN';
  const tasks   = tasksData || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-brand-400 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{project?.name}</h1>
            {project?.description && (
              <p className="mt-2 text-base text-slate-400">{project.description}</p>
            )}
          </div>
          <button onClick={() => setTaskModal('new')} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Add task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Task list — 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === s
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-900'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All' : STATUS_STYLES[s].label}
              </button>
            ))}
            <span className="ml-auto text-xs font-medium text-slate-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="card py-16 flex flex-col items-center gap-3 text-slate-400">
              <CheckCircle2 className="h-10 w-10" />
              <p className="text-sm">No tasks {filter !== 'ALL' ? `with status "${STATUS_STYLES[filter]?.label}"` : 'yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
                const { cls, label, icon: StatusIcon } = STATUS_STYLES[task.status];
                return (
                  <div key={task.id} className="card p-5 group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 border-l-4 border-l-brand-500">
                    <div className="flex items-start gap-4">
                      {/* Status toggle */}
                      <button
                        onClick={() => {
                          const next = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];
                          statusUpdateMutation.mutate({ taskId: task.id, status: next });
                        }}
                        className="mt-0.5 shrink-0 text-slate-500 hover:text-brand-400 transition-colors"
                        title="Cycle status"
                      >
                        <StatusIcon className="h-6 w-6" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setTaskModal(task)}
                          className="text-base font-semibold text-slate-200 hover:text-brand-400 text-left transition-colors"
                        >
                          {task.title}
                        </button>
                        {task.description && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`badge ${cls}`}>{label}</span>
                          <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                          {task.assignee && (
                            <span className="badge bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">{task.assignee.name.charAt(0)}</span>
                              {task.assignee.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
                              {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('Delete this task?')) deleteMutation.mutate(task.id);
                        }}
                        className="shrink-0 p-1.5 rounded-md text-slate-500 hover:bg-red-900/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-4">
          {project && (
            <MembersPanel project={project} projectId={projectId} isAdmin={isAdmin} />
          )}
        </div>
      </div>

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          members={project?.members || []}
          projectId={projectId}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}
