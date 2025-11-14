import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, ThumbsUp, MessageCircle, Share2, TrendingUp, Award, X } from 'lucide-react';

interface MediaPost {
  id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  view_count: number;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    avatar_url: string;
    badges?: string[];
  };
}

export default function CommunityMedia() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Reviews', 'Game News', 'Devlogs', 'Opinion'];

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Game News',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*, profiles(username, avatar_url, badges)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('media_posts')
        .insert([
          {
            ...formData,
            author_id: user.id,
          },
        ]);

      if (error) throw error;

      setFormData({ title: '', content: '', category: 'Game News' });
      setShowForm(false);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleUpvote = async (postId: string, currentUpvotes: number) => {
    try {
      const { error } = await supabase
        .from('media_posts')
        .update({ upvotes: currentUpvotes + 1 })
        .eq('id', postId);

      if (error) throw error;
      loadPosts();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  const trendingPosts = [...posts].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

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
            <h1 className="text-3xl font-bold mb-2">Community Media</h1>
            <p className="text-gray-400">Articles, reviews, and insights from the community</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'Create Post'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  required
                >
                  {categories.filter(c => c !== 'All').map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white h-40 resize-none"
                  placeholder="Write your article..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Publish Post
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.profiles.avatar_url}
                        alt={post.profiles.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.profiles.username}</span>
                          {post.profiles.badges && post.profiles.badges.includes('Trusted Editor') && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded">
                              <Award size={12} />
                              Trusted Editor
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-purple-600/20 text-purple-400 px-3 py-1 rounded">
                      {post.category}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
                  <p className="text-gray-400 mb-4 line-clamp-3">{post.content}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleUpvote(post.id, post.upvotes)}
                        className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <ThumbsUp size={18} />
                        <span>{post.upvotes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle size={18} />
                        <span>0</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <Share2 size={18} />
                      </button>
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      Read More →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="w-80 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold">Trending Posts</h3>
              </div>
              <div className="space-y-3">
                {trendingPosts.map((post, index) => (
                  <div key={post.id} className="flex gap-3 group cursor-pointer">
                    <span className="text-2xl font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium group-hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{post.upvotes} upvotes</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-400">{post.profiles.username}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
