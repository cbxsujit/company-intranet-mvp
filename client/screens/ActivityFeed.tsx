
import React, { useState, useEffect } from 'react';
import { User, ActivityLog, EntityType, ActionType } from '../types';
import { getActivities, getUsers, getUserById } from '../services/mockDb';
import { Activity, Filter } from 'lucide-react';

interface ActivityFeedProps {
  currentUser: User;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  useEffect(() => {
    const allLogs = getActivities(currentUser.companyId);
    setLogs(allLogs);

    // Resolve Users
    const uMap: Record<string, string> = {};
    const users = getUsers(currentUser.companyId);
    users.forEach(u => uMap[u.id] = u.fullName);
    setUserMap(uMap);
  }, [currentUser.companyId]);

  const filteredLogs = logs.filter(log => {
    if (filterEntity && log.entityType !== filterEntity) return false;
    if (filterAction && log.actionType !== filterAction) return false;
    return true;
  });

  const getActionColor = (action: ActionType) => {
    switch (action) {
      case ActionType.Created: return 'bg-green-100 text-green-700';
      case ActionType.Published: return 'bg-green-100 text-green-700';
      case ActionType.Updated: return 'bg-blue-100 text-blue-700';
      case ActionType.Pinned: return 'bg-orange-100 text-orange-700';
      case ActionType.Deleted: return 'bg-red-100 text-red-700';
      case ActionType.Unpublished: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Activity</h1>
          <p className="text-sm text-slate-500">Audit log of system events.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
         <div className="relative min-w-[200px]">
            <select 
                className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                value={filterEntity}
                onChange={e => setFilterEntity(e.target.value)}
            >
                <option value="">All Entities</option>
                {Object.values(EntityType).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
        <div className="relative min-w-[200px]">
            <select 
                className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
            >
                <option value="">All Actions</option>
                {Object.values(ActionType).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                         <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                         <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                         <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
                         <th className="px-6 py-4 font-semibold text-slate-700">Entity</th>
                         <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredLogs.map(log => (
                         <tr key={log.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                 {new Date(log.createdOn).toLocaleString()}
                             </td>
                             <td className="px-6 py-4 font-medium text-slate-900">
                                 {userMap[log.userId] || 'Unknown'}
                             </td>
                             <td className="px-6 py-4">
                                 <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold uppercase ${getActionColor(log.actionType)}`}>
                                     {log.actionType}
                                 </span>
                             </td>
                             <td className="px-6 py-4 text-slate-600">
                                 {log.entityType}
                             </td>
                             <td className="px-6 py-4 text-slate-700">
                                 {log.description}
                             </td>
                         </tr>
                     ))}
                     {filteredLogs.length === 0 && (
                         <tr>
                             <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                 No activity found.
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
