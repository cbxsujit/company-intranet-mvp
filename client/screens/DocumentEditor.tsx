
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { User, DocumentItem, DocumentType, Space, Page, RoleType, SpaceRole, DocumentImportance } from '../types';
import { getDocument, addDocument, updateDocument, getVisibleSpaces, getPages, getMemberRole, getUsers } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ChevronLeft } from 'lucide-react';

interface DocumentEditorProps {
  currentUser: User;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    itemType: DocumentType;
    fileURL: string;
    externalURL: string;
    spaceId: string;
    pageId: string;
    tags: string;
    isActive: boolean;
    isPolicy: boolean;
    expiryDate: string;
    ownerUserId: string;
    importanceLevel: DocumentImportance;
    previewImageURL: string;
  }>({
    title: '',
    description: '',
    itemType: DocumentType.FileLink,
    fileURL: '',
    externalURL: '',
    spaceId: searchParams.get('spaceId') || '',
    pageId: searchParams.get('pageId') || '',
    tags: '',
    isActive: true,
    isPolicy: false,
    expiryDate: '',
    ownerUserId: '',
    importanceLevel: DocumentImportance.Medium,
    previewImageURL: ''
  });

  useEffect(() => {
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const writableSpaces = fetchedSpaces.filter(s => {
        if (currentUser.role === RoleType.CompanyAdmin) return true;
        const role = getMemberRole(s.id, currentUser.id);
        return role === SpaceRole.SpaceManager;
    });
    setSpaces(writableSpaces);
    
    setUsers(getUsers(currentUser.companyId));

    if (isEditMode && id) {
        const doc = getDocument(id);
        if (doc) {
            if (doc.companyId !== currentUser.companyId) {
                navigate('/documents');
                return;
            }
             const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(doc.spaceId, currentUser.id) === SpaceRole.SpaceManager;
            if (!canEdit) {
                 setError('You do not have permission to edit documents in this space.');
            }

            setFormData({
                title: doc.title,
                description: doc.description || '',
                itemType: doc.itemType,
                fileURL: doc.fileURL || '',
                externalURL: doc.externalURL || '',
                spaceId: doc.spaceId,
                pageId: doc.pageId || '',
                tags: doc.tags || '',
                isActive: doc.isActive,
                isPolicy: doc.isPolicy || false,
                expiryDate: doc.expiryDate || '',
                ownerUserId: doc.ownerUserId || '',
                importanceLevel: doc.importanceLevel || DocumentImportance.Medium,
                previewImageURL: doc.previewImageURL || ''
            });
        } else {
            setError('Document not found');
        }
    } else if (writableSpaces.length > 0 && !formData.spaceId) {
         setFormData(prev => ({ ...prev, spaceId: writableSpaces[0].id }));
    }
  }, [id, currentUser.companyId, currentUser.id, navigate, isEditMode, currentUser.role]);

  useEffect(() => {
      if (formData.spaceId) {
          const allPages = getPages(currentUser.companyId);
          setPages(allPages.filter(p => p.spaceId === formData.spaceId));
      } else {
          setPages([]);
      }
  }, [formData.spaceId, currentUser.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.spaceId) {
        setError('Please select a space');
        return;
    }

    setLoading(true);
    try {
        const payload = {
            ...formData,
            companyId: currentUser.companyId,
            createdBy: currentUser.id,
            // clean optional refs
            pageId: formData.pageId || undefined,
            expiryDate: formData.expiryDate || undefined,
            ownerUserId: formData.ownerUserId || undefined
        };

        if (isEditMode && id) {
            await updateDocument({ ...payload, id, updatedBy: currentUser.id });
        } else {
            await addDocument(payload);
        }
        navigate('/documents');
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
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Document' : 'Add Document'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <Input 
                label="Document Title" 
                value={formData.title} 
                onChange={e => handleChange('title', e.target.value)} 
                placeholder="e.g. Q3 Financial Report"
                required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.itemType}
                        onChange={e => handleChange('itemType', e.target.value as DocumentType)}
                    >
                        <option value={DocumentType.FileLink}>File Link (Drive/SharePoint)</option>
                        <option value={DocumentType.ExternalLink}>External URL</option>
                        <option value={DocumentType.Embed}>Embed / Iframe</option>
                        <option value={DocumentType.InternalNote}>Internal Note</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Importance</label>
                     <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.importanceLevel}
                        onChange={e => handleChange('importanceLevel', e.target.value as DocumentImportance)}
                     >
                        {Object.values(DocumentImportance).map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                </div>
            </div>

            {formData.itemType === DocumentType.FileLink && (
                <Input 
                    label="File URL" 
                    value={formData.fileURL} 
                    onChange={e => handleChange('fileURL', e.target.value)} 
                    placeholder="https://drive.google.com/..."
                />
            )}

            {formData.itemType === DocumentType.ExternalLink && (
                <Input 
                    label="External Link" 
                    value={formData.externalURL} 
                    onChange={e => handleChange('externalURL', e.target.value)} 
                    placeholder="https://example.com/..."
                />
            )}

            {formData.itemType === DocumentType.Embed && (
                <div className="space-y-2">
                    <Input 
                        label="Embed URL (Source)" 
                        value={formData.externalURL} 
                        onChange={e => handleChange('externalURL', e.target.value)} 
                        placeholder="https://docs.google.com/presentation/d/.../embed?..."
                        required
                    />
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        Paste the embed code source URL (src) here. For Google Docs/Slides, use 'File &gt; Share &gt; Publish to web &gt; Embed'.
                    </p>
                </div>
            )}

            <ImageUpload 
                label="Preview Image (Optional)"
                value={formData.previewImageURL}
                onChange={(url) => handleChange('previewImageURL', url)}
            />

            <Input 
                label="Description (Optional)" 
                value={formData.description} 
                onChange={e => handleChange('description', e.target.value)} 
            />

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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Related Page (Optional)</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.pageId}
                        onChange={e => handleChange('pageId', e.target.value)}
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
                placeholder="hr, policy, finance"
            />

            <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Policy & Tracking Settings</h4>
                <div className="flex flex-col gap-3">
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isPolicy"
                            checked={formData.isPolicy}
                            onChange={e => handleChange('isPolicy', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPolicy" className="text-sm text-slate-700 font-medium">Mark as Policy (Track Read Acknowledgement)</label>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                             <input 
                                type="date"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.expiryDate}
                                onChange={e => handleChange('expiryDate', e.target.value)}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Document Owner</label>
                             <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.ownerUserId}
                                onChange={e => handleChange('ownerUserId', e.target.value)}
                             >
                                <option value="">None</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                             </select>
                         </div>
                     </div>
                </div>
            </div>

            <div className="flex items-center pt-4 border-t border-slate-100">
                 <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => handleChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                 />
                 <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active (Visible to users)</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <Button type="button" variant="secondary" onClick={() => navigate('/documents')}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Document</Button>
            </div>
      </form>
    </div>
  );
};
