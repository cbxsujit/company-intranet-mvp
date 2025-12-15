
import React, { useState, useEffect } from 'react';
import { User, Department, RoleType } from '../types';
import { getUsers, getDepartments } from '../services/mockDb';
import { Link } from 'react-router-dom';
import { Search, Filter, User as UserIcon, ArrowRight, Mail, Phone, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface PeopleDirectoryProps {
  currentUser: User;
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const allUsers = getUsers(currentUser.companyId).filter(u => u.status === 'active');
    setUsers(allUsers);
    const allDepts = getDepartments(currentUser.companyId).filter(d => d.isActive);
    setDepartments(allDepts);
  }, [currentUser.companyId]);

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
        const lowerQ = searchTerm.toLowerCase();
        const matches = user.fullName.toLowerCase().includes(lowerQ) || user.email.toLowerCase().includes(lowerQ);
        if (!matches) return false;
    }
    if (selectedRole && user.role !== selectedRole) return false;
    if (selectedDept) {
        if (user.departmentId) {
            if (user.departmentId !== selectedDept) return false;
        } else {
            const deptObj = departments.find(d => d.id === selectedDept);
            if (!deptObj || user.department.toLowerCase() !== deptObj.name.toLowerCase()) return false;
        }
    }
    return true;
  });

  const getDeptName = (user: User) => {
      if (user.departmentId) {
          const d = departments.find(dept => dept.id === user.departmentId);
          if (d) return d.name;
      }
      return user.department;
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
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                      <div className="space-y-1">
                          <button onClick={() => setSelectedDept('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedDept ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Departments</button>
                          {departments.map(d => (
                              <button key={d.id} onClick={() => setSelectedDept(d.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedDept === d.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{d.name}</button>
                          ))}
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                      <div className="space-y-1">
                          <button onClick={() => setSelectedRole('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedRole ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Roles</button>
                          {Object.values(RoleType).map(r => (
                              <button key={r} onClick={() => setSelectedRole(r)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedRole === r ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{r}</button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </aside>

      <main className="lg:col-span-3 space-y-6">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">People Directory</h1>
             <p className="text-sm text-slate-500">Find and connect with colleagues.</p>
          </div>

          {/* Search and Mobile Filters */}
          <div className="space-y-3">
             <div className="flex gap-3">
                 <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Search by name or email..." 
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
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                          <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                              <option value="">All Departments</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                          <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                              <option value="">All Roles</option>
                              {Object.values(RoleType).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      </div>
                 </div>
             )}
          </div>

          {/* Desktop Table (Hidden on Mobile/Tablet) */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Designation</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Connect</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold">
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{user.fullName}</div>
                                                <div className="text-slate-500 text-xs flex items-center gap-1"><Mail size={10}/> {user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.designation}</td>
                                    <td className="px-6 py-4 text-slate-600">{getDeptName(user)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <a href={`mailto:${user.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" title="Send Email">
                                                <Mail size={16} />
                                            </a>
                                            {/* WhatsApp Button - Shows only if number exists */}
                                            {user.whatsappNumber ? (
                                                <a 
                                                    href={`https://wa.me/${user.whatsappNumber}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" 
                                                    title="Chat on WhatsApp"
                                                >
                                                    <MessageCircle size={16} />
                                                </a>
                                            ) : (
                                                 <span className="p-1.5 text-slate-300 cursor-not-allowed" title="No number available">
                                                     <MessageCircle size={16} />
                                                 </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/directory/${user.id}`}>
                                            <Button variant="ghost" className="text-xs h-8 px-3">
                                                Profile
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
           </div>

           {/* Mobile/Tablet Grid View (Visible on < LG) */}
           <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredUsers.map(user => (
                   <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                       <div className="flex items-start gap-4 mb-4">
                            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xl">
                                {user.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate text-lg">{user.fullName}</h3>
                                <p className="text-sm text-blue-600 font-medium">{user.designation}</p>
                                <div className="mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block">{getDeptName(user)}</div>
                            </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                            <a href={`mailto:${user.email}`} className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                                <Mail size={16} /> Email
                            </a>
                            {user.whatsappNumber ? (
                                <a href={`https://wa.me/${user.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                                    <MessageCircle size={16} /> WhatsApp
                                </a>
                            ) : (
                                <button disabled className="flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
                                    <MessageCircle size={16} /> No Number
                                </button>
                            )}
                       </div>
                       
                       <Link to={`/directory/${user.id}`} className="block mt-2 text-center">
                           <Button variant="ghost" className="w-full text-xs">View Full Profile</Button>
                       </Link>
                   </div>
               ))}
               {filteredUsers.length === 0 && (
                   <div className="col-span-full text-center py-12 text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                       No users found.
                   </div>
               )}
           </div>
      </main>
    </div>
  );
};
