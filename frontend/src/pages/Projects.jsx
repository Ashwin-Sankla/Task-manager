// src/pages/Projects.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

function CreateProjectModal({ onClose }) {
  const qc = useQueryClient();
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');

  const mutation = useMutation({
    mutationFn: data => api.post('/projects', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 border-slate-700 bg-slate-800 shadow-xl shadow-black/50">
        <h2 className="text-lg font-semibold text-white mb-4">New project</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className="input" autoFocus placeholder="e.g. Q3 Launch"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none" rows={3} placeholder="Optional"
              value={description} onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={() => mutation.mutate({ name, description })}
              disabled={!name.trim() || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data.projects),
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Delete failed'),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-base text-slate-400 mt-1">All projects you're a member of.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : data?.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-slate-400">
          <FolderKanban className="h-12 w-12" />
          <p className="text-sm">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map(project => (
            <div key={project.id} className="card p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 hover:border-brand-500/50 transition-all duration-300 group flex flex-col bg-slate-800 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <Link to={`/projects/${project.id}`} className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                    {project.name}
                  </h2>
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Delete this project and all its tasks?')) {
                      deleteMutation.mutate(project.id);
                    }
                  }}
                  className="ml-3 shrink-0 p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {project.description ? (
                <p className="text-sm text-slate-400 line-clamp-2 flex-1 mb-4">{project.description}</p>
              ) : (
                 <p className="text-sm text-slate-500 italic flex-1 mb-4">No description provided.</p>
              )}

              <div className="mt-auto pt-4 border-t border-slate-700 flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
                  <CheckSquare className="h-3.5 w-3.5 text-brand-400" />
                  {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
                  <Users className="h-3.5 w-3.5 text-brand-400" />
                  {project._count.members} member{project._count.members !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
