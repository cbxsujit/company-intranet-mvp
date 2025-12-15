
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Event, EventType, Space, RoleType, SpaceRole } from '../types';
import { getEvent, addEvent, updateEvent, getVisibleSpaces, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ChevronLeft } from 'lucide-react';

interface EventEditorProps {
  currentUser: User;
}

export const EventEditor: React.FC<EventEditorProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    eventType: EventType;
    startDateTime: string;
    endDateTime: string;
    location: string;
    spaceId: string;
    isAllDay: boolean;
    isPublic: boolean;
    isActive: boolean;
    eventBannerURL: string;
  }>({
    title: '',
    description: '',
    eventType: EventType.CompanyEvent,
    startDateTime: '',
    endDateTime: '',
    location: '',
    spaceId: '',
    isAllDay: false,
    isPublic: true,
    isActive: true,
    eventBannerURL: ''
  });

  useEffect(() => {
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const writableSpaces = fetchedSpaces.filter(s => {
      if (currentUser.role === RoleType.CompanyAdmin) return true;
      const role = getMemberRole(s.id, currentUser.id);
      return role === SpaceRole.SpaceManager;
    });
    setSpaces(writableSpaces);

    const isGlobalManager = currentUser.role === RoleType.CompanyAdmin || currentUser.role === RoleType.SpaceManager;
    if (!isGlobalManager && writableSpaces.length === 0) {
        navigate('/events');
        return;
    }

    if (isEditMode && id) {
      const event = getEvent(id);
      if (event) {
        if (event.companyId !== currentUser.companyId) {
          navigate('/events');
          return;
        }
        const canEdit = currentUser.role === RoleType.CompanyAdmin || (event.spaceId && getMemberRole(event.spaceId, currentUser.id) === SpaceRole.SpaceManager);
        if (!canEdit) {
            setError('You do not have permission to edit this event.');
        }

        setFormData({
          title: event.title,
          description: event.description || '',
          eventType: event.eventType,
          startDateTime: event.startDateTime.slice(0, 16), 
          endDateTime: event.endDateTime ? event.endDateTime.slice(0, 16) : '',
          location: event.location || '',
          spaceId: event.spaceId || '',
          isAllDay: event.isAllDay,
          isPublic: event.isPublic,
          isActive: event.isActive,
          eventBannerURL: event.eventBannerURL || ''
        });
      } else {
        setError('Event not found');
      }
    }
  }, [id, currentUser, navigate, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.startDateTime) {
          throw new Error('Start date is required');
      }

      const payload = {
        ...formData,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        spaceId: formData.spaceId || undefined,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : undefined
      };

      if (isEditMode && id) {
        const original = getEvent(id);
        if (original) {
            await updateEvent({ ...original, ...payload });
        }
      } else {
        await addEvent(payload);
      }
      navigate('/events');
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
        <button onClick={() => navigate('/events')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Event' : 'Create Event'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <Input 
          label="Event Title" 
          value={formData.title} 
          onChange={e => handleChange('title', e.target.value)} 
          placeholder="e.g. Team Building"
          required
        />

        <ImageUpload 
            label="Event Banner (Optional)"
            value={formData.eventBannerURL}
            onChange={(url) => handleChange('eventBannerURL', url)}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Event details..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.eventType}
                    onChange={e => handleChange('eventType', e.target.value as EventType)}
                >
                    {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <Input 
                    value={formData.location} 
                    onChange={e => handleChange('location', e.target.value)} 
                    placeholder="Meeting Room 1"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
                <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.startDateTime}
                    onChange={e => handleChange('startDateTime', e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
                <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.endDateTime}
                    onChange={e => handleChange('endDateTime', e.target.value)}
                />
            </div>
        </div>

        <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="isAllDay"
                    checked={formData.isAllDay}
                    onChange={e => handleChange('isAllDay', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAllDay" className="text-sm text-slate-700 font-medium">All Day Event</label>
             </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Related Space (Optional)</label>
            <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.spaceId}
                onChange={e => handleChange('spaceId', e.target.value)}
            >
                <option value="">None (Company Wide)</option>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
            </select>
            <p className="text-xs text-slate-500 mt-1">If selected, only users in this space will see it unless marked Public.</p>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
             <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={e => handleChange('isPublic', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-slate-700 font-medium">Public (Visible to all company users)</label>
             </div>
             <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => handleChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Active</label>
             </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={() => navigate('/events')}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save Event</Button>
        </div>
      </form>
    </div>
  );
};
