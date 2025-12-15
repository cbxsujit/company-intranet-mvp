
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { updateUser } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';

interface ProfileEditProps {
  currentUser: User;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName,
    designation: currentUser.designation,
    department: currentUser.department
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateUser({
          ...currentUser,
          ...formData
      });
      navigate('/workspace');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/workspace')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label="Full Name" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input 
                    label="Designation" 
                    value={formData.designation} 
                    onChange={e => setFormData({...formData, designation: e.target.value})} 
                    required
                />
                 <Input 
                    label="Department" 
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})} 
                    required
                />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Read-only Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500" value={currentUser.email} disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                        <input className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500" value={currentUser.role} disabled />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
                 <Button type="button" variant="secondary" onClick={() => navigate('/workspace')}>Cancel</Button>
                 <Button type="submit" isLoading={loading}>Save Changes</Button>
            </div>
          </form>
      </div>
    </div>
  );
};
