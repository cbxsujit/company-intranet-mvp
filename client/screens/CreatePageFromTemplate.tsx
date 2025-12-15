

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, PageTemplate, Space, RoleType, SpaceRole } from '../types';
import { getPageTemplates, getVisibleSpaces, getMemberRole, addPage } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, FileText } from 'lucide-react';

interface CreatePageFromTemplateProps {
  currentUser: User;
}

export const CreatePageFromTemplate: React.FC<CreatePageFromTemplateProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedSpaceId = searchParams.get('spaceId');

  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);

  const [formData, setFormData] = useState<{
    pageTitle: string;
    summary: string;
    content: string;
    status: 'Draft' | 'Published';
    spaceId: string;
  }>({
    pageTitle: '',
    summary: '',
    content: '',
    status: 'Draft',
    spaceId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch active templates
    const allTemplates = getPageTemplates(currentUser.companyId);
    setTemplates(allTemplates.filter(t => t.isActive));

    // 2. Fetch writable spaces
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const writableSpaces = fetchedSpaces.filter(s => {
        if (currentUser.role === RoleType.CompanyAdmin) return true;
        const role = getMemberRole(s.id, currentUser.id);
        return role === SpaceRole.SpaceManager;
    });
    setSpaces(writableSpaces);

    if (preSelectedSpaceId && writableSpaces.find(s => s.id === preSelectedSpaceId)) {
        setFormData(prev => ({ ...prev, spaceId: preSelectedSpaceId }));
    } else if (writableSpaces.length > 0) {
        // Don't auto-set yet, wait for template recommendation, but fallback to first if needed later
    }

  }, [currentUser]);

  const handleTemplateSelect = (template: PageTemplate) => {
      setSelectedTemplate(template);
      
      // Determine Space
      let spaceIdToUse = formData.spaceId;
      if (!spaceIdToUse && template.recommendedSpaceId) {
          // Check if user has access to recommended space
          if (spaces.find(s => s.id === template.recommendedSpaceId)) {
              spaceIdToUse = template.recommendedSpaceId;
          }
      }
      // Fallback to first available if still empty
      if (!spaceIdToUse && spaces.length > 0) {
          spaceIdToUse = spaces[0].id;
      }

      setFormData({
          pageTitle: template.defaultTitlePrefix || '',
          summary: template.defaultSummary || '',
          content: template.defaultContent || '',
          status: template.defaultStatus,
          spaceId: spaceIdToUse
      });
      
      setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.spaceId) {
        setError('Please select a space');
        return;
    }
    setLoading(true);
    try {
        const newPage = await addPage({
            ...formData,
            companyId: currentUser.companyId,
            createdBy: currentUser.id,
            updatedBy: currentUser.id
        });
        navigate(`/pages/${newPage.id}`);
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => {
            if(step === 2) setStep(1);
            else navigate('/pages');
        }} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Create Page from Template</h1>
      </div>

      {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tpl => (
                  <div 
                    key={tpl.id} 
                    onClick={() => handleTemplateSelect(tpl)}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group"
                  >
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                              <FileText size={24} />
                          </div>
                          <h3 className="font-bold text-slate-900">{tpl.templateName}</h3>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-4">{tpl.description}</p>
                      <div className="text-xs text-slate-400">
                          Default Status: <span className="font-medium text-slate-600">{tpl.defaultStatus}</span>
                      </div>
                  </div>
              ))}
              {templates.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                      No active templates found. 
                      <Button variant="ghost" onClick={() => navigate('/pages/new')} className="ml-2">Create Blank Page</Button>
                  </div>
              )}
          </div>
      )}

      {step === 2 && selectedTemplate && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Space</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.spaceId}
                            onChange={e => handleChange('spaceId', e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a space</option>
                            {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.status}
                            onChange={e => handleChange('status', e.target.value as any)}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                        </select>
                    </div>
                </div>

                <Input 
                    label="Page Title" 
                    value={formData.pageTitle} 
                    onChange={e => handleChange('pageTitle', e.target.value)} 
                    placeholder="Enter page title"
                    required
                    autoFocus
                />

                <Input 
                    label="Summary" 
                    value={formData.summary} 
                    onChange={e => handleChange('summary', e.target.value)} 
                    placeholder="Brief description"
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                    <textarea
                        className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                        value={formData.content}
                        onChange={e => handleChange('content', e.target.value)}
                        placeholder="Page content..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back to Templates</Button>
                <Button type="submit" isLoading={loading}>Create Page</Button>
            </div>
          </form>
      )}
    </div>
  );
};