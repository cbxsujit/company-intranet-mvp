
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Space, RoleType, SpaceRole, EntityType } from '../types';
import { getVisibleSpaces, addSpace, updateSpace, deleteSpace, getUsers, getMemberRole, checkIsFavorite, toggleFavorite } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Plus, Edit2, Trash2, X, Box, FileText, Link as LinkIcon, Users, Star, Search, Grid, AlertTriangle } from 'lucide-react';
import { UpgradeModal } from '../components/UpgradeModal';

interface SpaceManagementProps {
  currentUser: User;
}

export const SpaceManagement: React.FC<SpaceManagementProps> = ({ currentUser }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ spaceName: '', description: '', coverImageURL: '' });
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Delete Confirmation State
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);

  const fetchSpaces = () => {
    const fetchedSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    setSpaces(fetchedSpaces);
    const favs: Record<string, boolean> = {};
    fetchedSpaces.forEach(s => {
        favs[s.id] = checkIsFavorite(currentUser.id, EntityType.Space, s.id);
    });
    setFavorites(favs);
  };

  useEffect(() => {
    fetchSpaces();
  }, [currentUser.companyId, currentUser.id]);

  const handleOpenModal = (space?: Space) => {
    setError('');
    if (space) {
      setEditingSpace(space);
      setFormData({ spaceName: space.spaceName, description: space.description, coverImageURL: space.coverImageURL || '' });
    } else {
      setEditingSpace(null);
      setFormData({ spaceName: '', description: '', coverImageURL: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingSpace) {
        await updateSpace({ ...editingSpace, ...formData });
      } else {
        await addSpace({ ...formData, companyId: currentUser.companyId, createdBy: currentUser.id });
      }
      setIsModalOpen(false);
      fetchSpaces();
    } catch (err: any) {
      if (err.message.includes('Your plan allows up to')) {
          setIsModalOpen(false);
          setShowUpgradeModal(true);
      } else {
          setError(err.message);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, space: Space) => {
      e.stopPropagation(); // Critical: Prevent card click
      e.preventDefault();
      setSpaceToDelete(space);
  };

  const confirmDelete = async () => {
    if (spaceToDelete) {
        await deleteSpace(spaceToDelete.id);
        setSpaceToDelete(null);
        fetchSpaces();
    }
  };

  const handleToggleFavorite = async (spaceId: string) => {
      await toggleFavorite(currentUser.companyId, currentUser.id, EntityType.Space, spaceId);
      setFavorites(prev => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  const filteredSpaces = spaces.filter(s => s.spaceName.toLowerCase().includes(searchTerm.toLowerCase()));
  const canCreate = currentUser.role === RoleType.CompanyAdmin;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in relative">
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Unlimited Spaces"
        message="Your plan allows up to 5 Spaces. Upgrade to Pro for unlimited Spaces."
      />

      {/* Delete Confirmation Modal - High Z-Index to ensure visibility */}
      {spaceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 border border-slate-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete {spaceToDelete.spaceName}?</h3>
                    <p className="text-slate-500 mb-6">
                        This action cannot be undone. All pages, documents, and member roles associated with this space will be permanently removed.
                    </p>
                    <div className="flex gap-3 w-full">
                        <Button variant="secondary" className="flex-1" onClick={() => setSpaceToDelete(null)}>Cancel</Button>
                        <Button variant="danger" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete Space</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar: Space List for Quick Nav */}
      <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Grid size={18} className="text-indigo-600"/> Your Spaces
              </h3>
              <div className="relative mb-4">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                      type="text" 
                      placeholder="Filter..." 
                      className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <ul className="space-y-1 overflow-y-auto max-h-[400px]">
                  {filteredSpaces.map(s => (
                      <li key={s.id}>
                          <a href={`#space-${s.id}`} className="block px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-md truncate">
                              {s.spaceName}
                          </a>
                      </li>
                  ))}
                  {filteredSpaces.length === 0 && <li className="text-xs text-slate-400 italic px-2">No spaces found.</li>}
              </ul>
          </div>
          {canCreate && (
              <Button onClick={() => handleOpenModal()} className="w-full">
                  <Plus size={18} /> Create Space
              </Button>
          )}
      </aside>

      {/* Main Content: Space Cards */}
      <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-900">All Spaces</h1>
              <div className="lg:hidden">
                  {canCreate && <Button size="sm" onClick={() => handleOpenModal()}><Plus size={16} /> Create</Button>}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSpaces.map(space => {
                const memberRole = getMemberRole(space.id, currentUser.id);
                const canManage = currentUser.role === RoleType.CompanyAdmin || memberRole === SpaceRole.SpaceManager;
                const isFav = favorites[space.id];
                const isAdmin = currentUser.role === RoleType.CompanyAdmin;

                return (
                  <div key={space.id} id={`space-${space.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col group/card overflow-hidden">
                    <div className="h-32 bg-slate-50 flex items-center justify-center border-b border-slate-100 relative group">
                      {space.coverImageURL ? (
                          <img src={space.coverImageURL} alt={space.spaceName} className="w-full h-full object-cover" />
                      ) : (
                          <Box size={48} className="text-slate-300" />
                      )}
                      
                      <button 
                        onClick={() => handleToggleFavorite(space.id)}
                        className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition-opacity ${isFav ? 'bg-yellow-100 text-yellow-500 opacity-100' : 'bg-white text-slate-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}
                      >
                         <Star size={14} className={isFav ? "fill-current" : ""} />
                      </button>

                      {canManage && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenModal(space); }} 
                                className="p-1.5 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors" 
                                title="Edit Space"
                             >
                                <Edit2 size={14} />
                            </button>
                            {isAdmin && (
                                 <button 
                                    onClick={(e) => handleDeleteClick(e, space)} 
                                    className="p-1.5 bg-white rounded-full text-slate-500 hover:text-red-600 shadow-sm transition-colors" 
                                    title="Delete Space"
                                 >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{space.spaceName}</h3>
                      <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-2">{space.description}</p>
                    </div>
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                       <div className="flex gap-2">
                           <Link to={`/pages?spaceId=${space.id}`} className="text-slate-500 hover:text-blue-600 p-1" title="View Pages">
                              <FileText size={18} />
                           </Link>
                           <Link to={`/documents?spaceId=${space.id}`} className="text-slate-500 hover:text-blue-600 p-1" title="Documents">
                              <LinkIcon size={18} />
                           </Link>
                       </div>
                       {canManage && (
                           <Link to={`/spaces/${space.id}/members`}>
                               <Button variant="ghost" className="text-xs h-7 px-2">
                                   <Users size={14} className="mr-1"/> Members
                               </Button>
                           </Link>
                       )}
                    </div>
                  </div>
                );
            })}
            {filteredSpaces.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-slate-500">No spaces found.</p>
              </div>
            )}
          </div>
      </main>

      {isModalOpen && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editingSpace ? 'Edit Space' : 'Create New Space'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              <Input label="Space Name" required value={formData.spaceName} onChange={e => setFormData({...formData, spaceName: e.target.value})} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <ImageUpload 
                  label="Cover Image (Optional)"
                  value={formData.coverImageURL}
                  onChange={(url) => setFormData({...formData, coverImageURL: url})}
              />

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingSpace ? 'Save Changes' : 'Create Space'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
