
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, KnowledgeCategory } from '../types';
import { getKnowledgeCategory, addKnowledgeCategory, updateKnowledgeCategory } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface KnowledgeCategoryEditorProps {
  currentUser: User;
}

export const KnowledgeCategoryEditor: React.FC<KnowledgeCategoryEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    if (currentUser.role !== 'CompanyAdmin') {
      navigate('/help');
      return;
    }

    if (isEditMode && id) {
      const category = getKnowledgeCategory(id);
      if (category) {
        if (category.companyId !== currentUser.companyId) {
          navigate('/admin/knowledge-categories');
          return;
        }
        setFormData({
          name: category.name,
          description: category.description || '',
          displayOrder: category.displayOrder || 0,
          isActive: category.isActive
        });
      } else {
        setError('Category not found');
      }
    }
  }, [id, currentUser, navigate, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        companyId: currentUser.companyId
      };

      if (isEditMode && id) {
        const original = getKnowledgeCategory(id);
        if (original) {
            await updateKnowledgeCategory({ ...original, ...payload });
        }
      } else {
        await addKnowledgeCategory(payload);
      }
      navigate('/admin/knowledge-categories');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/knowledge-categories')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Category' : 'Add Category'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <Input 
          label="Category Name" 
          value={formData.name} 
          onChange={e => handleChange('name', e.target.value)} 
          placeholder="e.g. HR Policies, IT Support"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="What kind of articles go here?"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.displayOrder}
              onChange={e => handleChange('displayOrder', parseInt(e.target.value))}
              min="0"
            />
          </div>
          <div className="flex-1 flex items-center pt-6">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={e => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/knowledge-categories')}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save Category</Button>
        </div>
      </form>
    </div>
  );
};
