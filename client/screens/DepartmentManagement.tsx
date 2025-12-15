
import React, { useState, useEffect } from 'react';
import { User, Department } from '../types';
import { getDepartments, deleteDepartment } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Ban } from 'lucide-react';

interface DepartmentManagementProps {
  currentUser: User;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ currentUser }) => {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, [currentUser.companyId]);

  const fetchDepartments = () => {
    setDepartments(getDepartments(currentUser.companyId));
  };

  const handleDisable = async (id: string) => {
    if(!window.confirm('Disable this department? Users linked to it will remain, but it will be hidden from new selections.')) return;
    await deleteDepartment(id);
    fetchDepartments();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500">Manage company departments structure.</p>
        </div>
        <Link to="/departments/new">
            <Button>
                <Plus size={18} /> Add Department
            </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Order</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map(dept => (
                <tr key={dept.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{dept.name}</td>
                  <td className="px-6 py-4 text-slate-600">{dept.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{dept.displayOrder}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {dept.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link to={`/departments/${dept.id}/edit`}>
                            <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                                <Edit2 size={16} />
                            </button>
                        </Link>
                        {dept.isActive && (
                            <button onClick={() => handleDisable(dept.id)} className="p-1 text-slate-400 hover:text-red-600" title="Disable">
                                <Ban size={16} />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
