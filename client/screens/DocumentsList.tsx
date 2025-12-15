
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, DocumentItem, DocumentType, Space, RoleType, SpaceRole, DocumentImportance } from '../types';
import { getDocuments, getVisibleSpaces, getPages, getUserById, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Plus, Search, Eye, Edit2, Link as LinkIcon, File, StickyNote, Filter, Globe, Shield, AlertCircle, Monitor, ChevronRight } from 'lucide-react';

interface DocumentsListProps {
  currentUser: User;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState(searchParams.get('spaceId') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [spaceMap, setSpaceMap] = useState<Record<string, string>>({});
  const [pageMap, setPageMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const visibleSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    setSpaces(visibleSpaces);
    const visibleSpaceIds = new Set(visibleSpaces.map(s => s.id));
    const sMap: Record<string, string> = {};
    visibleSpaces.forEach(s => sMap[s.id] = s.spaceName);
    setSpaceMap(sMap);

    const allDocs = getDocuments(currentUser.companyId);
    const filteredDocs = allDocs.filter(d => visibleSpaceIds.has(d.spaceId));
    setDocuments(filteredDocs);

    const rawPages = getPages(currentUser.companyId);
    const pMap: Record<string, string> = {};
    rawPages.forEach(p => pMap[p.id] = p.pageTitle);
    setPageMap(pMap);

    const uMap: Record<string, string> = {};
    filteredDocs.forEach(d => {
        if (d.createdBy && !uMap[d.createdBy]) {
            const u = getUserById(d.createdBy);
            if (u) uMap[d.createdBy] = u.fullName;
        }
    });
    setUserMap(uMap);
  }, [currentUser.companyId, currentUser.id]);

  useEffect(() => {
    const params: any = {};
    if (selectedSpaceId) params.spaceId = selectedSpaceId;
    if (selectedType) params.type = selectedType;
    setSearchParams(params);
  }, [selectedSpaceId, selectedType]);

  const hasCreatePermission = currentUser.role === RoleType.CompanyAdmin || spaces.some(s => {
      const role = getMemberRole(s.id, currentUser.id);
      return role === SpaceRole.SpaceManager;
  });

