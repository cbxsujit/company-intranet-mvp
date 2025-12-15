
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Announcement, AnnouncementAudience, Space, RoleType, SpaceRole } from '../types';
import { getAnnouncements, getSpaces, getUserById, checkSpaceAccess, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Plus, Search, Eye, Edit2, Bell, Pin, Filter, Image } from 'lucide-react';

interface AnnouncementsListProps {
  currentUser: User;
}

export const AnnouncementsList: React.FC<AnnouncementsListProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); 

  const [spaceMap, setSpaceMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const rawAnnouncements = getAnnouncements(currentUser.companyId);
    const rawSpaces = getSpaces(currentUser.companyId);
    
    const visibleAnnouncements = rawAnnouncements.filter(a => {
        if (a.audienceType === AnnouncementAudience.CompanyWide) return true;
        if (!a.spaceId) return true; 
        return checkSpaceAccess(a.spaceId, currentUser.id);
    });

    setAnnouncements(visibleAnnouncements.sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()));
    setSpaces(rawSpaces); 
    
    const sMap: Record<string, string> = {};
    rawSpaces.forEach(s => sMap[s.id] = s.spaceName);
    setSpaceMap(sMap);

    const uMap: Record<string, string> = {};
    visibleAnnouncements.forEach(a => {
        if (!uMap[a.createdBy]) {
            const u = getUserById(a.createdBy);
            if (u) uMap[a.createdBy] = u.fullName;
        }
    });
    setUserMap(uMap);
  }, [currentUser.companyId, currentUser.id]);

  const hasCreatePermission = currentUser.role === RoleType.CompanyAdmin || spaces.some(s => {
      return currentUser.role === RoleType.SpaceManager || getMemberRole(s.id, currentUser.id) === SpaceRole.SpaceManager;
  });

  const filtered = announcements.filter(a => {
    if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedAudience && a.audienceType !== selectedAudience) return false;
    if (selectedStatus === 'active' && !a.isActive) return false;
    if (selectedStatus === 'inactive' && a.isActive) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500">Company news and updates.</p>
        </div>
        {hasCreatePermission && (
          <Link to="/announcements/new">
            <Button>
              <Plus size={18} /> Create Announcement
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search by title..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
             <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={selectedAudience}
                    onChange={e => setSelectedAudience(e.target.value)}
                >
                    <option value="">All Audiences</option>
                    <option value={AnnouncementAudience.CompanyWide}>Company Wide</option>
                    <option value={AnnouncementAudience.SpaceSpecific}>Space Specific</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Title</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Audience</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Space</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Created</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const canManage = currentUser.role === RoleType.CompanyAdmin || (item.spaceId && getMemberRole(item.spaceId, currentUser.id) === SpaceRole.SpaceManager);
                return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            {item.announcementImageURL && (
                                <img src={item.announcementImageURL} alt="" className="h-10 w-16 object-cover rounded border border-slate-200" />
                            )}
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    {item.isPinned && <Pin size={14} className="text-red-500 shrink-0" />}
                                    <div className="font-medium text-slate-900">{item.title}</div>
                                </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${item.audienceType === AnnouncementAudience.CompanyWide ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.audienceType === AnnouncementAudience.CompanyWide ? 'Company Wide' : 'Space Specific'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.spaceId ? spaceMap[item.spaceId] : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                         <div>{new Date(item.createdOn).toLocaleDateString()}</div>
                         <div>by {userMap[item.createdBy] || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/announcements/${item.id}`} className="p-1 text-slate-400 hover:text-blue-600" title="View">
                            <Eye size={16} />
                          </Link>
                          {canManage && (
                            <Link to={`/announcements/${item.id}/edit`} className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                                <Edit2 size={16} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                );
              })}
               {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No announcements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
