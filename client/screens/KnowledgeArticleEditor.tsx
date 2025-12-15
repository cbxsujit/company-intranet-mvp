
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, KnowledgeArticle, KnowledgeCategory, Space, Page } from '../types';
import { getKnowledgeArticle, addKnowledgeArticle, updateKnowledgeArticle, getKnowledgeCategories, getSpaces, getPages } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface KnowledgeArticleEditorProps {
  currentUser: User;
}

export const KnowledgeArticleEditor: React.FC<KnowledgeArticleEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  const [formData, setFormData] = useState<{
    categoryId: string;
    title: string;
    question: string;
    answer: string;
    relatedSpaceId: string;
    relatedPageId: string;
    tags: string;
    isActive: boolean;
    isFeatured: boolean;
  }>({
    categoryId: '',
    title: '',
    question: '',
    answer: '',
    relatedSpaceId: '',
    relatedPageId: '',
    tags: '',
    isActive: true,
    isFeatured: false
  });

  useEffect(() => {
    // Check perms: Admin or content owner (for now admin only based on previous prompt)
    if (currentUser.role !== 'CompanyAdmin') {
      navigate('/help');
      return;
    }

    // Load dropdown data
    setCategories(getKnowledgeCategories(currentUser.companyId).filter(c => c.isActive));
    setSpaces(getSpaces(currentUser.companyId));
    setPages(getPages(currentUser.companyId));

    if (isEditMode && id) {
      const article = getKnowledgeArticle(id);
      if (article) {
        if (article.companyId !== currentUser.companyId) {
          navigate('/admin/knowledge-articles');
          return;
        }
        setFormData({
          categoryId: article.categoryId,
          title: article.title,
          question: article.question || '',
          answer: article.answer,
          relatedSpaceId: article.relatedSpaceId || '',
          relatedPageId: article.relatedPageId || '',
          tags: article.tags || '',
          isActive: article.isActive,
          isFeatured: article.isFeatured
        });
      } else {
        setError('Article not found');
      }
    }
  }, [id, currentUser, navigate, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
        setError('Please select a category');
        return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        // Clean up empty strings for optional relations
        relatedSpaceId: formData.relatedSpaceId || undefined,
        relatedPageId: formData.relatedPageId || undefined,
        question: formData.question || undefined,
      };

      if (isEditMode && id) {
        const original = getKnowledgeArticle(id);
        if (original) {
            await updateKnowledgeArticle({ ...original, ...payload });
        }
      } else {
        await addKnowledgeArticle(payload);
      }
      navigate('/admin/knowledge-articles');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/knowledge-articles')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Article' : 'Create Article'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoryId}
                    onChange={e => handleChange('categoryId', e.target.value)}
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <Input 
                label="Title" 
                value={formData.title} 
                onChange={e => handleChange('title', e.target.value)} 
                placeholder="Article Title"
                required
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Question (FAQ Style)</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            value={formData.question}
            onChange={e => handleChange('question', e.target.value)}
            placeholder="e.g. How do I request time off?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
            value={formData.answer}
            onChange={e => handleChange('answer', e.target.value)}
            placeholder="Provide the detailed answer here..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Related Space</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.relatedSpaceId}
                    onChange={e => handleChange('relatedSpaceId', e.target.value)}
                >
                    <option value="">None</option>
                    {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Related Page</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.relatedPageId}
                    onChange={e => handleChange('relatedPageId', e.target.value)}
                >
                    <option value="">None</option>
                    {pages.map(p => <option key={p.id} value={p.id}>{p.pageTitle}</option>)}
                </select>
            </div>
        </div>

        <Input 
            label="Tags (comma separated)" 
            value={formData.tags} 
            onChange={e => handleChange('tags', e.target.value)} 
            placeholder="e.g. hr, policy, leave"
        />

        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <input 
                type="checkbox" 
                id="isActive"
                checked={formData.isActive}
                onChange={e => handleChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active (Visible)</label>
            </div>
            <div className="flex items-center gap-2">
                <input 
                type="checkbox" 
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={e => handleChange('isFeatured', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="text-sm text-slate-700 font-medium">Featured Article</label>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/knowledge-articles')}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save Article</Button>
        </div>
      </form>
    </div>
  );
};
