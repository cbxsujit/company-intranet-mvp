
import React, { useState, useEffect } from 'react';
import { User, KnowledgeArticle, KnowledgeCategory } from '../types';
import { getKnowledgeArticles, getKnowledgeCategories, updateKnowledgeArticle, getUserById } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Ban, Search, Filter } from 'lucide-react';

interface KnowledgeArticleManagementProps {
  currentUser: User;
}

export const KnowledgeArticleManagement: React.FC<KnowledgeArticleManagementProps> = ({ currentUser }) => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const cats = getKnowledgeCategories(currentUser.companyId);
    setCategories(cats);
    
    const cMap: Record<string, string> = {};
    cats.forEach(c => cMap[c.id] = c.name);
    setCategoryMap(cMap);

    const arts = getKnowledgeArticles(currentUser.companyId);
    setArticles(arts);

    const uMap: Record<string, string> = {};
    arts.forEach(a => {
        if (!uMap[a.createdBy]) {
            const u = getUserById(a.createdBy);
            if(u) uMap[a.createdBy] = u.fullName;
        }
    });
    setUserMap(uMap);

  }, [currentUser.companyId]);

  const handleDisable = async (article: KnowledgeArticle) => {
    if(!window.confirm('Disable this article?')) return;
    await updateKnowledgeArticle({ ...article, isActive: false });
    // simplistic refresh:
    const arts = getKnowledgeArticles(currentUser.companyId);
    setArticles(arts);
  };

  const filteredArticles = articles.filter(a => {
      if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!a.title.toLowerCase().includes(q) && !a.tags?.toLowerCase().includes(q)) return false;
      }
      if (selectedCategory && a.categoryId !== selectedCategory) return false;
      if (selectedStatus) {
          const isActive = selectedStatus === 'active';
          if (a.isActive !== isActive) return false;
      }
      return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Articles</h1>
          <p className="text-sm text-slate-500">Manage FAQs and help content.</p>
        </div>
        <Link to="/admin/knowledge-articles/new">
          <Button>
            <Plus size={18} /> Add Article
          </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search title or tags..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Title</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Featured</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Created By</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map(art => (
                <tr key={art.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{art.title}</td>
                  <td className="px-6 py-4 text-slate-600">{categoryMap[art.categoryId] || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${art.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {art.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      {art.isFeatured && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Featured</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {userMap[art.createdBy] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/knowledge-articles/${art.id}/edit`}>
                        <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                          <Edit2 size={16} />
                        </button>
                      </Link>
                      {art.isActive && (
                        <button onClick={() => handleDisable(art)} className="p-1 text-slate-400 hover:text-red-600" title="Disable">
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredArticles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No articles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
