
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Page, Space, RoleType, SpaceRole } from '../types';
import { getPage, addPage, updatePage, getVisibleSpaces, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ChevronLeft } from 'lucide-react';

interface PageEditorProps {
  currentUser: User;
}

export const PageEditor: React.FC<PageEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    pageTitle: string;
    summary: string;
    content: string;
    status: 'Draft' | 'Published';
    spaceId: string;
    headerImageURL: string;
  }>({
    pageTitle: '',
    summary: '',
    content: '',
    status: 'Draft',
    spaceId: '',
    headerImageURL: ''
  });

  useEffect(() => {
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const writableSpaces = fetchedSpaces.filter(s => {
        if (currentUser.role === RoleType.CompanyAdmin) return true;
        const role = getMemberRole(s.id, currentUser.id);
        return role === SpaceRole.SpaceManager;
    });

    setSpaces(writableSpaces);

    if (isEditMode && id) {
        const page = getPage(id);
        if (page) {
            if (page.companyId !== currentUser.companyId) {
                navigate('/pages');
                return;
            }
            const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;
            if (!canEdit) {
                 setError('You do not have permission to edit pages in this space.');
            }

            setFormData({
                pageTitle: page.pageTitle,
                summary: page.summary || '',
                content: page.content,
                status: page.status,
                spaceId: page.spaceId,
                headerImageURL: page.headerImageURL || ''
            });
        } else {
            setError('Page not found');
        }
    } else if (writableSpaces.length > 0) {
        setFormData(prev => ({ ...prev, spaceId: writableSpaces[0].id }));
    }
  }, [id, currentUser.companyId, currentUser.id, navigate, isEditMode, currentUser.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.spaceId) {
        setError('Please select a space');
        return;
    }

    setLoading(true);
    try {
        if (isEditMode && id) {
            await updatePage({ ...formData, id }, currentUser.id);
            navigate(`/pages/${id}`);
        } else {
            const newPage = await addPage({
                ...formData,
                companyId: currentUser.companyId,
                createdBy: currentUser.id,
                updatedBy: currentUser.id
            });
            navigate(`/pages/${newPage.id}`);
        }
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (spaces.length === 0 && !isEditMode && !loading) {
      return (
          <div className="text-center py-12">
              <h2 className="text-xl font-bold text-slate-700">No Access</h2>
              <p className="text-slate-500">You must be a Space Manager for at least one space to create pages.</p>
              <Button className="mt-4" onClick={() => navigate('/pages')}>Back to Pages</Button>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Page' : 'Create New Page'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
             {/* Vertical Stack on Mobile, 2-Col on MD+ */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Space</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.spaceId}
                        onChange={e => handleChange('spaceId', e.target.value)}
                        required
                        disabled={isEditMode} 
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
                placeholder="Enter a descriptive title"
                required
             />

             <ImageUpload 
                label="Header Image (Optional)"
                value={formData.headerImageURL}
                onChange={(url) => handleChange('headerImageURL', url)}
             />

             <Input 
                label="Summary (Optional)" 
                value={formData.summary} 
                onChange={e => handleChange('summary', e.target.value)} 
                placeholder="Brief description of the content"
             />

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                    value={formData.content}
                    onChange={e => handleChange('content', e.target.value)}
                    placeholder="Type your content here..."
                />
             </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
             <Button type="button" variant="secondary" onClick={() => navigate('/pages')} className="w-full sm:w-auto">Cancel</Button>
             <Button type="submit" isLoading={loading} disabled={!!error && error !== 'Page not found'} className="w-full sm:w-auto">Save Page</Button>
        </div>
      </form>
    </div>
  );
};
