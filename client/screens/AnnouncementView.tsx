
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Announcement, AnnouncementAudience, Space, RoleType, ActivityLog, EntityType, ReadAcknowledgement } from '../types';
import { getAnnouncement, getSpaceById, getUserById, getActivities, checkReadAcknowledgement, addReadAcknowledgement } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Edit2, ChevronLeft, Calendar, User as UserIcon, Pin, Grid, Activity, CheckCircle } from 'lucide-react';

interface AnnouncementViewProps {
  currentUser: User;
}

export const AnnouncementView: React.FC<AnnouncementViewProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [authorName, setAuthorName] = useState('Unknown');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [acknowledgement, setAcknowledgement] = useState<ReadAcknowledgement | undefined>(undefined);
  const [ackLoading, setAckLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ann = getAnnouncement(id);
    
    if (!ann) return;
    
    const canView = ann.isActive || [RoleType.CompanyAdmin, RoleType.SpaceManager].includes(currentUser.role);
    if (ann.companyId !== currentUser.companyId || !canView) {
        navigate('/announcements');
        return;
    }

    setAnnouncement(ann);

    if (ann.spaceId) {
        const s = getSpaceById(ann.spaceId);
        if (s) setSpace(s);
    }

    const author = getUserById(ann.createdBy);
    if (author) setAuthorName(author.fullName);

    const logs = getActivities(currentUser.companyId, { entityId: ann.id, entityType: EntityType.Announcement });
    setActivities(logs.slice(0, 5));
    
    const uMap: Record<string, string> = {};
    if (author) uMap[author.id] = author.fullName;
    logs.slice(0, 5).forEach(l => {
        if (!uMap[l.userId]) {
            const u = getUserById(l.userId);
            if (u) uMap[l.userId] = u.fullName;
        }
    });
    setUserMap(uMap);

    const ack = checkReadAcknowledgement(currentUser.id, EntityType.Announcement, ann.id);
    setAcknowledgement(ack);

  }, [id, currentUser, navigate]);

  const handleAcknowledge = async () => {
    if (!announcement) return;
    setAckLoading(true);
    try {
        const newAck = await addReadAcknowledgement({
            companyId: currentUser.companyId,
            userId: currentUser.id,
            entityType: EntityType.Announcement,
            entityId: announcement.id
        });
        setAcknowledgement(newAck);
    } catch (e) {
        console.error(e);
    } finally {
        setAckLoading(false);
    }
  };

  if (!announcement) return <div className="text-center py-12 text-slate-500">Loading...</div>;

  const canEdit = [RoleType.CompanyAdmin, RoleType.SpaceManager].includes(currentUser.role);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/announcements" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                <ChevronLeft size={20} />
                Back to Announcements
            </Link>
            {canEdit && (
                <Link to={`/announcements/${announcement.id}/edit`}>
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Edit2 size={16} /> Edit
                    </Button>
                </Link>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {announcement.announcementImageURL && (
                 <div className="w-full h-64 overflow-hidden">
                     <img src={announcement.announcementImageURL} alt={announcement.title} className="w-full h-full object-cover" />
                 </div>
             )}
             <div className="p-8">
                 <div className="mb-6 border-b border-slate-100 pb-6">
                     <div className="flex items-center gap-3 mb-4">
                        {announcement.isPinned && <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1"><Pin size={12}/> Pinned</span>}
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${announcement.audienceType === AnnouncementAudience.CompanyWide ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                            {announcement.audienceType === AnnouncementAudience.CompanyWide ? 'Company Wide' : 'Space Specific'}
                        </span>
                     </div>
                     
                     <h1 className="text-3xl font-bold text-slate-900 mb-4">{announcement.title}</h1>
                     
                     <div className="flex items-center gap-6 text-sm text-slate-500">
                         <div className="flex items-center gap-2">
                            <UserIcon size={16} />
                            <span>{authorName}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{new Date(announcement.createdOn).toLocaleDateString()}</span>
                         </div>
                         {space && (
                             <div className="flex items-center gap-2">
                                <Grid size={16} />
                                <span>{space.spaceName}</span>
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="prose max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {announcement.message}
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    {acknowledgement ? (
                         <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-medium">
                             <CheckCircle size={16} />
                             You acknowledged this on {new Date(acknowledgement.acknowledgedOn).toLocaleString()}
                         </div>
                    ) : (
                        <Button onClick={handleAcknowledge} isLoading={ackLoading}>
                            <CheckCircle size={18} className="mr-2" /> I have read this
                        </Button>
                    )}
                 </div>
             </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Activity for this Announcement</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {activities.map(log => (
                    <div key={log.id} className="p-4 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-slate-900">{userMap[log.userId] || 'Unknown User'}</span>
                                <span className="text-slate-500 text-xs">{new Date(log.createdOn).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600">{log.description}</p>
                    </div>
                ))}
                {activities.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-sm italic">
                        No recent activity.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
