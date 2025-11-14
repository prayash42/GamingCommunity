import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, ExternalLink, Edit2, Save, X, Youtube, Instagram, Twitter, Linkedin, FileText, Image as ImageIcon, Link as LinkIcon, Upload } from 'lucide-react';
import { uploadPortfolioFile, deletePortfolioFile } from '../lib/storage';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  tags: string[];
  created_at: string;
}

interface ProfileProps {
  onBack: () => void;
}

export default function Profile({ onBack }: ProfileProps) {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  const [profileData, setProfileData] = useState({
    bio: profile?.bio || '',
    youtube: '',
    instagram: '',
    twitter: '',
    linkedin: '',
  });

  const [portfolioFormData, setPortfolioFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    file_url: '',
    file_type: '' as string,
    file_name: '',
    tags: [] as string[],
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingFileType, setEditingFileType] = useState<'image' | 'pdf' | 'link' | null>(null);

  const portfolioTags = ['Game Dev', 'Art', 'Music', 'Design', 'Code', 'Writing', 'Animation', '3D'];

  useEffect(() => {
    loadPortfolioItems();
  }, [user]);

  const loadPortfolioItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolioItems(data || []);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: profileData.bio,
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const socialMediaIcons = [
    { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-500 hover:text-red-400' },
    { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500 hover:text-pink-400' },
    { key: 'twitter', icon: Twitter, label: 'Twitter', color: 'text-blue-400 hover:text-blue-300' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600 hover:text-blue-500' },
  ];

  const openSocialLink = (key: string) => {
    const url = profileData[key as keyof typeof profileData];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('portfolio_items')
          .update(portfolioFormData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_items')
          .insert([
            {
              ...portfolioFormData,
              user_id: user.id,
            },
          ]);

        if (error) throw error;
      }

      setPortfolioFormData({ title: '', description: '', image_url: '', tags: [] });
      setEditingItem(null);
      setShowPortfolioForm(false);
      loadPortfolioItems();
    } catch (error) {
      console.error('Error saving portfolio item:', error);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPortfolioItems();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
    }
  };

  const togglePortfolioTag = (tag: string) => {
    setPortfolioFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setPortfolioFormData({
      title: item.title,
      description: item.description,
      image_url: item.image_url || '',
      file_url: item.file_url || '',
      file_type: item.file_type || '',
      file_name: item.file_name || '',
      tags: item.tags,
    });
    setShowPortfolioForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingFile(true);
    try {
      const { url, fileName } = await uploadPortfolioFile(file, user.id);
      setPortfolioFormData({
        ...portfolioFormData,
        file_url: url,
        file_type: fileType,
        file_name: fileName,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter the external link URL:');
    if (url) {
      setPortfolioFormData({
        ...portfolioFormData,
        file_url: url,
        file_type: 'link',
        file_name: url,
      });
    }
  };

  const handleClearFile = async () => {
    if (portfolioFormData.file_name && portfolioFormData.file_type !== 'link' && user) {
      try {
        await deletePortfolioFile(user.id, portfolioFormData.file_name);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    setPortfolioFormData({
      ...portfolioFormData,
      file_url: '',
      file_type: '',
      file_name: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8">
          <div className="flex items-start gap-6 mb-6">
            <img
              src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="Profile"
              className="w-24 h-24 rounded-full ring-2 ring-blue-500/50"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile?.username || 'User'}</h1>
              {profile?.badges && profile.badges.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge}
                      className="text-xs bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (isEditing) {
                  handleProfileUpdate();
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? (
                <>
                  <Save size={18} />
                  Save
                </>
              ) : (
                <>
                  <Edit2 size={18} />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white resize-none h-24"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-300">{profileData.bio || 'No bio added yet'}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Social Media</h3>
            <div className="flex items-center gap-2 mb-4">
              {socialMediaIcons.map(({ key, icon: Icon, label, color }) => (
                <div key={key} className="relative group">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        const url = prompt(`Enter your ${label} URL:`);
                        if (url) {
                          setProfileData({ ...profileData, [key]: url });
                        }
                      } else if (profileData[key as keyof typeof profileData]) {
                        openSocialLink(key);
                      }
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      isEditing
                        ? 'bg-gray-900 cursor-pointer'
                        : profileData[key as keyof typeof profileData]
                        ? 'cursor-pointer'
                        : 'opacity-50 cursor-default'
                    } ${color}`}
                    title={label}
                  >
                    <Icon size={24} />
                  </button>
                  {isEditing && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Click to edit
                    </div>
                  )}
                  {profileData[key as keyof typeof profileData] && !isEditing && (
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Click to open
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Portfolio</h2>
            {!showPortfolioForm && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setPortfolioFormData({ title: '', description: '', image_url: '', file_url: '', file_type: '', file_name: '', tags: [] });
                  setShowPortfolioForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Add Item
              </button>
            )}
          </div>

          {showPortfolioForm && (
            <form onSubmit={handlePortfolioSubmit} className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowPortfolioForm(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={portfolioFormData.title}
                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="Project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={portfolioFormData.description}
                    onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white resize-none h-24"
                    placeholder="Describe your work..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work Sample</label>
                  {portfolioFormData.file_url ? (
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {portfolioFormData.file_type === 'image' && <ImageIcon className="text-blue-400" size={20} />}
                          {portfolioFormData.file_type === 'pdf' && <FileText className="text-red-400" size={20} />}
                          {portfolioFormData.file_type === 'link' && <LinkIcon className="text-green-400" size={20} />}
                          <span className="text-sm text-gray-300">{portfolioFormData.file_name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {portfolioFormData.file_type === 'image' && (
                        <img
                          src={portfolioFormData.file_url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      {portfolioFormData.file_type === 'link' && (
                        <a
                          href={portfolioFormData.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 break-all text-sm"
                        >
                          {portfolioFormData.file_url}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                          <ImageIcon size={20} className="text-blue-400 mb-1" />
                          <span className="text-xs text-gray-300 text-center">Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            className="hidden"
                            disabled={uploadingFile}
                          />
                        </label>
                      </div>
                      <div>
                        <label className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                          <FileText size={20} className="text-red-400 mb-1" />
                          <span className="text-xs text-gray-300 text-center">PDF</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, 'pdf')}
                            className="hidden"
                            disabled={uploadingFile}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
                      >
                        <LinkIcon size={20} className="text-green-400 mb-1" />
                        <span className="text-xs text-gray-300 text-center">Link</span>
                      </button>
                    </div>
                  )}
                  {uploadingFile && (
                    <p className="text-sm text-gray-400 mt-2">Uploading...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {portfolioTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => togglePortfolioTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          portfolioFormData.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPortfolioForm(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}

                {item.file_url && (
                  <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2">
                      {item.file_type === 'image' && <ImageIcon className="text-blue-400" size={18} />}
                      {item.file_type === 'pdf' && <FileText className="text-red-400" size={18} />}
                      {item.file_type === 'link' && <LinkIcon className="text-green-400" size={18} />}
                      <span className="text-xs text-gray-300 truncate flex-1">{item.file_name}</span>
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}

                <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 py-2 px-3 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePortfolioItem(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 text-red-400 py-2 px-3 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {portfolioItems.length === 0 && !showPortfolioForm && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No portfolio items yet</p>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setPortfolioFormData({ title: '', description: '', image_url: '', file_url: '', file_type: '', file_name: '', tags: [] });
                  setShowPortfolioForm(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Create Your First Portfolio Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
