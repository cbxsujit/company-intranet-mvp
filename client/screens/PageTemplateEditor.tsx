

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, PageTemplate, Space } from '../types';
import { getPageTemplate, addPageTemplate, updatePageTemplate, getSpaces } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface PageTemplateEditorProps {
  currentUser: User;
}

export const PageTemplateEditor: React.FC<PageTemplateEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    templateName: string;
    description: string;
    defaultTitlePrefix: string;
    defaultSummary: string;
    defaultContent: string;
    defaultStatus: 'Draft' | 'Published';
    recommendedSpaceId: string;
    isActive: boolean;
  }>({
    templateName: '',
    description: '',
    defaultTitlePrefix: '',
    defaultSummary: '',
    defaultContent: '',
    defaultStatus: 'Draft',
    recommendedSpaceId: '',
    isActive: true
  });

  useEffect(() => {
    // Only admins for templates
    if (currentUser.role !== 'CompanyAdmin') {
        navigate('/');
        return;
    }

    setSpaces(getSpaces(currentUser.companyId));

    if (isEditMode && id) {
        const template = getPageTemplate(id);
        if (template) {
            if (template.companyId !== currentUser.companyId) {
                navigate('/templates');
                return;
            }
            setFormData({
                templateName: template.templateName,
                description: template.description || '',
                defaultTitlePrefix: template.defaultTitlePrefix || '',
                defaultSummary: template.defaultSummary || '',
                defaultContent: template.defaultContent || '',
                defaultStatus: template.defaultStatus,
                recommendedSpaceId: template.recommendedSpaceId || '',
                isActive: template.isActive
            });
        } else {
            setError('Template not found');
        }
    }
  }, [id, currentUser, navigate, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = {
            ...formData,
            companyId: currentUser.companyId,
            createdBy: currentUser.id
        };

        if (isEditMode && id) {
            await updatePageTemplate({ ...payload, id, createdOn: new Date().toISOString() }); // keeping original date would be better but mock simplifies
            // Fix: In real app, preserve createdOn. Here we re-fetch original to preserve or just let it slide for MVP.
            // Let's quickly try to preserve createdOn if editing.
            const original = getPageTemplate(id);
            if(original) {
                 await updatePageTemplate({ ...original, ...payload });
            }
        } else {
            await addPageTemplate(payload);
        }
        navigate('/templates');
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
        <button onClick={() => navigate('/templates')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Template' : 'Create Template'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <Input 
                label="Template Name" 
                value={formData.templateName} 
                onChange={e => handleChange('templateName', e.target.value)} 
                placeholder="e.g. Monthly Report, Meeting Minutes"
                required
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="What is this template for?"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input 
                    label="Default Title Prefix" 
                    value={formData.defaultTitlePrefix} 
                    onChange={e => handleChange('defaultTitlePrefix', e.target.value)} 
                    placeholder="e.g. 'Meeting: '"
                />
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Status</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.defaultStatus}
                        onChange={e => handleChange('defaultStatus', e.target.value)}
                    >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                    </select>
                </div>
            </div>

            <Input 
                label="Default Summary" 
                value={formData.defaultSummary} 
                onChange={e => handleChange('defaultSummary', e.target.value)} 
                placeholder="Starter summary text..."
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Content (Starter Text)</label>
                <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 font-mono text-sm"
                    value={formData.defaultContent}
                    onChange={e => handleChange('defaultContent', e.target.value)}
                    placeholder="# Heading&#10;&#10;Starter content..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recommended Space (Optional)</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.recommendedSpaceId}
                        onChange={e => handleChange('recommendedSpaceId', e.target.value)}
                    >
                        <option value="">None</option>
                        {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                    </select>
                </div>
                 <div className="flex items-center pt-6">
                    <input 
                        type="checkbox" 
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => handleChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active (Available for use)</label>
                 </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <Button type="button" variant="secondary" onClick={() => navigate('/templates')}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Template</Button>
            </div>
      </form>
    </div>
  );
};