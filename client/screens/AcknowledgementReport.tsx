

import React, { useState, useEffect } from 'react';
import { User, EntityType, Announcement, DocumentItem, ReadAcknowledgement, RoleType, Department } from '../types';
import { getAnnouncements, getDocuments, getAcknowledgementsByEntity, getUsers, getDepartments } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { CheckCircle, Filter, FileText, Bell } from 'lucide-react';

interface AcknowledgementReportProps {
  currentUser: User;
}

export const AcknowledgementReport: React.FC<AcknowledgementReportProps> = ({ currentUser }) => {
  const [selectedType, setSelectedType] = useState<EntityType>(EntityType.Announcement);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  
  const [items, setItems] = useState<(Announcement | DocumentItem)[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  
  // Helpers
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);

  useEffect(() => {
    // Only admins
    if (currentUser.role !== RoleType.CompanyAdmin) return;
    
    setUsers(getUsers(currentUser.companyId));
    setDepts(getDepartments(currentUser.companyId));
  }, [currentUser]);

  useEffect(() => {
    // Load Items dropdown based on type
    setSelectedItemId(''); // Reset selection
    setReportData([]);

    if (selectedType === EntityType.Announcement) {
        const anns = getAnnouncements(currentUser.companyId).filter(a => a.isActive);
        setItems(anns.sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()));
    } else {
        const docs = getDocuments(currentUser.companyId).filter(d => d.isActive && d.isPolicy);
        setItems(docs.sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()));
    }
  }, [selectedType, currentUser.companyId]);

  useEffect(() => {
      if (!selectedItemId) {
          setReportData([]);
          return;
      }

      const acks = getAcknowledgementsByEntity(selectedItemId, selectedType);
      
      const rows = acks.map(ack => {
          const u = users.find(user => user.id === ack.userId);
          let deptName = 'Unknown';
          if (u) {
              if (u.departmentId) {
                  const d = depts.find(dept => dept.id === u.departmentId);
                  deptName = d ? d.name : u.department;
              } else {
                  deptName = u.department;
              }
          }
          return {
              id: ack.id,
              userName: u ? u.fullName : 'Unknown User',
              userEmail: u ? u.email : '-',
              department: deptName,
              acknowledgedOn: ack.acknowledgedOn
          };
      });

      setReportData(rows);
  }, [selectedItemId, selectedType, users, depts]);

  const selectedItemDetails = items.find(i => i.id === selectedItemId);

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-900">Acknowledgement Report</h1>
          <p className="text-sm text-slate-500">Track who has read important announcements and policies.</p>
       </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                   <div className="flex gap-2">
                       <button 
                           onClick={() => setSelectedType(EntityType.Announcement)}
                           className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${selectedType === EntityType.Announcement ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                       >
                           <Bell size={16} /> Announcements
                       </button>
                       <button 
                           onClick={() => setSelectedType(EntityType.DocumentItem)}
                           className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${selectedType === EntityType.DocumentItem ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                       >
                           <FileText size={16} /> Policies / Documents
                       </button>
                   </div>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
                   <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                   >
                       <option value="">-- Choose an item --</option>
                       {items.map(item => (
                           <option key={item.id} value={item.id}>
                               {('title' in item) ? item.title : 'Untitled'} ({new Date(item.createdOn).toLocaleDateString()})
                           </option>
                       ))}
                   </select>
               </div>
           </div>
       </div>

       {selectedItemId && selectedItemDetails && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{('title' in selectedItemDetails) ? selectedItemDetails.title : 'Untitled'}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span>Created: {new Date(selectedItemDetails.createdOn).toLocaleDateString()}</span>
                            <span>Type: {selectedType}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <CheckCircle size={18} />
                        Total Acknowledgements: {reportData.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">User</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Email</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Department</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Acknowledged On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{row.userName}</td>
                                    <td className="px-6 py-3 text-slate-600">{row.userEmail}</td>
                                    <td className="px-6 py-3 text-slate-600">{row.department}</td>
                                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">{new Date(row.acknowledgedOn).toLocaleString()}</td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        No acknowledgements recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
           </div>
       )}
    </div>
  );
};
