
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RoleType, PlanType } from '../types';
import { createCompany } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Building2, CheckCircle } from 'lucide-react';

interface SuperAdminCreateCompanyProps {
  currentUser: User;
}

export const SuperAdminCreateCompany: React.FC<SuperAdminCreateCompanyProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{companyName: string, adminEmail: string, tempPass: string} | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    primaryAdminFullName: '',
    primaryAdminEmail: '',
    planType: PlanType.Basic,
    maxUsers: 10
  });

  useEffect(() => {
    if (currentUser.role !== RoleType.SuperAdmin) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tempPassword = "Welcome123!"; // Mock password generation
      
      await createCompany(
        formData.companyName,
        '', // No logo URL initially
        {
          fullName: formData.primaryAdminFullName,
          email: formData.primaryAdminEmail,
          password: tempPassword,
          designation: 'Company Administrator',
          department: 'Administration'
        },
        formData.planType,
        formData.maxUsers
      );

      setSuccess({
          companyName: formData.companyName,
          adminEmail: formData.primaryAdminEmail,
          tempPass: tempPassword
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
      return (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                      <CheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Company Created Successfully</h2>
                  <p className="text-green-700 mb-6">
                      The workspace for <strong>{success.companyName}</strong> is ready.
                  </p>
                  
                  <div className="bg-white p-4 rounded-lg border border-green-100 text-left space-y-2 mb-6 shadow-sm">
                      <p className="text-sm text-slate-500 uppercase font-bold">Admin Credentials</p>
                      <div>
                          <span className="text-slate-500 text-sm block">Email:</span>
                          <span className="font-mono font-medium text-slate-900">{success.adminEmail}</span>
                      </div>
                      <div>
                          <span className="text-slate-500 text-sm block">Temporary Password:</span>
                          <span className="font-mono font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">{success.tempPass}</span>
                      </div>
                  </div>

                  <p className="text-sm text-green-800 mb-6">
                      Please share these login details securely with the primary administrator.
                  </p>

                  <Button onClick={() => navigate('/super-admin/companies')}>Back to Company List</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/super-admin/companies')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Create New Company</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
            {/* Company Details */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Building2 size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">Company Details</h3>
                </div>
                
                <Input 
                    label="Company Name" 
                    value={formData.companyName} 
                    onChange={e => handleChange('companyName', e.target.value)} 
                    placeholder="e.g. Acme Corp"
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.planType}
                            onChange={e => handleChange('planType', e.target.value as PlanType)}
                        >
                            {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Users</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.maxUsers}
                            onChange={e => handleChange('maxUsers', parseInt(e.target.value))}
                            min="1"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Primary Admin Details */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <div className="bg-indigo-100 p-1 rounded text-indigo-600 font-bold text-xs">ADMIN</div>
                    <h3 className="text-lg font-bold text-slate-900">Primary Administrator</h3>
                </div>

                <Input 
                    label="Admin Full Name" 
                    value={formData.primaryAdminFullName} 
                    onChange={e => handleChange('primaryAdminFullName', e.target.value)} 
                    placeholder="e.g. John Doe"
                    required
                />

                <Input 
                    label="Admin Email" 
                    type="email"
                    value={formData.primaryAdminEmail} 
                    onChange={e => handleChange('primaryAdminEmail', e.target.value)} 
                    placeholder="admin@acmecorp.com"
                    required
                />
                <p className="text-xs text-slate-500">A temporary password will be generated automatically.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <Button type="button" variant="secondary" onClick={() => navigate('/super-admin/companies')}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Create Company</Button>
            </div>
      </form>
    </div>
  );
};
