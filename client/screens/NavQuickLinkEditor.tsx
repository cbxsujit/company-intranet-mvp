
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, NavQuickLink, NavTargetType, Page, Space } from '../types';
import { getNavQuickLink, addNavQuickLink, updateNavQuickLink, getPages, getSpaces } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface NavQuickLinkEditorProps {
  currentUser: User;
}

export const NavQuickLinkEditor: React.FC<NavQuickLinkEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pages, setPages] = useState<Page[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);

  const [formData, setFormData] = useState<{
    label: string;
    targetType: NavTargetType;
    targetURL: string;
    pageId: string;
    spaceId: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    label: '',
    targetType: NavTargetType.ExternalURL,
    targetURL: '',
    pageId: '',
    spaceId: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    // Load pages and spaces for dropdowns
    setPages(getPages(currentUser.companyId));
    setSpaces(getSpaces(currentUser.companyId));

    if (isEditMode && id) {
        const link = getNavQuickLink(id);
        if (link) {
            if (link.companyId !== currentUser.companyId) {
                navigate('/settings');
                return;
            }
            setFormData({
                label: link.label,
                targetType: link.targetType,
                targetURL: link.targetURL || '',
                pageId: link.pageId || '',
                spaceId: link.spaceId || '',
                displayOrder: link.displayOrder || 0,
                isActive: link.isActive
            });
        } else {
            setError('Link not found');
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
            // Clean up optional fields based on type
            targetURL: (formData.targetType === NavTargetType.ExternalURL || formData.targetType === NavTargetType.Other) ? formData.targetURL : undefined,
            pageId: formData.targetType === NavTargetType.Page ? formData.pageId : undefined,
            spaceId: formData.targetType === NavTargetType.Space ? formData.spaceId : undefined
        };

        if (isEditMode && id) {
            await updateNavQuickLink({ ...payload, id });
        } else {
            await addNavQuickLink(payload);
        }
        navigate('/settings');
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
        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Quick Link' : 'Add Quick Link'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <Input 
                label="Label" 
                value={formData.label} 
                onChange={e => handleChange('label', e.target.value)} 
                placeholder="e.g. Employee Handbook"
                required
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Type</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.targetType}
                    onChange={e => handleChange('targetType', e.target.value as any)}
                >
                    <option value={NavTargetType.ExternalURL}>External URL</option>
                    <option value={NavTargetType.Page}>Internal Page</option>
                    <option value={NavTargetType.Space}>Internal Space</option>
                    <option value={NavTargetType.Documents}>Documents List</option>
                    <option value={NavTargetType.Announcements}>Announcements List</option>
                    <option value={NavTargetType.Other}>Other (Custom URL)</option>
                </select>
            </div>

            {(formData.targetType === NavTargetType.ExternalURL || formData.targetType === NavTargetType.Other) && (
                <Input 
                    label="URL" 
                    value={formData.targetURL} 
                    onChange={e => handleChange('targetURL', e.target.value)} 
                    placeholder="https://..."
                    required
                />
            )}

            {formData.targetType === NavTargetType.Page && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Page</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.pageId}
                        onChange={e => handleChange('pageId', e.target.value)}
                        required
                    >
                        <option value="" disabled>Choose a page</option>
                        {pages.map(p => <option key={p.id} value={p.id}>{p.pageTitle}</option>)}
                    </select>
                </div>
            )}

            {formData.targetType === NavTargetType.Space && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Space</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.spaceId}
                        onChange={e => handleChange('spaceId', e.target.value)}
                        required
                    >
                        <option value="" disabled>Choose a space</option>
                        {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                    </select>
                </div>
            )}

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
                 <Button type="button" variant="secondary" onClick={() => navigate('/settings')}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Link</Button>
            </div>
      </form>
    </div>
  );
};
