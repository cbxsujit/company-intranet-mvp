
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, AnnouncementAudience, Space, RoleType, SpaceRole } from '../types';
import { getAnnouncement, addAnnouncement, updateAnnouncement, getVisibleSpaces, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ChevronLeft } from 'lucide-react';

interface AnnouncementEditorProps {
  currentUser: User;
}

export const AnnouncementEditor: React.FC<AnnouncementEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    audienceType: AnnouncementAudience;
    spaceId: string;
    isPinned: boolean;
    isActive: boolean;
    announcementImageURL: string;
  }>({
    title: '',
    message: '',
    audienceType: AnnouncementAudience.CompanyWide,
    spaceId: '',
    isPinned: false,
    isActive: true,
    announcementImageURL: ''
  });

  useEffect(() => {
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const manageableSpaces = fetchedSpaces.filter(s => {
         if (currentUser.role === RoleType.CompanyAdmin) return true;
         return getMemberRole(s.id, currentUser.id) === SpaceRole.SpaceManager;
    });

    setSpaces(manageableSpaces);

    if (isEditMode && id) {
        const ann = getAnnouncement(id);
        if (ann) {
            if (ann.companyId !== currentUser.companyId) {
                navigate('/announcements');
                return;
            }
            setFormData({
                title: ann.title,
                message: ann.message,
                audienceType: ann.audienceType,
                spaceId: ann.spaceId || '',
                isPinned: ann.isPinned,
                isActive: ann.isActive,
                announcementImageURL: ann.announcementImageURL || ''
            });
        } else {
            setError('Announcement not found');
        }
    }
  }, [id, currentUser.companyId, currentUser.id, navigate, isEditMode, currentUser.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.audienceType === AnnouncementAudience.SpaceSpecific && !formData.spaceId) {
        setError('Please select a space for space-specific announcements.');
        return;
    }

    setLoading(true);
    try {
        const payload = {
            ...formData,
            spaceId: formData.audienceType === AnnouncementAudience.CompanyWide ? undefined : formData.spaceId
        };

        if (isEditMode && id) {
            await updateAnnouncement({ ...payload, id });
        } else {
            await addAnnouncement({
                ...payload,
                companyId: currentUser.companyId,
                createdBy: currentUser.id
            });
        }
        navigate('/announcements');
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
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Announcement' : 'Create Announcement'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
             <Input 
                label="Title" 
                value={formData.title} 
                onChange={e => handleChange('title', e.target.value)} 
                placeholder="e.g. New Office Policy"
                required
             />

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                    className="w-full h-40 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.message}
                    onChange={e => handleChange('message', e.target.value)}
                    placeholder="Write your announcement here..."
                    required
                />
             </div>

             <ImageUpload 
                label="Announcement Image (Optional)"
                value={formData.announcementImageURL}
                onChange={(url) => handleChange('announcementImageURL', url)}
             />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Audience Type</label>
                    <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.audienceType}
                        onChange={e => handleChange('audienceType', e.target.value as any)}
                    >
                        <option value={AnnouncementAudience.CompanyWide}>Company Wide</option>
                        <option value={AnnouncementAudience.SpaceSpecific}>Space Specific</option>
                    </select>
                </div>
                {formData.audienceType === AnnouncementAudience.SpaceSpecific && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Space</label>
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
                )}
             </div>

             <div className="flex flex-col gap-3 pt-2">
                 <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="isPinned"
                        checked={formData.isPinned}
                        onChange={e => handleChange('isPinned', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPinned" className="text-sm text-slate-700 font-medium">Pin this announcement to Home</label>
                 </div>

                 <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => handleChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-700">Active (Visible to users)</label>
                 </div>
             </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Announcement</Button>
            </div>
      </form>
    </div>
  );
};
