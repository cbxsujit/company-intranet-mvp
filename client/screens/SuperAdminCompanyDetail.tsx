
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { User, Company, RoleType, PlanType } from '../types';
import { getCompany, updateCompany, getCompanyStats } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Save, Building2, Users, Grid, FileText, Link as LinkIcon, ExternalLink, Shield } from 'lucide-react';

interface SuperAdminCompanyDetailProps {
  currentUser: User;
}

export const SuperAdminCompanyDetail: React.FC<SuperAdminCompanyDetailProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable form state
  const [formData, setFormData] = useState({
      planType: PlanType.Basic,
      isActive: true,
      maxUsers: 10,
      notes: ''
  });

  useEffect(() => {
    if (currentUser.role !== RoleType.SuperAdmin) {
        navigate('/');
        return;
    }
    if (id) {
        const comp = getCompany(id);
        if (comp) {
            setCompany(comp);
            setFormData({
                planType: comp.planType || PlanType.Basic,
                isActive: comp.isActive ?? true,
                maxUsers: comp.maxUsers || 10,
                notes: comp.notes || ''
            });
            setStats(getCompanyStats(id));
        } else {
            setError('Company not found');
        }
    }
  }, [id, currentUser, navigate]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!company) return;
      
      setLoading(true);
      try {
          await updateCompany({
              ...company,
              planType: formData.planType,
              isActive: formData.isActive,
              maxUsers: formData.maxUsers,
              notes: formData.notes
          });
          // No need to navigate away, just confirm save
          alert('Company settings updated successfully.');
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleOpenAsAdmin = () => {
      alert("Impersonation feature requires context switching not fully implemented in MVP. You can view Admin Users below.");
  };

  if (!company) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/super-admin/companies" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{company.companyName}</h1>
                    <p className="text-sm text-slate-500">Company Details</p>
                </div>
            </div>
            <Button variant="secondary" onClick={handleOpenAsAdmin}>
                <ExternalLink size={16} className="mr-2" /> Open Company as Admin
            </Button>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Settings Form */}
            <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Company Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600">{company.companyName}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Admin Email</label>
                            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600">{company.primaryAdminEmail}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.planType}
                                onChange={e => setFormData({...formData, planType: e.target.value as PlanType})}
                            >
                                {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Users Limit</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.maxUsers}
                                onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes (Super Admin Only)</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            placeholder="Add notes about this customer..."
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="isActive"
                            checked={formData.isActive}
                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700 font-medium">Company Active</label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={loading}>
                            <Save size={16} className="mr-2" /> Save Company Settings
                        </Button>
                    </div>
                </form>

                {/* Admin Users Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Primary Admin Users</h3>
                    {stats?.admins && stats.admins.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-semibold">Name</th>
                                    <th className="pb-2 font-semibold">Email</th>
                                    <th className="pb-2 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.admins.map((u: any) => (
                                    <tr key={u.id}>
                                        <td className="py-2 font-medium text-slate-900">{u.fullName}</td>
                                        <td className="py-2 text-slate-600">{u.email}</td>
                                        <td className="py-2"><span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">{u.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-slate-500 text-sm">No admin users found.</p>
                    )}
                </div>
            </div>

            {/* Right: Stats */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Company Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users className="text-blue-500" size={20} />
                                <span className="text-slate-700 font-medium">Users</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{stats?.userCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Grid className="text-indigo-500" size={20} />
                                <span className="text-slate-700 font-medium">Spaces</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{stats?.spaceCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="text-emerald-500" size={20} />
                                <span className="text-slate-700 font-medium">Pages</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{stats?.pageCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <LinkIcon className="text-orange-500" size={20} />
                                <span className="text-slate-700 font-medium">Documents</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{stats?.docCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
