import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, ThumbsUp, MessageCircle, Eye, FileText, X } from 'lucide-react';

interface GameIdea {
  id: string;
  title: string;
  genre: string;
  category: string;
  summary: string;
  tags: string[];
  upvotes: number;
  view_count: number;
  created_at: string;
  creator_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function IdeasHub() {
  const { user, profile } = useAuth();
  const [ideas, setIdeas] = useState<GameIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const genres = ['Action', 'RPG', 'Strategy', 'Puzzle', 'Adventure', 'Horror', 'Simulation', 'Sports'];
  const categories = ['Story', 'Prototype', 'Element'];
  const availableTags = ['Fantasy', 'Sci-Fi', 'Mystery', 'Open World', 'Multiplayer', 'Story-Rich', 'Indie', '2D', '3D'];

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    category: 'Story',
    summary: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('game_ideas')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error loading ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('game_ideas')
        .insert([
          {
            ...formData,
            creator_id: user.id,
          },
        ]);

      if (error) throw error;

      setFormData({ title: '', genre: '', category: 'Story', summary: '', tags: [] });
      setShowForm(false);
      loadIdeas();
    } catch (error) {
      console.error('Error creating idea:', error);
    }
  };

  const handleUpvote = async (ideaId: string, currentUpvotes: number) => {
    try {
      const { error } = await supabase
        .from('game_ideas')
        .update({ upvotes: currentUpvotes + 1 })
        .eq('id', ideaId);

      if (error) throw error;
      loadIdeas();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Story':
        return 'bg-blue-600/20 text-blue-400';
      case 'Prototype':
        return 'bg-green-600/20 text-green-400';
      case 'Element':
        return 'bg-orange-600/20 text-orange-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const filteredIdeas = selectedCategoryFilter === 'All'
    ? ideas
    : ideas.filter((idea) => idea.category === selectedCategoryFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Idea & Storyline Hub</h1>
          <p className="text-gray-400">Share your game concepts and discover inspiring ideas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Share Idea'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Share Your Game Idea</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                placeholder="Enter your game title"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  <option value="">Select a genre</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white h-32 resize-none"
                placeholder="Describe your game concept..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Publish Idea
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategoryFilter === cat
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={idea.profiles.avatar_url}
                  alt={idea.profiles.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-400">{idea.profiles.username}</span>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                  {idea.genre}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(idea.category)}`}>
                  {idea.category}
                </span>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3">{idea.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3">{idea.summary}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {idea.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleUpvote(idea.id, idea.upvotes)}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <ThumbsUp size={16} />
                  <span className="text-sm">{idea.upvotes}</span>
                </button>
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye size={16} />
                  <span className="text-sm">{idea.view_count}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-600/30 transition-colors">
                <FileText size={14} />
                Request Demo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
