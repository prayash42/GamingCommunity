import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Star, MessageCircle, Users, X } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  stage: string;
  rating_sum: number;
  rating_count: number;
  created_at: string;
  creator_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CollaboratorRequest {
  id: string;
  project_id: string;
  role_type: string;
  description: string;
  projects: {
    title: string;
  };
}

export default function CollaborationZone() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaboratorRequests, setCollaboratorRequests] = useState<CollaboratorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);

  const stages = ['Idea', 'Prototype', 'Beta', 'Released'];
  const roles = ['Artist', 'Sound Designer', 'Coder', 'Writer'];

  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    stage: 'Idea',
  });

  useEffect(() => {
    loadProjects();
    loadCollaboratorRequests();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCollaboratorRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborator_requests')
        .select('*, projects(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollaboratorRequests(data || []);
    } catch (error) {
      console.error('Error loading collaborator requests:', error);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert([
          {
            ...projectFormData,
            creator_id: user.id,
          },
        ]);

      if (error) throw error;

      setProjectFormData({ title: '', description: '', stage: 'Idea' });
      setShowProjectForm(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;

    try {
      const { error } = await supabase
        .from('project_feedback')
        .insert([
          {
            project_id: selectedProject,
            user_id: user.id,
            content: feedbackText,
            rating: rating,
          },
        ]);

      if (error) throw error;

      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        await supabase
          .from('projects')
          .update({
            rating_sum: project.rating_sum + rating,
            rating_count: project.rating_count + 1,
          })
          .eq('id', selectedProject);
      }

      setFeedbackText('');
      setRating(5);
      setSelectedProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getAverageRating = (project: Project) => {
    if (project.rating_count === 0) return 0;
    return (project.rating_sum / project.rating_count).toFixed(1);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Idea': return 'bg-gray-600/20 text-gray-400';
      case 'Prototype': return 'bg-blue-600/20 text-blue-400';
      case 'Beta': return 'bg-purple-600/20 text-purple-400';
      case 'Released': return 'bg-green-600/20 text-green-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Collaboration & Feedback Zone</h1>
            <p className="text-gray-400">Share your projects and find talented collaborators</p>
          </div>
          <button
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {showProjectForm ? <X size={20} /> : <Plus size={20} />}
            {showProjectForm ? 'Cancel' : 'Share Project'}
          </button>
        </div>

        {showProjectForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Share Your Project</h2>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                <input
                  type="text"
                  value={projectFormData.title}
                  onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Stage</label>
                <select
                  value={projectFormData.stage}
                  onChange={(e) => setProjectFormData({ ...projectFormData, stage: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white h-32 resize-none"
                  placeholder="Describe your project..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Publish Project
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={project.profiles.avatar_url}
                        alt={project.profiles.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-400">{project.profiles.username}</span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded font-medium ${getStageColor(project.stage)}`}>
                      {project.stage}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>

                  <div className="flex items-center gap-4 mb-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={16} />
                      <span className="text-sm font-medium">{getAverageRating(project)}</span>
                      <span className="text-xs text-gray-400">({project.rating_count})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProject(project.id)}
                    className="w-full bg-blue-600/20 text-blue-400 py-2 px-4 rounded-lg hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Request Feedback
                  </button>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-80 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold">Find Collaborators</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Looking for talented individuals to join your project?
              </p>
              <div className="space-y-3">
                {roles.map((role) => {
                  const count = collaboratorRequests.filter(r => r.role_type === role).length;
                  return (
                    <div
                      key={role}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium">{role}</span>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        {count} available
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
              <div className="space-y-3">
                {collaboratorRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">
                        {request.role_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{request.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Submit Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={value <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white h-32 resize-none"
                  placeholder="Share your constructive feedback..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    setFeedbackText('');
                    setRating(5);
                  }}
                  className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
