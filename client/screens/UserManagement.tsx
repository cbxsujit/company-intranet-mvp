

import React, { useState, useEffect } from 'react';
import { User, RoleType, SEED_ROLES, Department, Space, SpaceRole, SpaceMember } from '../types';
import { getUsers, addUser, updateUser, deleteUser, getDepartments, getSpaces, getUserMemberships, addSpaceMember, updateSpaceMember } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Edit2, Trash2, X, Shield, Check } from 'lucide-react';
import { UpgradeModal } from '../components/UpgradeModal';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]); // All available spaces
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    password: string;
    designation: string;
    department: string; // text field
    departmentId: string; // structured field
    status: 'active' | 'inactive';
    role: RoleType;
  }>({
    fullName: '',
    email: '',
    password: '',
    designation: '',
    department: '', // text field
    departmentId: '', // structured field
    status: 'active',
    role: RoleType.Member
  });

  // Track selected spaces for Space Manager role
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);

  const fetchUsers = () => {
    setUsers(getUsers(currentUser.companyId));
  };

  useEffect(() => {
    fetchUsers();
    setDepartments(getDepartments(currentUser.companyId).filter(d => d.isActive));
    setSpaces(getSpaces(currentUser.companyId));
  }, [currentUser.companyId]);

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    setError('');
    setSelectedSpaceIds([]); // Reset selections

    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        designation: user.designation,
        department: user.department,
        departmentId: user.departmentId || '',
        status: user.status,
        role: user.role
      });

      // If editing a Space Manager, load their spaces
      if (user.role === RoleType.SpaceManager) {
          const memberships = getUserMemberships(user.id);
          const managerSpaceIds = memberships
              .filter(m => m.roleInSpace === SpaceRole.SpaceManager)
              .map(m => m.spaceId);
          setSelectedSpaceIds(managerSpaceIds);
      }
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        designation: '',
        department: '',
        departmentId: '',
        status: 'active',
        role: RoleType.Member
      });
    }
    setIsModalOpen(true);
  };

  const toggleSpaceSelection = (spaceId: string) => {
      setSelectedSpaceIds(prev => 
          prev.includes(spaceId) 
              ? prev.filter(id => id !== spaceId) 
              : [...prev, spaceId]
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for Space Manager
    if (formData.role === RoleType.SpaceManager && selectedSpaceIds.length === 0) {
        setError('Please select at least one space for the Space Manager.');
        return;
    }

    try {
      let savedUser: User;

      if (editingUser) {
        savedUser = await updateUser({ ...editingUser, ...formData });
      } else {
        savedUser = await addUser({ ...formData, companyId: currentUser.companyId });
      }

      // Handle Space Memberships for Space Manager
      if (formData.role === RoleType.SpaceManager) {
          const currentMemberships = getUserMemberships(savedUser.id);
          
          // 1. Remove (deactivate) memberships for spaces NOT in selected list
          for (const member of currentMemberships) {
              if (member.roleInSpace === SpaceRole.SpaceManager && !selectedSpaceIds.includes(member.spaceId)) {
                  await updateSpaceMember({ ...member, isActive: false });
              }
          }

          // 2. Add or Update memberships for selected spaces
          for (const spaceId of selectedSpaceIds) {
              const existing = currentMemberships.find(m => m.spaceId === spaceId);
              if (existing) {
                  // Ensure it's active and has correct role
                  if (!existing.isActive || existing.roleInSpace !== SpaceRole.SpaceManager) {
                      await updateSpaceMember({ ...existing, isActive: true, roleInSpace: SpaceRole.SpaceManager });
                  }
              } else {
                  // Create new
                  await addSpaceMember({
                      userId: savedUser.id,
                      spaceId: spaceId,
                      roleInSpace: SpaceRole.SpaceManager,
                      isActive: true
                  });
              }
          }
      } else if (editingUser && (editingUser.role as string) === RoleType.SpaceManager && formData.role !== RoleType.SpaceManager) {
          // If downgrading from Space Manager, remove all manager roles
          const currentMemberships = getUserMemberships(savedUser.id);
          for (const member of currentMemberships) {
               if (member.roleInSpace === SpaceRole.SpaceManager) {
                   await updateSpaceMember({ ...member, isActive: false }); // Or downgrade to Member if desired, but removing access is safer default
               }
          }
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      if (err.message.includes('Your plan allows up to')) {
          setIsModalOpen(false);
          setShowUpgradeModal(true);
      } else {
          setError(err.message);
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await deleteUser(userId, currentUser);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getDeptName = (user: User) => {
      if (user.departmentId) {
          const d = departments.find(dept => dept.id === user.departmentId);
          if (d) return d.name;
      }
      return user.department;
  };

  return (
    <div className="space-y-6">
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Unlimited Users"
        message="Your plan allows up to 50 users. Upgrade to Pro for unlimited users."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage access and roles for your company.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus size={18} /> Add User
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search users..." 
          className="flex-1 outline-none text-slate-700 placeholder-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{user.fullName}</div>
                      <div className="text-slate-500 text-xs">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === RoleType.SpaceManager ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{getDeptName(user)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(user)} className="p-1 text-slate-400 hover:text-blue-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    <Input label="Designation" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                  </div>
                  
                  <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  {!editingUser && (
                    <Input label="Password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department (Structured)</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.departmentId}
                            onChange={e => setFormData({...formData, departmentId: e.target.value})}
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <Input 
                        label="Department (Text Fallback)" 
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as RoleType})}
                        >
                          {SEED_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Space Selection Logic - ONLY if SpaceManager */}
                  {formData.role === RoleType.SpaceManager && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <Shield size={16} className="text-purple-600" />
                              Assign Spaces to Manage
                          </div>
                          <p className="text-xs text-slate-500">Select the spaces this user will manage.</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto pr-2">
                              {spaces.map(space => (
                                  <label 
                                    key={space.id} 
                                    className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${selectedSpaceIds.includes(space.id) ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                  >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSpaceIds.includes(space.id) ? 'bg-purple-600 border-purple-600' : 'border-slate-400'}`}>
                                          {selectedSpaceIds.includes(space.id) && <Check size={12} className="text-white" />}
                                      </div>
                                      <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={selectedSpaceIds.includes(space.id)}
                                          onChange={() => toggleSpaceSelection(space.id)}
                                      />
                                      <span className="text-sm text-slate-700 truncate">{space.spaceName}</span>
                                  </label>
                              ))}
                              {spaces.length === 0 && (
                                  <div className="col-span-full text-center text-sm text-slate-400 italic">No spaces available. Create spaces first.</div>
                              )}
                          </div>
                      </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-100">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Save User</Button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};