
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Page, Space, RoleType, DocumentItem, DocumentType, SpaceRole, ActivityLog, EntityType, PageComment, PageWidget, KnowledgeArticle, AIQueryScope } from '../types';
import { getPage, getSpaceById, getUserById, getDocuments, checkSpaceAccess, getMemberRole, getActivities, getPageComments, addPageComment, updatePageComment, deletePageComment, getPageWidgets, deletePageWidget, logPageView, checkIsFavorite, toggleFavorite, getKnowledgeArticlesByPage } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Edit2, ChevronLeft, Calendar, User as UserIcon, Folder, Link as LinkIcon, File, Globe, StickyNote, Plus, Activity, MessageSquare, Trash2, Save, X, Layout, ExternalLink, Ban, Star, HelpCircle, Bot } from 'lucide-react';

interface PageViewProps {
  currentUser: User;
}

export const PageView: React.FC<PageViewProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [authorName, setAuthorName] = useState('Unknown');
  const [updaterName, setUpdaterName] = useState('Unknown');
  const [relatedDocs, setRelatedDocs] = useState<DocumentItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [comments, setComments] = useState<PageComment[]>([]);
  const [widgets, setWidgets] = useState<PageWidget[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedFAQs, setRelatedFAQs] = useState<KnowledgeArticle[]>([]);

  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const refreshComments = (pageId: string) => {
      const fetchedComments = getPageComments(pageId);
      setComments(fetchedComments);
      const newMap = { ...userMap };
      fetchedComments.forEach(c => {
          if (!newMap[c.userId]) {
              const u = getUserById(c.userId);
              if (u) newMap[c.userId] = u.fullName;
          }
      });
      setUserMap(newMap);
  };

  const refreshWidgets = (pageId: string) => {
      const fetchedWidgets = getPageWidgets(pageId);
      setWidgets(fetchedWidgets);
  };

  useEffect(() => {
    if (!id) return;
    const foundPage = getPage(id);
    
    if (!foundPage) return;
    
    const hasSpaceAccess = checkSpaceAccess(foundPage.spaceId, currentUser.id);
    if (!hasSpaceAccess) {
        navigate('/pages');
        return;
    }

    const isManager = currentUser.role === RoleType.CompanyAdmin || getMemberRole(foundPage.spaceId, currentUser.id) === SpaceRole.SpaceManager;
    if (foundPage.status === 'Draft' && !isManager) {
        navigate('/pages');
        return;
    }
    
    if (foundPage.companyId !== currentUser.companyId) {
        navigate('/pages');
        return;
    }

    setPage(foundPage);
    setIsFavorite(checkIsFavorite(currentUser.id, EntityType.Page, foundPage.id));
    logPageView(currentUser.companyId, foundPage.id, currentUser.id, currentUser.role);

    const s = getSpaceById(foundPage.spaceId);
    if (s) setSpace(s);

    const author = getUserById(foundPage.createdBy);
    if (author) setAuthorName(author.fullName);

    const updater = getUserById(foundPage.updatedBy || foundPage.createdBy);
    if (updater) setUpdaterName(updater.fullName);

    const allDocs = getDocuments(currentUser.companyId);
    const linkedDocs = allDocs.filter(d => 
        d.pageId === foundPage.id && 
        (d.isActive || isManager)
    );
    setRelatedDocs(linkedDocs);

    refreshWidgets(foundPage.id);

    const faqs = getKnowledgeArticlesByPage(foundPage.id);
    setRelatedFAQs(faqs);

    const logs = getActivities(currentUser.companyId, { entityId: foundPage.id, entityType: EntityType.Page });
    setActivities(logs.slice(0, 5));
    
    const uMap: Record<string, string> = {};
    if (author) uMap[author.id] = author.fullName;
    if (updater) uMap[updater.id] = updater.fullName;
    
    logs.slice(0, 5).forEach(l => {
        if (!uMap[l.userId]) {
            const u = getUserById(l.userId);
            if (u) uMap[l.userId] = u.fullName;
        }
    });
    setUserMap(uMap);

    refreshComments(foundPage.id);

  }, [id, currentUser, navigate]);

  const handlePostComment = async () => {
      if (!page || !newCommentText.trim()) return;
      try {
          await addPageComment({
              pageId: page.id,
              companyId: currentUser.companyId,
              userId: currentUser.id,
              commentText: newCommentText.trim()
          });
          setNewCommentText('');
          refreshComments(page.id);
      } catch (e) {
          console.error(e);
      }
  };

  const startEditComment = (comment: PageComment) => {
      setEditingCommentId(comment.id);
      setEditCommentText(comment.commentText);
  };

  const handleSaveEditComment = async (commentId: string) => {
      if (!page || !editCommentText.trim()) return;
      try {
          await updatePageComment(commentId, editCommentText.trim());
          setEditingCommentId(null);
          setEditCommentText('');
          refreshComments(page.id);
      } catch (e) {
          console.error(e);
      }
  };

  const handleDeleteComment = async (commentId: string) => {
      if (!page || !window.confirm("Are you sure you want to delete this comment?")) return;
      try {
          await deletePageComment(commentId);
          refreshComments(page.id);
      } catch (e) {
          console.error(e);
      }
  };

  const handleDisableWidget = async (widgetId: string) => {
      if (!page || !window.confirm("Disable this widget?")) return;
      try {
          await deletePageWidget(widgetId);
          refreshWidgets(page.id);
      } catch (e) {
          console.error(e);
      }
  };

  const handleToggleFavorite = async () => {
      if(!page) return;
      const newState = await toggleFavorite(currentUser.companyId, currentUser.id, EntityType.Page, page.id);
      setIsFavorite(newState);
  };

  if (!page) return <div className="text-center py-12 text-slate-500">Loading page...</div>;

  const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;

  const getTypeIcon = (type: DocumentType) => {
    switch(type) {
        case DocumentType.FileLink: return <File size={16} />;
        case DocumentType.ExternalLink: return <Globe size={16} />;
        case DocumentType.InternalNote: return <StickyNote size={16} />;
        default: return <LinkIcon size={16} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/pages" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
                <ChevronLeft size={20} />
                Back to Pages
            </Link>
            <div className="flex items-center gap-2">
                <Link to={`/ai-assistant?scopeType=${AIQueryScope.Page}&scopePageId=${page.id}`}>
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
                    <Link to={`/pages/${page.id}/edit`}>
                        <Button variant="secondary" className="flex items-center gap-2">
                            <Edit2 size={16} /> Edit Page
                        </Button>
                    </Link>
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {/* Header Image */}
             {page.headerImageURL && (
                 <div className="w-full h-64 overflow-hidden">
                     <img src={page.headerImageURL} alt={page.pageTitle} className="w-full h-full object-cover" />
                 </div>
             )}

             {/* Header Content */}
             <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className={`px-2 py-1 rounded-md border font-medium ${
                        page.status === 'Published' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {page.status}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                        <Folder size={14} />
                        {space?.spaceName || 'Unknown Space'}
                    </span>
                 </div>
                 
                 <h1 className="text-3xl font-bold text-slate-900 mb-2">{page.pageTitle}</h1>
                 {page.summary && <p className="text-lg text-slate-500">{page.summary}</p>}

                 <div className="flex items-center gap-6 mt-6 text-sm text-slate-500">
                     <div className="flex items-center gap-2">
                        <UserIcon size={16} />
                        <span>By {authorName}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Updated {new Date(page.updatedOn).toLocaleDateString()} by {updaterName}</span>
                     </div>
                 </div>
             </div>

             {/* Content */}
             <div className="p-8 min-h-[400px]">
                 <div className="prose max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed">
                     {page.content || <span className="text-slate-400 italic">No content added yet.</span>}
                 </div>
             </div>
        </div>
        
        {/* ... (Widgets, FAQs, Docs, Activity, Comments sections remain unchanged) */}
        {/* Dashboard & Embeds Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layout size={18} className="text-slate-500" />
                    <h3 className="font-bold text-slate-900">Dashboard & Embeds</h3>
                </div>
                {canEdit && (
                    <Link to={`/pages/${page.id}/widgets/new`}>
                        <Button variant="secondary" className="py-1 px-2 text-xs">
                            <Plus size={12} className="mr-1" /> Add Dashboard/Embed Widget
                        </Button>
                    </Link>
                )}
             </div>
             
             <div className="p-6 space-y-8">
                 {widgets.length === 0 && (
                     <div className="text-center py-6 text-slate-500">
                         <p className="mb-2">No dashboards or embeds added yet.</p>
                         {canEdit && <p className="text-xs">Click 'Add Dashboard/Embed Widget' to connect a Google Sheet, BI report, or any dashboard URL.</p>}
                     </div>
                 )}
                 {widgets.map(widget => (
                     <div key={widget.id} className="border border-slate-200 rounded-lg overflow-hidden">
                         <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                             <div>
                                 <h4 className="font-semibold text-slate-900">{widget.widgetTitle}</h4>
                                 {widget.description && <p className="text-xs text-slate-500">{widget.description}</p>}
                             </div>
                             {canEdit && (
                                 <div className="flex gap-2">
                                     <Link to={`/pages/${page.id}/widgets/${widget.id}/edit`}>
                                        <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-white" title="Edit Widget">
                                            <Edit2 size={14} />
                                        </button>
                                     </Link>
                                     <button onClick={() => handleDisableWidget(widget.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white" title="Disable Widget">
                                        <Ban size={14} />
                                     </button>
                                 </div>
                             )}
                         </div>
                         <div className="bg-white p-1">
                             <iframe 
                                src={widget.embedURL} 
                                title={widget.widgetTitle}
                                className="w-full h-[500px] border-0 rounded"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                loading="lazy"
                             ></iframe>
                             <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                                 <a href={widget.embedURL} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                                     Open Dashboard <ExternalLink size={10} />
                                 </a>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Related FAQs */}
        {relatedFAQs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <HelpCircle size={18} className="text-blue-500" />
                    <h3 className="font-bold text-slate-900">Related FAQs</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {relatedFAQs.map(faq => (
                        <Link to="/help" key={faq.id} className="block p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900 group-hover:text-blue-600">{faq.title}</span>
                                <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Related Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Related Documents</h3>
                    {canEdit && (
                        <Link to={`/documents/new?spaceId=${page.spaceId}&pageId=${page.id}`}>
                            <Button variant="secondary" className="py-1 px-2 text-xs">
                                <Plus size={12} className="mr-1" /> Add
                            </Button>
                        </Link>
                    )}
                </div>
                <div className="divide-y divide-slate-100">
                    {relatedDocs.map(doc => (
                        <div key={doc.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="text-slate-400">{getTypeIcon(doc.itemType)}</div>
                                <div>
                                    <Link to={`/documents/${doc.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                        {doc.title}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {relatedDocs.length === 0 && (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                            No documents linked.
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Activity size={18} className="text-slate-500" />
                    <h3 className="font-bold text-slate-900">Activity for this Page</h3>
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

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-slate-500" />
                    <h3 className="font-bold text-slate-900">Comments {comments.length > 0 && `(${comments.length})`}</h3>
                </div>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Comment List */}
                <div className="space-y-4">
                    {comments.map(comment => {
                        const isOwner = comment.userId === currentUser.id;
                        const isAdmin = currentUser.role === RoleType.CompanyAdmin;
                        const canModify = isOwner || isAdmin;
                        const isEditing = editingCommentId === comment.id;

                        return (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-slate-500 text-sm">{(userMap[comment.userId] || '?').charAt(0)}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900">{userMap[comment.userId] || 'Unknown User'}</span>
                                            <span className="text-xs text-slate-500">{new Date(comment.createdOn).toLocaleString()}</span>
                                            {comment.isEdited && <span className="text-xs text-slate-400 italic">(edited)</span>}
                                        </div>
                                        {canModify && !isEditing && (
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditComment(comment)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-400 hover:text-red-600 p-1" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="mt-2">
                                            <textarea 
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                rows={3}
                                                value={editCommentText}
                                                onChange={(e) => setEditCommentText(e.target.value)}
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <Button size="sm" onClick={() => handleSaveEditComment(comment.id)} className="h-8 px-3 text-xs">
                                                    <Save size={14} className="mr-1" /> Save
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => setEditingCommentId(null)} className="h-8 px-3 text-xs">
                                                    <X size={14} className="mr-1" /> Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-700 text-sm whitespace-pre-wrap">
                                            {comment.commentText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {comments.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-4">
                            No comments yet. Be the first to comment.
                        </div>
                    )}
                </div>

                {/* New Comment Form */}
                <div className="pt-6 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Add a comment</label>
                    <textarea 
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        placeholder="Share your thoughts..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                        <Button 
                            onClick={handlePostComment} 
                            disabled={!newCommentText.trim()}
                        >
                            Post Comment
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
