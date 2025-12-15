
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Page, Space, RoleType, SpaceRole } from '../types';
import { getPages, getVisibleSpaces, getUserById, getMemberRole, getSpaceById } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Plus, Search, Eye, Edit2, FileText, Copy, Filter, ChevronRight, ChevronDown, Calendar, User as UserIcon, Folder } from 'lucide-react';

interface PagesListProps {
  currentUser: User;
}

export const PagesList: React.FC<PagesListProps> = ({ currentUser }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState(searchParams.get('spaceId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [spaceMap, setSpaceMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const visibleSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    setSpaces(visibleSpaces);
    const sMap: Record<string, string> = {};
    visibleSpaces.forEach(s => sMap[s.id] = s.spaceName);
    setSpaceMap(sMap);

    const allPages = getPages(currentUser.companyId);
    const visibleSpaceIds = new Set(visibleSpaces.map(s => s.id));
    const filteredBySpace = allPages.filter(p => visibleSpaceIds.has(p.spaceId));
    setPages(filteredBySpace);

    const uMap: Record<string, string> = {};
    filteredBySpace.forEach(p => {
        if (p.updatedBy && !uMap[p.updatedBy]) {
            const u = getUserById(p.updatedBy);
            if (u) uMap[p.updatedBy] = u.fullName;
        }
        if (p.createdBy && !uMap[p.createdBy]) {
            const u = getUserById(p.createdBy);
            if (u) uMap[p.createdBy] = u.fullName;
        }
    });
    setUserMap(uMap);
  }, [currentUser.companyId, currentUser.id]);

  useEffect(() => {
    const params: any = {};
    if (selectedSpaceId) {
        params.spaceId = selectedSpaceId;
        const s = getSpaceById(selectedSpaceId);
        setCurrentSpace(s || null);
    } else {
        setCurrentSpace(null);
    }
    if (selectedStatus) params.status = selectedStatus;
    setSearchParams(params);
  }, [selectedSpaceId, selectedStatus]);

  const hasCreatePermission = currentUser.role === RoleType.CompanyAdmin || spaces.some(s => {
      const role = getMemberRole(s.id, currentUser.id);
      return role === SpaceRole.SpaceManager;
  });

  const filteredPages = pages.filter(page => {
    if (page.status === 'Draft') {
        const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;
        if (!canEdit) return false;
    }
    if (searchTerm && !page.pageTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedSpaceId && page.spaceId !== selectedSpaceId) return false;
    if (selectedStatus && page.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Sidebar - Desktop Filters (Visible only on Large Screens) */}
      <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600"/> Filters
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Space</label>
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          <button onClick={() => setSelectedSpaceId('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedSpaceId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Spaces</button>
                          {spaces.map(s => (
                              <button key={s.id} onClick={() => setSelectedSpaceId(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedSpaceId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{s.spaceName}</button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                      <div className="space-y-1">
                          <button onClick={() => setSelectedStatus('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedStatus ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Statuses</button>
                          <button onClick={() => setSelectedStatus('Published')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedStatus === 'Published' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Published</button>
                          <button onClick={() => setSelectedStatus('Draft')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedStatus === 'Draft' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Drafts</button>
                      </div>
                  </div>
              </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3 space-y-6">
          {/* Space Banner */}
          {currentSpace && currentSpace.coverImageURL && (
              <div className="w-full h-48 rounded-xl overflow-hidden relative shadow-sm">
                  <img src={currentSpace.coverImageURL} alt={currentSpace.spaceName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <div className="p-6 text-white">
                          <h1 className="text-3xl font-bold">{currentSpace.spaceName}</h1>
                          <p className="text-white/90 mt-1 text-sm md:text-base max-w-2xl">{currentSpace.description}</p>
                      </div>
                  </div>
              </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {!currentSpace?.coverImageURL && (
                  <>
                    <h1 className="text-2xl font-bold text-slate-900">Pages</h1>
                    <p className="text-sm text-slate-500">{selectedSpaceId ? `Showing pages in ${spaceMap[selectedSpaceId]}` : 'All company pages'}</p>
                  </>
              )}
            </div>
            
            {/* Action Buttons - Full width on mobile */}
            {hasCreatePermission && (
              <div className="flex gap-2 w-full sm:w-auto">
                  <Link to={`/pages/create-from-template${selectedSpaceId ? '?spaceId='+selectedSpaceId : ''}`} className="flex-1 sm:flex-none">
                    <Button variant="secondary" className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap">
                      <Copy size={16} className="mr-2" /> Template
                    </Button>
                  </Link>
                  <Link to="/pages/new" className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap">
                      <Plus size={16} className="mr-2" /> Create
                    </Button>
                  </Link>
              </div>
            )}
          </div>

          {/* Search and Mobile Filters */}
          <div className="space-y-3">
              <div className="flex gap-3">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Search pages..." 
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

              {/* Collapsible Filters for Mobile/Tablet */}
              {showFilters && (
                  <div className="lg:hidden p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Space</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm"
                            value={selectedSpaceId}
                            onChange={(e) => setSelectedSpaceId(e.target.value)}
                        >
                            <option value="">All Spaces</option>
                            {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                        </select>
                      </div>
                  </div>
              )}
          </div>

          {/* Mobile Card View (Visible on < md) */}
          <div className="md:hidden space-y-4">
            {filteredPages.map(page => {
                const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;
                return (
                    <div key={page.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${page.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    <FileText size={16} />
                                </div>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Folder size={10}/> {spaceMap[page.spaceId]}
                                </span>
                             </div>
                             {canManage && (
                                <Link to={`/pages/${page.id}/edit`} className="text-slate-400 hover:text-blue-600 p-1">
                                    <Edit2 size={16} />
                                </Link>
                             )}
                        </div>
                        <Link to={`/pages/${page.id}`} className="block">
                            <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{page.pageTitle}</h3>
                            {page.summary && <p className="text-slate-500 text-sm line-clamp-2 mb-3">{page.summary}</p>}
                        </Link>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                            <span className={`px-2 py-0.5 rounded font-medium ${page.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{page.status}</span>
                            <span>{new Date(page.updatedOn).toLocaleDateString()}</span>
                        </div>
                    </div>
                );
            })}
            {filteredPages.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No pages found.
                </div>
            )}
          </div>

          {/* Desktop Table View (Visible on >= md) */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700">Page Title</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Space</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Updated</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPages.map(page => {
                        const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(page.spaceId, currentUser.id) === SpaceRole.SpaceManager;
                        return (
                        <tr key={page.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <Link to={`/pages/${page.id}`} className="font-medium text-slate-900 hover:text-blue-600 block mb-0.5">{page.pageTitle}</Link>
                                        {page.summary && <div className="text-slate-500 text-xs truncate max-w-[240px]">{page.summary}</div>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium">
                                    <Folder size={12} /> {spaceMap[page.spaceId] || 'Unknown'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    page.status === 'Published' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                    {page.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                                <div>{new Date(page.updatedOn).toLocaleDateString()}</div>
                                <div className="text-slate-400">by {userMap[page.updatedBy || page.createdBy] || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/pages/${page.id}`} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="View">
                                        <Eye size={16} />
                                    </Link>
                                    {canManage && (
                                        <Link to={`/pages/${page.id}/edit`} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                                            <Edit2 size={16} />
                                        </Link>
                                    )}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                    {filteredPages.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No pages found matching your filters.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </main>
    </div>
  );
};
