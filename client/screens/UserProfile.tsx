
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Department, Space, SpaceMember } from '../types';
import { getUserById, getDepartments, getUserMemberships, getSpaceById } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { ChevronLeft, User as UserIcon, Mail, Briefcase, Grid, MapPin } from 'lucide-react';

interface UserProfileProps {
  currentUser: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [deptName, setDeptName] = useState('');
  const [spaces, setSpaces] = useState<{spaceName: string, role: string}[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchedUser = getUserById(userId);
    if (!fetchedUser || fetchedUser.companyId !== currentUser.companyId) {
        navigate('/directory'); // Or 404
        return;
    }
    setUser(fetchedUser);

    // Resolve Department
    if (fetchedUser.departmentId) {
        const depts = getDepartments(currentUser.companyId);
        const d = depts.find(dept => dept.id === fetchedUser.departmentId);
        setDeptName(d ? d.name : fetchedUser.department);
    } else {
        setDeptName(fetchedUser.department);
    }

    // Resolve Spaces
    const memberships = getUserMemberships(userId);
    const spaceList = memberships.map(m => {
        const s = getSpaceById(m.spaceId);
        return s ? { spaceName: s.spaceName, role: m.roleInSpace } : null;
    }).filter(Boolean) as {spaceName: string, role: string}[];
    setSpaces(spaceList);

  }, [userId, currentUser.companyId, navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link to="/directory" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 w-full"></div>
             <div className="px-8 pb-8">
                 <div className="relative -mt-16 mb-6">
                     <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-500">
                         {user.fullName.charAt(0)}
                     </div>
                 </div>

                 <div className="mb-6">
                     <h2 className="text-3xl font-bold text-slate-900">{user.fullName}</h2>
                     <p className="text-lg text-slate-500">{user.designation}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex items-center gap-3 text-slate-700">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={20}/></div>
                         <div>
                             <p className="text-xs text-slate-500 font-bold uppercase">Email</p>
                             <p className="font-medium">{user.email}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3 text-slate-700">
                         <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Briefcase size={20}/></div>
                         <div>
                             <p className="text-xs text-slate-500 font-bold uppercase">Department</p>
                             <p className="font-medium">{deptName}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3 text-slate-700">
                         <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><UserIcon size={20}/></div>
                         <div>
                             <p className="text-xs text-slate-500 font-bold uppercase">Role</p>
                             <p className="font-medium">{user.role}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3 text-slate-700">
                         <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MapPin size={20}/></div>
                         <div>
                             <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
                             <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                 {user.status}
                             </span>
                         </div>
                     </div>
                 </div>
             </div>
        </div>

        {spaces.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <div className="flex items-center gap-2 mb-4 font-bold text-slate-900 text-lg">
                     <Grid size={20} className="text-indigo-500"/>
                     <h3>Spaces</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {spaces.map((s, i) => (
                         <div key={i} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50">
                             <span className="font-medium text-slate-800">{s.spaceName}</span>
                             <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{s.role}</span>
                         </div>
                     ))}
                 </div>
             </div>
        )}
    </div>
  );
};
