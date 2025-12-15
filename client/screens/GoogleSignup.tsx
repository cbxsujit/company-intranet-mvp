
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyInviteCode, addUser } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, RoleType } from '../types';
import { CheckCircle, Building2, AlertCircle } from 'lucide-react';

interface GoogleSignupProps {
  onLogin: (user: User) => void;
}

export const GoogleSignup: React.FC<GoogleSignupProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // From Google Login
  const profile = location.state?.profile;

  const [formData, setFormData] = useState({
    fullName: profile?.name || '',
    inviteCode: '',
    designation: '',
    department: ''
  });

  useEffect(() => {
      if (!profile) {
          navigate('/login');
      }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verify Invite Code
      const company = await verifyInviteCode(formData.inviteCode);
      
      if (!company) {
          throw new Error('Invalid invite code. Please contact your administrator.');
      }

      // 2. Create User
      const newUser = await addUser({
          fullName: formData.fullName,
          email: profile.email,
          password: 'google_oauth_user', // Dummy password, realistically handled by auth provider
          designation: formData.designation,
          department: formData.department,
          companyId: company.id,
          status: 'active',
          role: RoleType.Member
      });

      // 3. Login
      localStorage.setItem('intranet_session', JSON.stringify(newUser));
      onLogin(newUser);
      navigate('/');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Complete Signup</h1>
          <p className="text-slate-500 mt-2">Authenticated as <span className="font-medium text-slate-900">{profile.email}</span></p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            <p className="flex items-center gap-2 font-medium mb-1">
                <Building2 size={16} /> Join Existing Company
            </p>
            <p className="text-blue-700/80">
                To join your team, please enter the <strong>Invite Code</strong> provided by your administrator.
                <br/><br/>
                <span className="text-xs bg-white px-1 py-0.5 rounded border border-blue-200">Hint: Try DEMO123</span>
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Full Name" 
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
            required 
          />
          
          <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Designation" 
                value={formData.designation} 
                onChange={e => setFormData({...formData, designation: e.target.value})} 
                placeholder="e.g. Analyst"
                required 
              />
              <Input 
                label="Department" 
                value={formData.department} 
                onChange={e => setFormData({...formData, department: e.target.value})} 
                placeholder="e.g. Sales"
                required 
              />
          </div>

          <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Invite Code</label>
              <input 
                type="text"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center tracking-widest uppercase text-lg"
                placeholder="ENTER CODE"
                value={formData.inviteCode}
                onChange={e => setFormData({...formData, inviteCode: e.target.value.toUpperCase()})}
                required
              />
          </div>
          
          <Button type="submit" className="w-full mt-4" isLoading={loading}>
            Join Company
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="text-slate-400 hover:text-slate-600">
            Cancel and return to login
          </Link>
        </div>
      </div>
    </div>
  );
};
