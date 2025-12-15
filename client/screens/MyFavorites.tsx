
import React, { useState, useEffect } from 'react';
import { User, FavoriteItem, EntityType, Page, DocumentItem, Space, RoleType, SpaceRole } from '../types';
import { getFavorites, toggleFavorite, getPage, getDocument, getSpaceById, checkSpaceAccess, getMemberRole } from '../services/mockDb';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Star, FileText, Link as LinkIcon, Grid, ArrowRight, Trash2 } from 'lucide-react';

interface MyFavoritesProps {
  currentUser: User;
}

export const MyFavorites: React.FC<MyFavoritesProps> = ({ currentUser }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, [currentUser]);

  const fetchFavorites = () => {
    const favs = getFavorites(currentUser.id);
    setFavorites(favs);

    // Resolve entities
    const resolvedPages: Page[] = [];
    const resolvedDocs: DocumentItem[] = [];
    const resolvedSpaces: Space[] = [];

    favs.forEach(f => {
        if (f.entityType === EntityType.Page) {
            const p = getPage(f.entityId);
            if (p) resolvedPages.push(p);
        } else if (f.entityType === EntityType.DocumentItem) {
            const d = getDocument(f.entityId);
            if (d) resolvedDocs.push(d);
        } else if (f.entityType === EntityType.Space) {
            const s = getSpaceById(f.entityId);
            if (s) resolvedSpaces.push(s);
        }
    });

    setPages(resolvedPages);
    setDocs(resolvedDocs);
    setSpaces(resolvedSpaces);
  };

  const handleRemove = async (fav: FavoriteItem) => {
      await toggleFavorite(currentUser.companyId, currentUser.id, fav.entityType, fav.entityId);
      fetchFavorites();
  };

  // Group favorites for rendering
  const pageFavs = favorites.filter(f => f.entityType === EntityType.Page);
  const docFavs = favorites.filter(f => f.entityType === EntityType.DocumentItem);
  const spaceFavs = favorites.filter(f => f.entityType === EntityType.Space);

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">My Favorites</h1>
            <p className="text-sm text-slate-500">Quick access to your important items.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Favorite Pages */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-200 pb-2">
                     <FileText className="text-blue-500" size={20} />
                     <h2>Favorite Pages</h2>
                 </div>
                 {pageFavs.length === 0 ? (
                     <p className="text-slate-500 text-sm italic">No pages favorited yet.</p>
                 ) : (
                     <div className="space-y-2">
                         {pageFavs.map(fav => {
                             const page = pages.find(p => p.id === fav.entityId);
                             if (!page) return null;
                             return (
                                 <div key={fav.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                                     <div className="flex-1 min-w-0">
                                         <Link to={`/pages/${page.id}`} className="font-medium text-slate-900 hover:text-blue-600 block truncate">
                                             {page.pageTitle}
                                         </Link>
                                         <p className="text-xs text-slate-500">{new Date(page.updatedOn).toLocaleDateString()}</p>
                                     </div>
                                     <button onClick={() => handleRemove(fav)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 )}
            </div>

            {/* Favorite Documents */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-200 pb-2">
                     <LinkIcon className="text-emerald-500" size={20} />
                     <h2>Favorite Documents</h2>
                 </div>
                 {docFavs.length === 0 ? (
                     <p className="text-slate-500 text-sm italic">No documents favorited yet.</p>
                 ) : (
                     <div className="space-y-2">
                         {docFavs.map(fav => {
                             const doc = docs.find(d => d.id === fav.entityId);
                             if (!doc) return null;
                             return (
                                 <div key={fav.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                                     <div className="flex-1 min-w-0">
                                         <Link to={`/documents/${doc.id}`} className="font-medium text-slate-900 hover:text-blue-600 block truncate">
                                             {doc.title}
                                         </Link>
                                         <p className="text-xs text-slate-500">{doc.itemType}</p>
                                     </div>
                                     <button onClick={() => handleRemove(fav)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 )}
            </div>

            {/* Favorite Spaces */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-200 pb-2">
                     <Grid className="text-indigo-500" size={20} />
                     <h2>Favorite Spaces</h2>
                 </div>
                 {spaceFavs.length === 0 ? (
                     <p className="text-slate-500 text-sm italic">No spaces favorited yet.</p>
                 ) : (
                     <div className="space-y-2">
                         {spaceFavs.map(fav => {
                             const space = spaces.find(s => s.id === fav.entityId);
                             if (!space) return null;
                             return (
                                 <div key={fav.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                                     <div className="flex-1 min-w-0">
                                         <Link to={`/pages?spaceId=${space.id}`} className="font-medium text-slate-900 hover:text-blue-600 block truncate">
                                             {space.spaceName}
                                         </Link>
                                         <p className="text-xs text-slate-500 truncate">{space.description}</p>
                                     </div>
                                     <button onClick={() => handleRemove(fav)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 )}
            </div>

        </div>
    </div>
  );
};
