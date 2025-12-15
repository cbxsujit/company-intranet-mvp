
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { User, Event, RoleType, SpaceRole } from '../types';
import { getEvent, getSpaceById, getUserById, getMemberRole, updateEvent } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Edit2, MapPin, Calendar, Clock, User as UserIcon, Ban } from 'lucide-react';

interface EventViewProps {
  currentUser: User;
}

export const EventView: React.FC<EventViewProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [spaceName, setSpaceName] = useState('');
  const [creatorName, setCreatorName] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchedEvent = getEvent(id);
    if (!fetchedEvent) return;

    const isAdmin = currentUser.role === RoleType.CompanyAdmin;
    const isCreator = fetchedEvent.createdBy === currentUser.id;
    const isSpaceMember = fetchedEvent.spaceId ? getMemberRole(fetchedEvent.spaceId, currentUser.id) !== null : true;
    
    if (fetchedEvent.companyId !== currentUser.companyId) {
        navigate('/events');
        return;
    }

    if (!fetchedEvent.isActive && !isAdmin && !isCreator) {
        navigate('/events');
        return;
    }

    if (!fetchedEvent.isPublic && !isAdmin && !isSpaceMember && !isCreator) {
         navigate('/events');
         return;
    }

    setEvent(fetchedEvent);

    if (fetchedEvent.spaceId) {
        const s = getSpaceById(fetchedEvent.spaceId);
        if (s) setSpaceName(s.spaceName);
    }
    const u = getUserById(fetchedEvent.createdBy);
    if (u) setCreatorName(u.fullName);

  }, [id, currentUser, navigate]);

  const handleDeactivate = async () => {
      if (!event || !window.confirm("Deactivate this event? It will be hidden from lists.")) return;
      await updateEvent({ ...event, isActive: false });
      navigate('/events');
  };

  if (!event) return <div className="p-12 text-center">Loading event...</div>;

  const canEdit = currentUser.role === RoleType.CompanyAdmin || 
                  (event.spaceId && getMemberRole(event.spaceId, currentUser.id) === SpaceRole.SpaceManager);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/events" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                <ChevronLeft size={20} />
                Back to Events
            </Link>
            {canEdit && (
                <div className="flex gap-2">
                    <Link to={`/events/${event.id}/edit`}>
                        <Button variant="secondary" className="flex items-center gap-2">
                            <Edit2 size={16} /> Edit
                        </Button>
                    </Link>
                    {event.isActive && (
                        <Button variant="danger" onClick={handleDeactivate} className="flex items-center gap-2">
                            <Ban size={16} /> Deactivate
                        </Button>
                    )}
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {event.eventBannerURL ? (
                <div className="w-full h-48 overflow-hidden">
                    <img src={event.eventBannerURL} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className={`h-2 w-full ${event.isActive ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
            )}
            
            <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-indigo-50 text-indigo-700">
                                {event.eventType}
                            </span>
                            {!event.isActive && <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-100 text-slate-500">Inactive</span>}
                            {!event.isPublic && <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-amber-50 text-amber-700">Private</span>}
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                    </div>
                    {event.startDateTime && (
                        <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[80px]">
                            <span className="block text-xs text-slate-500 uppercase font-bold">{new Date(event.startDateTime).toLocaleString('default', { month: 'short' })}</span>
                            <span className="block text-2xl font-bold text-slate-900">{new Date(event.startDateTime).getDate()}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-slate-400"/>
                        <div>
                            <p className="font-medium">Date & Time</p>
                            <p>{new Date(event.startDateTime).toLocaleDateString()} {event.isAllDay ? '(All Day)' : new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            {event.endDateTime && <p className="text-slate-500 text-xs">to {new Date(event.endDateTime).toLocaleDateString()} {new Date(event.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                        </div>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-slate-400"/>
                            <div>
                                <p className="font-medium">Location</p>
                                <p>{event.location}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <UserIcon size={20} className="text-slate-400"/>
                        <div>
                            <p className="font-medium">Organizer</p>
                            <p>{creatorName || 'Unknown'}</p>
                        </div>
                    </div>
                    {spaceName && (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded-full text-xs font-bold text-slate-500">S</div>
                            <div>
                                <p className="font-medium">Space</p>
                                <p>{spaceName}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="prose max-w-none text-slate-800 whitespace-pre-wrap border-t border-slate-100 pt-6">
                    {event.description || <span className="text-slate-400 italic">No description provided.</span>}
                </div>
            </div>
        </div>
    </div>
  );
};
