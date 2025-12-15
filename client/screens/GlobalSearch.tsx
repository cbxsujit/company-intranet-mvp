
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { User, Page, DocumentItem, Announcement, Space, RoleType, SpaceRole } from '../types';
import { getPages, getDocuments, getAnnouncements, getVisibleSpaces, checkSpaceAccess, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Search, FileText, Link as LinkIcon, Bell, ArrowRight, Eye, Calendar, Grid } from 'lucide-react';

interface GlobalSearchProps {
  currentUser: User;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ currentUser }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);

  const [results, setResults] = useState<{
    pages: Page[];
    docs: DocumentItem[];
    announcements: Announcement[];
  }>({ pages: [], docs: [], announcements: [] });

  const [spaces, setSpaces] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load spaces map for display - but only visible ones? 
    // Actually for display it's safer to load visible only, but for mapping IDs in results we might need names.
    // getVisibleSpaces returns full objects.
    const visibleSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    const sMap: Record<string, string> = {};
    visibleSpaces.forEach(s => sMap[s.id] = s.spaceName);
    setSpaces(sMap);
  }, [currentUser.companyId, currentUser.id]);

  useEffect(() => {
    setLocalQuery(query);
    if (!query.trim()) {
      setResults({ pages: [], docs: [], announcements: [] });
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      const lowerQ = query.toLowerCase();
      
      // Get Access Sets
      const visibleSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
      const visibleSpaceIds = new Set(visibleSpaces.map(s => s.id));

      // 1. Pages
      const allPages = getPages(currentUser.companyId);
      const filteredPages = allPages.filter(p => {
        // Space Access
        if (!visibleSpaceIds.has(p.spaceId)) return false;

        // Status Access
        if (p.status === 'Draft') {
            const canEdit = currentUser.role === RoleType.CompanyAdmin || getMemberRole(p.spaceId, currentUser.id) === SpaceRole.SpaceManager;
            if (!canEdit) return false;
        }
        
        // Search check
        return (
          p.pageTitle.toLowerCase().includes(lowerQ) ||
          (p.summary && p.summary.toLowerCase().includes(lowerQ)) ||
          p.content.toLowerCase().includes(lowerQ)
        );
      }).slice(0, 20);

      // 2. Documents
      const allDocs = getDocuments(currentUser.companyId);
      const filteredDocs = allDocs.filter(d => {
        // Space Access
        if (!visibleSpaceIds.has(d.spaceId)) return false;

        // Active Status
        const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(d.spaceId, currentUser.id) === SpaceRole.SpaceManager;
        if (!d.isActive && !canManage) return false;

        // Search check
        return (
          d.title.toLowerCase().includes(lowerQ) ||
          (d.description && d.description.toLowerCase().includes(lowerQ)) ||
          (d.tags && d.tags.toLowerCase().includes(lowerQ))
        );
      }).slice(0, 20);

      // 3. Announcements
      const allAnns = getAnnouncements(currentUser.companyId);
      const filteredAnns = allAnns.filter(a => {
        // Visibility logic
        if (a.spaceId && !checkSpaceAccess(a.spaceId, currentUser.id)) return false;
        if (!a.isActive && currentUser.role !== RoleType.CompanyAdmin) { // Simplified check for announcements admin
             // If strictly following prompt: "Only users with Role = CompanyAdmin or SpaceManager can create or edit"
             // Assuming SpaceManager role generally implies visibility of inactive?
             // Sticking to safe "isActive" for general search unless CompanyAdmin.
             return false;
        }

        // Search check
        return (
          a.title.toLowerCase().includes(lowerQ) ||
          a.message.toLowerCase().includes(lowerQ)
        );
      }).slice(0, 20);

      setResults({
        pages: filteredPages,
        docs: filteredDocs,
        announcements: filteredAnns
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser.companyId, currentUser.id, currentUser.role]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localQuery)}`);
    }
  };

  const hasResults = results.pages.length > 0 || results.docs.length > 0 || results.announcements.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Global Search</h1>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            placeholder="Search pages, documents, and announcements..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
             <Button type="submit">Search</Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {!hasResults && query && (
             <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                <Search size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No results found for "{query}"</p>
                <p className="text-sm">Try searching for different keywords.</p>
             </div>
          )}

          {/* Pages Results */}
          {results.pages.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
                  <FileText className="text-blue-500" size={20} />
                  <h2>Pages ({results.pages.length})</h2>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-700">Page Title</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Space</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.pages.map(page => (
                        <tr key={page.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">
                             <Link to={`/pages/${page.id}`} className="hover:text-blue-600 hover:underline">{page.pageTitle}</Link>
                             {page.summary && <div className="text-slate-500 text-xs font-normal truncate max-w-md">{page.summary}</div>}
                          </td>
                          <td className="px-6 py-3 text-slate-600">{spaces[page.spaceId] || 'Unknown'}</td>
                          <td className="px-6 py-3">
                             <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${page.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {page.status}
                             </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Link to={`/pages/${page.id}`}>
                               <Button variant="ghost" className="text-xs py-1 h-auto">Open Page</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* Documents Results */}
          {results.docs.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
                  <LinkIcon className="text-emerald-500" size={20} />
                  <h2>Documents ({results.docs.length})</h2>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-700">Title</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Type</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Space</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.docs.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">
                             <Link to={`/documents/${doc.id}`} className="hover:text-blue-600 hover:underline">{doc.title}</Link>
                             {doc.tags && <div className="text-slate-500 text-xs font-normal mt-0.5 flex items-center gap-1"><span className="bg-slate-100 px-1 rounded">{doc.tags}</span></div>}
                          </td>
                          <td className="px-6 py-3 text-slate-600">{doc.itemType}</td>
                          <td className="px-6 py-3 text-slate-600">{spaces[doc.spaceId] || 'Unknown'}</td>
                          <td className="px-6 py-3 text-right">
                            <Link to={`/documents/${doc.id}`}>
                               <Button variant="ghost" className="text-xs py-1 h-auto">Open Document</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* Announcements Results */}
          {results.announcements.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
                  <Bell className="text-orange-500" size={20} />
                  <h2>Announcements ({results.announcements.length})</h2>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-700">Title</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Audience</th>
                        <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.announcements.map(ann => (
                        <tr key={ann.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">
                             <Link to={`/announcements/${ann.id}`} className="hover:text-blue-600 hover:underline">{ann.title}</Link>
                             <div className="text-slate-500 text-xs font-normal truncate max-w-md">{ann.message}</div>
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                             {ann.audienceType}
                             {ann.spaceId && <span className="text-xs block text-slate-400">in {spaces[ann.spaceId]}</span>}
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-xs">
                             {new Date(ann.createdOn).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Link to={`/announcements/${ann.id}`}>
                               <Button variant="ghost" className="text-xs py-1 h-auto">Open Announcement</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
