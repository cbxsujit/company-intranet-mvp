
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Space, SpaceMember, SpaceRole, RoleType } from '../types';
import { getSpaceById, getSpaceMembers, getUsers, addSpaceMember, updateSpaceMember, checkSpaceAccess, getMemberRole } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';

interface SpaceMembersProps {
  currentUser: User;
}

export const SpaceMembers: React.FC<SpaceMembersProps> = ({ currentUser }) => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Member Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ userId: '', roleInSpace: SpaceRole.Member });

  useEffect(() => {
    if (!spaceId) return;

    // Check permissions
    const hasAccess = checkSpaceAccess(spaceId, currentUser.id);
    if (!hasAccess) {
        navigate('/spaces');
        return;
    }

    const s = getSpaceById(spaceId);
    if (!s) return;
    setSpace(s);

    const canManage = currentUser.role === RoleType.CompanyAdmin || getMemberRole(spaceId, currentUser.id) === SpaceRole.SpaceManager;
    if (!canManage) {
        navigate('/spaces');
        return;
    }

    refreshData();
  }, [spaceId, currentUser.id, navigate]);

  const refreshData = () => {
    if (!spaceId) return;
    setMembers(getSpaceMembers(spaceId));
    setAllUsers(getUsers(currentUser.companyId));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId || !newUserForm.userId) return;
    setLoading(true);
    try {
        await addSpaceMember({
            spaceId,
            userId: newUserForm.userId,
            roleInSpace: newUserForm.roleInSpace,
            isActive: true
        });
        setIsModalOpen(false);
        setNewUserForm({ userId: '', roleInSpace: SpaceRole.Member });
        refreshData();
    } catch (err) {
        alert(err);
    } finally {
        setLoading(false);
    }
  };

  const handleToggleActive = async (member: SpaceMember) => {
    try {
        await updateSpaceMember({ ...member, isActive: !member.isActive });
        refreshData();
    } catch (err) {
        console.error(err);
    }
  };

  const handleRoleChange = async (member: SpaceMember, newRole: SpaceRole) => {
      try {
          await updateSpaceMember({ ...member, roleInSpace: newRole });
          refreshData();
      } catch (err) {
          console.error(err);
      }
  };

  // Helper to enrich member data
  const getMemberDetails = (userId: string) => allUsers.find(u => u.id === userId);

  // Filter users not already in space (active)
  const availableUsers = allUsers.filter(u => !members.some(m => m.userId === u.id && m.isActive));

  if (!space) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link to="/spaces" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ChevronLeft size={24} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manage Members</h1>
                <p className="text-sm text-slate-500">for Space: {space.spaceName}</p>
            </div>
        </div>

        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Current Members</h2>
            <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Add Member
            </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Role in Space</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Joined On</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {members.map(member => {
                        const user = getMemberDetails(member.userId);
                        return (
                            <tr key={member.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {user?.fullName || 'Unknown User'}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {user?.email || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 cursor-pointer"
                                        value={member.roleInSpace}
                                        onChange={(e) => handleRoleChange(member, e.target.value as SpaceRole)}
                                    >
                                        <option value={SpaceRole.SpaceManager}>Manager</option>
                                        <option value={SpaceRole.Member}>Member</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {member.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {new Date(member.createdOn).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleToggleActive(member)}
                                        className={`text-sm font-medium ${member.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                                    >
                                        {member.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {members.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">No members found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {isModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">Add Space Member</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleAddMember} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select User</label>
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newUserForm.userId}
                                onChange={e => setNewUserForm({...newUserForm, userId: e.target.value})}
                                required
                            >
                                <option value="" disabled>Choose a user</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role in Space</label>
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newUserForm.roleInSpace}
                                onChange={e => setNewUserForm({...newUserForm, roleInSpace: e.target.value as SpaceRole})}
                            >
                                <option value={SpaceRole.Member}>Member</option>
                                <option value={SpaceRole.SpaceManager}>Space Manager</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" isLoading={loading}>Add Member</Button>
                        </div>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};