  const filteredDocs = documents.filter(doc => {
    const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(doc.spaceId, currentUser.id) === SpaceRole.SpaceManager;
    if (!doc.isActive && !canManage) return false;

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(lowerSearch);
        const matchesTags = doc.tags?.toLowerCase().includes(lowerSearch);
        if (!matchesTitle && !matchesTags) return false;
    }
    if (selectedSpaceId && doc.spaceId !== selectedSpaceId) return false;
    if (selectedType && doc.itemType !== selectedType) return false;
    return true;
  });

  const getTypeIcon = (type: DocumentType) => {
      switch(type) {
          case DocumentType.FileLink: return <File size={18} />;
          case DocumentType.ExternalLink: return <Globe size={18} />;
          case DocumentType.InternalNote: return <StickyNote size={18} />;
          case DocumentType.Embed: return <Monitor size={18} />;
          default: return <LinkIcon size={18} />;
      }
  };

  const getExpiryStatus = (doc: DocumentItem) => {
      if (!doc.expiryDate) return null;
      const today = new Date();
      today.setHours(0,0,0,0);
      const expDate = new Date(doc.expiryDate);
      const thirtyDays = new Date(today);
      thirtyDays.setDate(today.getDate() + 30);

      if (expDate < today) return { label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200' };
      if (expDate <= thirtyDays) return { label: 'Expiring Soon', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Sidebar Filters (Desktop) */}
      <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600"/> Filters
              </h3>
              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                      <div className="space-y-1">
                          <button onClick={() => setSelectedType('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedType ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Types</button>
                          <button onClick={() => setSelectedType(DocumentType.FileLink)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === DocumentType.FileLink ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Files</button>
                          <button onClick={() => setSelectedType(DocumentType.ExternalLink)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === DocumentType.ExternalLink ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Links</button>
                          <button onClick={() => setSelectedType(DocumentType.Embed)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === DocumentType.Embed ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Embeds</button>
                          <button onClick={() => setSelectedType(DocumentType.InternalNote)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === DocumentType.InternalNote ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Notes</button>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Space</label>
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          <button onClick={() => setSelectedSpaceId('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedSpaceId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Spaces</button>
                          {spaces.map(s => (
                              <button key={s.id} onClick={() => setSelectedSpaceId(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedSpaceId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                                  {s.spaceName}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
              <p className="text-sm text-slate-500">Central library for files and resources.</p>
            </div>
            {hasCreatePermission && (
              <Link to="/documents/new" className="w-full sm:w-auto">
                <Button className="w-full">
                  <Plus size={18} className="mr-2" /> Add Document
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Mobile Filters */}
          <div className="space-y-3">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search documents..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="lg:hidden">
                    <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-full px-4 rounded-lg border flex items-center gap-2 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-700'}`}
                    >
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Mobile Collapsible Filters */}
            {showFilters && (
                <div className="lg:hidden p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Space</label>
                            <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm" value={selectedSpaceId} onChange={e => setSelectedSpaceId(e.target.value)}>
                                <option value="">All Spaces</option>
                                {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                            </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                            <option value="">All Types</option>
                            <option value={DocumentType.FileLink}>File</option>
                            <option value={DocumentType.ExternalLink}>Link</option>
                            <option value={DocumentType.Embed}>Embed</option>
                            <option value={DocumentType.InternalNote}>Note</option>
                        </select>
                    </div>
                </div>
            )}
          </div>

           {/* Mobile Cards View (MD Hidden) */}
          <div className="md:hidden space-y-4">
             {filteredDocs.map(doc => {
                  const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(doc.spaceId, currentUser.id) === SpaceRole.SpaceManager;
                  const expiryStatus = getExpiryStatus(doc);
                  return (
                      <div key={doc.id} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${!doc.isActive ? 'opacity-60' : ''}`}>
                          <div className="flex gap-3">
                                {doc.previewImageURL ? (
                                     <img src={doc.previewImageURL} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-100 shrink-0" />
                                 ) : (
                                     <div className="h-16 w-16 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                         {getTypeIcon(doc.itemType)}
                                     </div>
                                 )}
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start">
                                         <Link to={`/documents/${doc.id}`} className="font-bold text-slate-900 block truncate text-lg mb-1">
                                             {doc.title}
                                         </Link>
                                         {canManage && (
                                            <Link to={`/documents/${doc.id}/edit`} className="text-slate-400 hover:text-blue-600 p-1">
                                                <Edit2 size={16} />
                                            </Link>
                                         )}
                                     </div>
                                     
                                     <div className="flex flex-wrap gap-2 mb-2">
                                         <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{spaceMap[doc.spaceId]}</span>
                                         {doc.isPolicy && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100"><Shield size={10}/> Policy</span>}
                                         {expiryStatus && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${expiryStatus.color}`}>{expiryStatus.label}</span>}
                                     </div>
                                 </div>
                          </div>
                          
                          {doc.description && <p className="text-sm text-slate-500 mt-3 line-clamp-2">{doc.description}</p>}
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                <span className="text-xs text-slate-400">{new Date(doc.createdOn).toLocaleDateString()}</span>
                                <Link to={`/documents/${doc.id}`}>
                                    <Button variant="secondary" size="sm" className="h-8 text-xs">View Details</Button>
                                </Link>
                          </div>
                      </div>
                  );
             })}
             {filteredDocs.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No documents found.
                </div>
            )}
          </div>

          {/* Desktop Table View (Hidden on MD) */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Title</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Location</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Tags</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map(doc => {
                     const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(doc.spaceId, currentUser.id) === SpaceRole.SpaceManager;
                     const expiryStatus = getExpiryStatus(doc);
                     
                     return (
                        <tr key={doc.id} className={`hover:bg-slate-50 transition-colors group ${!doc.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                                 {doc.previewImageURL ? (
                                     <img src={doc.previewImageURL} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-slate-200 shrink-0" />
                                 ) : (
                                     <div className="mt-1 text-slate-400">{getTypeIcon(doc.itemType)}</div>
                                 )}
                                 <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900">{doc.title}</span>
                                        {doc.isPolicy && <span title="Policy"><Shield size={12} className="text-blue-600" /></span>}
                                    </div>
                                    {doc.description && <div className="text-slate-500 text-xs truncate max-w-[240px]">{doc.description}</div>}
                                    {expiryStatus && (
                                        <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${expiryStatus.color}`}>
                                            <AlertCircle size={10} /> {expiryStatus.label}
                                        </span>
                                    )}
                                 </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="font-medium">{spaceMap[doc.spaceId] || 'Unknown Space'}</div>
                            {doc.pageId && <div className="text-xs text-slate-400 mt-0.5">Page: {pageMap[doc.pageId]}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                                {doc.tags?.split(',').map((tag, i) => tag.trim() && (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs border border-slate-200">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/documents/${doc.id}`} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="View">
                                <Eye size={16} />
                              </Link>
                              {canManage && (
                                <Link to={`/documents/${doc.id}/edit`} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                                    <Edit2 size={16} />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                     );
                  })}
                   {filteredDocs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No documents found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </main>
    </div>
  );
};
