
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RoleType } from '../types';
import { getRazorpayConfig, saveRazorpayConfig } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, CreditCard, Shield, Eye, EyeOff } from 'lucide-react';

interface SuperAdminRazorpaySettingsProps {
  currentUser: User;
}

export const SuperAdminRazorpaySettings: React.FC<SuperAdminRazorpaySettingsProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser.role !== RoleType.SuperAdmin) {
        navigate('/');
        return;
    }
    const config = getRazorpayConfig();
    if (config) {
        setKeyId(config.keyId);
        setKeySecret(config.keySecret);
    }
  }, [currentUser, navigate]);

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      saveRazorpayConfig({ keyId, keySecret });
      setTimeout(() => {
          setLoading(false);
          alert('Razorpay settings saved.');
      }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/super-admin/billing')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Razorpay Settings</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 text-slate-700">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CreditCard size={24}/></div>
                <div>
                    <h3 className="font-bold text-lg">API Configuration</h3>
                    <p className="text-sm text-slate-500">Enter your Razorpay test/live keys.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Input 
                    label="Key ID" 
                    value={keyId} 
                    onChange={e => setKeyId(e.target.value)} 
                    placeholder="rzp_test_..."
                    required
                />
                
                <div className="relative">
                    <Input 
                        label="Key Secret" 
                        type={showSecret ? 'text' : 'password'}
                        value={keySecret} 
                        onChange={e => setKeySecret(e.target.value)} 
                        placeholder="Enter secret"
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    >
                        {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg flex items-start gap-3 text-sm text-slate-600">
                    <Shield size={18} className="text-blue-600 mt-0.5 shrink-0" />
                    <p>These keys are stored locally for this MVP simulation. In a real production app, they would be securely stored on the backend server.</p>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" isLoading={loading}>Save Settings</Button>
                </div>
            </form>
        </div>
    </div>
  );
};
