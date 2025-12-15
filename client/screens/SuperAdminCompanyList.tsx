
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Company, RoleType, PlanType } from '../types';
import { getAllCompanies } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Search, Filter, Building2, ShieldAlert, CheckCircle, XCircle, Plus } from 'lucide-react';

interface SuperAdminCompanyListProps {
  currentUser: User;
}

export const SuperAdminCompanyList: React.FC<SuperAdminCompanyListProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (currentUser.role !== RoleType.SuperAdmin) {
        navigate('/');
        return;
    }
    
    const all = getAllCompanies();
    // Sort by newest first
    all.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    setCompanies(all);
    setFilteredCompanies(all);
  }, [currentUser, navigate]);

  useEffect(() => {
      let result = companies;

      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          result = result.filter(c => 
              c.companyName.toLowerCase().includes(lower) || 
              c.primaryAdminEmail.toLowerCase().includes(lower)
          );
      }

      if (filterPlan) {
          result = result.filter(c => c.planType === filterPlan);
      }

      if (filterStatus) {
          const isActive = filterStatus === 'active';
          result = result.filter(c => (c.isActive ?? true) === isActive);
      }

      setFilteredCompanies(result);
  }, [companies, searchTerm, filterPlan, filterStatus]);

  const getPlanBadge = (plan?: PlanType) => {
      switch(plan) {
          case PlanType.Pro: return 'bg-purple-100 text-purple-800';
          case PlanType.Basic: return 'bg-blue-100 text-blue-800';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
            <p className="text-sm text-slate-500">Super Admin Console</p>
        </div>
        <Link to="/super-admin/companies/new">
            <Button>
                <Plus size={18} /> Create Company
            </Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search company or admin email..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={filterPlan}
                    onChange={e => setFilterPlan(e.target.value)}
                >
                    <option value="">All Plans</option>
                    {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <div className="relative min-w-[150px]">
                <select 
                    className="w-full appearance-none px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
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
                <th className="px-6 py-4 font-semibold text-slate-700">Company</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Plan</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Users Limit</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Created On</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                              <Building2 size={20} />
                          </div>
                          <div>
                              <div className="font-medium text-slate-900">{company.companyName}</div>
                              <div className="text-xs text-slate-500">{company.primaryAdminEmail}</div>
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPlanBadge(company.planType)}`}>
                          {company.planType || 'Basic'}
                      </span>
                  </td>
                  <td className="px-6 py-4">
                      {(company.isActive ?? true) ? (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                              <CheckCircle size={14} /> Active
                          </div>
                      ) : (
                          <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                              <XCircle size={14} /> Inactive
                          </div>
                      )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">
                      {company.maxUsers || 'Default'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(company.createdOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                      <Link to={`/super-admin/companies/${company.id}`}>
                          <Button variant="secondary" className="text-xs h-8 px-3">
                              View Details
                          </Button>
                      </Link>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No companies found.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
