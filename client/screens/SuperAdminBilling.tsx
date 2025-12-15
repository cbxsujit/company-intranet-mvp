
import React, { useState, useEffect } from 'react';
import { User, Company, RoleType, PlanType, PaymentOrder } from '../types';
import { getAllCompanies, updateCompany, checkSubscriptionStatus, renewSubscription, getPaymentOrders } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { RefreshCcw, Crown, Ban, CheckCircle, Settings, List } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface SuperAdminBillingProps {
  currentUser: User;
}

export const SuperAdminBilling: React.FC<SuperAdminBillingProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');

  useEffect(() => {
    if (currentUser.role !== RoleType.SuperAdmin) {
        navigate('/');
        return;
    }
    refresh();
  }, [currentUser]);

  const refresh = () => {
      // Force check status on all before loading
      const all = getAllCompanies();
      all.forEach(c => checkSubscriptionStatus(c.id));
      setCompanies(getAllCompanies());
      setOrders(getPaymentOrders());
  };

  const handleExtend = async (c: Company) => {
      if(!window.confirm(`Extend ${c.companyName} by 1 month?`)) return;
      await renewSubscription(c.id, 1);
      refresh();
  };

  const handleTogglePlan = async (c: Company) => {
      const newPlan = c.planType === PlanType.Basic ? PlanType.Pro : PlanType.Basic;
      if(!window.confirm(`Change plan for ${c.companyName} to ${newPlan}?`)) return;
      
      await updateCompany({
          ...c,
          planType: newPlan,
          subscriptionPlan: newPlan
      });
      refresh();
  };

  const handleToggleActive = async (c: Company) => {
      const newState = !c.isActive;
      if(!window.confirm(`${newState ? 'Activate' : 'Deactivate'} company ${c.companyName}?`)) return;
      await updateCompany({ ...c, isActive: newState });
      refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Billing Control Panel</h1>
                <p className="text-sm text-slate-500">Manage company subscriptions and status.</p>
            </div>
            <Link to="/super-admin/razorpay-settings">
                <Button variant="secondary" className="flex items-center gap-2">
                    <Settings size={16} /> Razorpay Settings
                </Button>
            </Link>
        </div>

        <div className="flex space-x-4 border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Subscription Overview
            </button>
            <button 
                onClick={() => setActiveTab('payments')}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Payment Orders
            </button>
        </div>

        {activeTab === 'overview' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Company</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Plan</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Expires</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {companies.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{c.companyName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.planType === PlanType.Pro ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {c.planType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {c.subscriptionEndDate ? new Date(c.subscriptionEndDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.renewalStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.renewalStatus || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleExtend(c)} className="p-1.5 text-slate-500 hover:text-green-600 bg-white border border-slate-200 rounded shadow-sm" title="Extend 1 Month">
                                            <RefreshCcw size={14} />
                                        </button>
                                        <button onClick={() => handleTogglePlan(c)} className="p-1.5 text-slate-500 hover:text-purple-600 bg-white border border-slate-200 rounded shadow-sm" title="Switch Plan">
                                            <Crown size={14} />
                                        </button>
                                        <button onClick={() => handleToggleActive(c)} className={`p-1.5 bg-white border border-slate-200 rounded shadow-sm ${c.isActive ? 'text-slate-500 hover:text-red-600' : 'text-red-500 hover:text-green-600'}`} title={c.isActive ? "Deactivate" : "Activate"}>
                                            {c.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Company ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Plan</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Order ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-600">{new Date(o.createdOn).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{o.companyId}</td>
                                <td className="px-6 py-4">{o.planName} ({o.durationMonths}m)</td>
                                <td className="px-6 py-4 font-medium">₹{o.amountInPaise / 100}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${o.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{o.razorpayOrderId}</td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payment orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};
