import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { User, PageWidget, WidgetType, RoleType, SpaceRole } from '../types';
import { getPageWidget, addPageWidget, updatePageWidget, getPage, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface PageWidgetEditorProps {
  currentUser: User;
}

export const PageWidgetEditor: React.FC<PageWidgetEditorProps> = ({ currentUser }) => {
  const { pageId, widgetId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!widgetId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  const [formData, setFormData] = useState<{
    widgetTitle: string;
    widgetType: WidgetType;
    embedURL: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    widgetTitle: '',
    widgetType: WidgetType.EmbedFrame,
    embedURL: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    // 1. Verify Page existence and permissions
    if (!pageId) {
        navigate('/pages');
        return;
    }

    const page = getPage(pageId);
    if (!page) {
        navigate('/pages');
        return;
    }
    setPageTitle(page.pageTitle);

    const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;
    if (!canEdit) {
        navigate(`/pages/${pageId}`);
        return;
    }

    // 2. Load Widget Data if editing
    if (isEditMode && widgetId) {
        const widget = getPageWidget(widgetId);
        if (widget) {
            setFormData({
                widgetTitle: widget.widgetTitle,
                widgetType: widget.widgetType,
                embedURL: widget.embedURL,
                description: widget.description || '',
                displayOrder: widget.displayOrder || 0,
                isActive: widget.isActive
            });
        } else {
            setError('Widget not found');
        }
    }
  }, [pageId, widgetId, currentUser, navigate, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) return;

    setLoading(true);
    try {
        if (isEditMode && widgetId) {
            await updatePageWidget({ ...formData, id: widgetId }, currentUser.id);
        } else {
            await addPageWidget({
                ...formData,
                pageId,
                companyId: currentUser.companyId,
                createdBy: currentUser.id
            });
        }
        navigate(`/pages/${pageId}`);
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
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Widget' : 'Add Dashboard/Embed Widget'}</h1>
            <p className="text-sm text-slate-500">for Page: {pageTitle}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
             <Input 
                label="Widget Title" 
                value={formData.widgetTitle} 
                onChange={e => handleChange('widgetTitle', e.target.value)} 
                placeholder="e.g. Sales Dashboard Q3"
                required
             />

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Widget Type</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-500 cursor-not-allowed"
                    value={formData.widgetType}
                    disabled
                >
                    <option value={WidgetType.EmbedFrame}>Embed Frame</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Currently only embed frames are supported.</p>
             </div>

             <Input 
                label="Embed URL" 
                value={formData.embedURL} 
                onChange={e => handleChange('embedURL', e.target.value)} 
                placeholder="https://docs.google.com/spreadsheets/d/..."
                required
             />

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                    className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="Short description of what this dashboard shows."
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
                    <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active (Visible)</label>
                 </div>
             </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <Button type="button" variant="secondary" onClick={() => navigate(`/pages/${pageId}`)}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Widget</Button>
            </div>
      </form>
    </div>
  );
};