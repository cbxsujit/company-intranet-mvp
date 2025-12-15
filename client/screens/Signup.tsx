import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCompany } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../types';

interface SignupProps {
  onLogin: (user: User) => void;
}

export const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    logoURL: '',
    fullName: '',
    email: '',
    password: '',
    department: '',
    designation: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise(r => setTimeout(r, 800)); // Simulate work
      const { user } = await createCompany(
        formData.companyName,
        formData.logoURL,
        {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          designation: formData.designation,
          department: formData.department
        }
      );
      onLogin(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Start your Intranet</h1>
          <p className="text-slate-500 mt-2">Create a new workspace for your team.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold border-b pb-2">Company Details</h3>
            <Input 
              label="Company Name" 
              name="companyName"
              required 
              value={formData.companyName} 
              onChange={handleChange} 
              placeholder="Acme Corp"
            />
            <Input 
              label="Logo URL (Optional)" 
              name="logoURL"
              value={formData.logoURL} 
              onChange={handleChange} 
              placeholder="https://..."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold border-b pb-2">Admin Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                name="fullName"
                required 
                value={formData.fullName} 
                onChange={handleChange} 
              />
               <Input 
                label="Designation" 
                name="designation"
                required 
                value={formData.designation} 
                onChange={handleChange} 
                placeholder="CEO, Founder..."
              />
            </div>
            
            <Input 
              label="Department" 
              name="department"
              required 
              value={formData.department} 
              onChange={handleChange} 
              placeholder="Executive"
            />

            <Input 
              label="Email Address" 
              name="email"
              type="email"
              required 
              value={formData.email} 
              onChange={handleChange} 
            />
            <Input 
              label="Password" 
              name="password"
              type="password"
              required 
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            Create Company & Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};