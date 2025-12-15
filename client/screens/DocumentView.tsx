
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, DocumentItem, DocumentType, Space, Page, RoleType, SpaceRole, ActivityLog, EntityType, ReadAcknowledgement, AIQueryScope } from '../types';
import { getDocument, getSpaceById, getUserById, getPage, checkSpaceAccess, getMemberRole, getActivities, checkIsFavorite, toggleFavorite, checkReadAcknowledgement, addReadAcknowledgement } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Edit2, ChevronLeft, Calendar, User as UserIcon, Tag, ExternalLink, Activity, Star, CheckCircle, Bot, Monitor } from 'lucide-react';

interface DocumentViewProps {
  currentUser: User;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [authorName, setAuthorName] = useState('Unknown');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<ReadAcknowledgement | undefined>(undefined);
  const [ackLoading, setAckLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const foundDoc = getDocument(id);
    
    if (!foundDoc) return;
    
    const hasAccess = checkSpaceAccess(foundDoc.spaceId, currentUser.id);
    if (!hasAccess) {
        navigate('/documents');
        return;
    }

    const isManager = currentUser.role === RoleType.CompanyAdmin || getMemberRole(foundDoc.spaceId, currentUser.id) === SpaceRole.SpaceManager;

    if (foundDoc.companyId !== currentUser.companyId || (!foundDoc.isActive && !isManager)) {
        navigate('/documents');
        return;
    }

    setDoc(foundDoc);
    setIsFavorite(checkIsFavorite(currentUser.id, EntityType.DocumentItem, foundDoc.id));

    const s = getSpaceById(foundDoc.spaceId);
    if (s) setSpace(s);

    if (foundDoc.pageId) {
        const p = getPage(foundDoc.pageId);
        if (p) setPage(p);
    }

    const author = getUserById(foundDoc.createdBy);
    if (author) setAuthorName(author.fullName);

    const logs = getActivities(currentUser.companyId, { entityId: foundDoc.id, entityType: EntityType.DocumentItem });
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

    const ack = checkReadAcknowledgement(currentUser.id, EntityType.DocumentItem, foundDoc.id);
    setAcknowledgement(ack);

  }, [id, currentUser, navigate]);

  const handleToggleFavorite = async () => {
      if(!doc) return;
      const newState = await toggleFavorite(currentUser.companyId, currentUser.id, EntityType.DocumentItem, doc.id);
      setIsFavorite(newState);
  };

  const handleAcknowledge = async () => {
      if (!doc) return;
      setAckLoading(true);
      try {
          const newAck = await addReadAcknowledgement({
              companyId: currentUser.companyId,
              userId: currentUser.id,
              entityType: EntityType.DocumentItem,
              entityId: doc.id
          });
          setAcknowledgement(newAck);
      } catch (e) {
          console.error(e);
      } finally {
          setAckLoading(false);
      }
  };

  if (!doc) return <div className="text-center py-12 text-slate-500">Loading document...</div>;

  const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(doc.spaceId, currentUser.id) === SpaceRole.SpaceManager;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/documents" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                <ChevronLeft size={20} />
                Back to Documents
            </Link>
            <div className="flex items-center gap-2">
                 <Link to={`/ai-assistant?scopeType=${AIQueryScope.Document}&scopeDocumentId=${doc.id}`}>
                    <Button variant="ghost" className="flex items-center gap-2 text-blue-600 bg-blue-50 border-blue-100">
                        <Bot size={16} /> Ask AI
                    </Button>
                </Link>
                 <Button 
                    variant={isFavorite ? "primary" : "secondary"} 
                    className={`flex items-center gap-2 ${isFavorite ? 'bg-yellow-400 border-yellow-400 text-white hover:bg-yellow-500' : ''}`}
                    onClick={handleToggleFavorite}
                >
                    <Star size={16} className={isFavorite ? 'fill-current' : ''} /> {isFavorite ? 'Favorited' : 'Favorite'}
                </Button>
                {canEdit && (
                    <Link to={`/documents/${doc.id}/edit`}>
                        <Button variant="secondary" className="flex items-center gap-2">
                            <Edit2 size={16} /> Edit
                        </Button>
                    </Link>
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-8">
             {/* Preview Image */}
             {doc.previewImageURL && (
                 <div className="w-full h-48 overflow-hidden mb-6 rounded-lg border border-slate-100">
                     <img src={doc.previewImageURL} alt={doc.title} className="w-full h-full object-cover" />
                 </div>
             )}

             <div className="mb-6">
                 <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">{space?.spaceName}</span>
                    {page && (
                        <>
                            <span>/</span>
                            <Link to={`/pages/${page.id}`} className="hover:text-blue-600 hover:underline">{page.pageTitle}</Link>
                        </>
                    )}
                    <span className="ml-auto flex items-center gap-1"><Calendar size={14}/> {new Date(doc.createdOn).toLocaleDateString()}</span>
                 </div>
                 
                 <h1 className="text-2xl font-bold text-slate-900 mb-2">{doc.title}</h1>
                 {doc.description && <p className="text-slate-600">{doc.description}</p>}
                 
                 <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                     <div className="flex items-center gap-2">
                        <UserIcon size={16} />
                        <span>Added by {authorName}</span>
                     </div>
                     {doc.tags && (
                         <div className="flex items-center gap-2">
                            <Tag size={16} />
                            <span>{doc.tags}</span>
                        </div>
                     )}
                 </div>
             </div>

             <div className="pt-6 border-t border-slate-100">
                {doc.itemType === DocumentType.FileLink && doc.fileURL && (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-slate-900">File Link</p>
                        <a href={doc.fileURL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                            Open File <ExternalLink size={18} />
                        </a>
                    </div>
                )}
                {doc.itemType === DocumentType.ExternalLink && doc.externalURL && (
                     <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-slate-900">External URL</p>
                        <a href={doc.externalURL} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-4 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                            Open Link <ExternalLink size={18} />
                        </a>
                    </div>
                )}
                {doc.itemType === DocumentType.Embed && doc.externalURL && (
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">Embedded Content</p>
                            <a href={doc.externalURL} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                Open Source <ExternalLink size={10} />
                            </a>
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <iframe 
                                src={doc.externalURL} 
                                className="w-full h-[600px] border-0" 
                                allowFullScreen 
                                title={doc.title}
                                loading="lazy"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            />
                        </div>
                    </div>
                )}
                {doc.itemType === DocumentType.InternalNote && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                        <p className="font-medium text-sm mb-1">Internal Note</p>
                        <p>This is an internal reference note.</p>
                    </div>
                )}
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

        {/* Activity Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Activity for this Document</h3>
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
