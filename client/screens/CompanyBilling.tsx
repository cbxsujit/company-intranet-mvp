
import React, { useState, useEffect } from 'react';
import { User, Company, PlanType, PaymentOrder } from '../types';
import { getCompany, checkSubscriptionStatus, renewSubscription, upgradeCompanyPlan, createPaymentOrder, verifyPayment, getRazorpayConfig, getPaymentOrders } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { CreditCard, Calendar, CheckCircle, AlertTriangle, Crown, RefreshCcw, History } from 'lucide-react';

interface CompanyBillingProps {
  currentUser: User;
}

// Extend Window for Razorpay
declare global {
    interface Window {
        Razorpay: any;
    }
}

export const CompanyBilling: React.FC<CompanyBillingProps> = ({ currentUser }) => {
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(1); // months
  const [paymentHistory, setPaymentHistory] = useState<PaymentOrder[]>([]);
  
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);

  useEffect(() => {
    if (currentUser.companyId) {
        loadData();
    }
  }, [currentUser.companyId]);

  const loadData = () => {
      const comp = checkSubscriptionStatus(currentUser.companyId);
      setCompany(comp);
      const config = getRazorpayConfig();
      setRazorpayConfigured(!!config && !!config.keyId);
      const history = getPaymentOrders(currentUser.companyId);
      setPaymentHistory(history);
  };

  const handlePayment = async (plan: PlanType, months: number) => {
      if (!company) return;
      setLoading(true);

      try {
          // CHECK: Ensure Razorpay SDK is loaded
          if (typeof window.Razorpay === 'undefined') {
              throw new Error("Razorpay SDK failed to load. Please refresh the page or check your connection.");
          }

          // 1. Calculate Amount (Mock pricing: Basic=1000/mo, Pro=5000/mo)
          const basePrice = plan === PlanType.Pro ? 5000 : 1000;
          const amountInPaise = basePrice * months * 100;

          // 2. Create Order
          const order = await createPaymentOrder(company.id, plan, months, amountInPaise);

          // 3. Open Razorpay
          const config = getRazorpayConfig();
          if (!config) throw new Error("Razorpay config missing");

          const options = {
              key: config.keyId,
              amount: amountInPaise,
              currency: "INR",
              name: "Company Intranet MVP",
              description: `${plan} Plan Subscription (${months} Month${months > 1 ? 's' : ''})`,
              order_id: order.razorpayOrderId,
              handler: async function (response: any) {
                  try {
                      // 4. Verify Payment on Success
                      const success = await verifyPayment(
                          response.razorpay_order_id,
                          response.razorpay_payment_id,
                          response.razorpay_signature
                      );

                      if (success) {
                          alert(`Payment Successful! Your ${plan} subscription is active.`);
                          loadData(); // Refresh data
                          setRenewModalOpen(false);
                      } else {
                          alert("Payment verification failed.");
                      }
                  } catch (e) {
                      console.error(e);
                      alert("Error verifying payment.");
                  }
              },
              prefill: {
                  name: currentUser.fullName,
                  email: currentUser.email,
              },
              theme: {
                  color: "#2563eb"
              }
          };

          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function (response: any){
                alert(response.error.description);
          });
          rzp1.open();

      } catch (e: any) {
          console.error(e);
          alert(e.message || "Payment init failed");
      } finally {
          setLoading(false);
      }
  };

  const handleManualRenew = async () => {
      // Legacy manual fallback if needed or for testing without keys
      if (!company) return;
      if (!window.confirm("Simulate manual renewal?")) return;
      await renewSubscription(company.id, selectedDuration);
      setRenewModalOpen(false);
      loadData();
  };

  if (!company) return <div>Loading...</div>;

  const isPro = company.planType === PlanType.Pro;
  const statusColor = company.renewalStatus === 'Active' ? 'text-green-600 bg-green-50' : 
                      company.renewalStatus === 'ExpiringSoon' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
            <p className="text-sm text-slate-500">Manage your plan and renewal.</p>
        </div>

        {!razorpayConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-3 text-sm">
                <AlertTriangle size={20} />
                <p>Razorpay payments are not configured by Super Admin. Using manual mode.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${isPro ? 'text-purple-600' : 'text-blue-600'}`}>
                    <Crown size={120} />
                </div>
                
                <h2 className="text-lg font-bold text-slate-900 mb-4">Current Plan</h2>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-lg ${isPro ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Crown size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{company.planType}</p>
                        <p className="text-sm text-slate-500">{isPro ? 'Unlimited Users & Spaces' : 'Up to 50 Users, 5 Spaces'}</p>
                    </div>
                </div>

                {!isPro && (
                    <Button 
                        onClick={() => razorpayConfigured ? handlePayment(PlanType.Pro, 1) : handleManualRenew()} 
                        isLoading={loading} 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                    >
                        {razorpayConfigured ? 'Pay & Upgrade to Pro (₹5000/mo)' : 'Upgrade to Pro'}
                    </Button>
                )}
            </div>

            {/* Subscription Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Subscription Status</h2>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${statusColor}`}>
                            {company.renewalStatus}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-slate-400"/>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Valid Until</p>
                            <p className="text-slate-900 font-medium">
                                {company.subscriptionEndDate ? new Date(company.subscriptionEndDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <Button variant="secondary" className="w-full mt-4" onClick={() => setRenewModalOpen(true)}>
                        <RefreshCcw size={16} className="mr-2" /> Renew Subscription
                    </Button>
                </div>
            </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <History size={18} className="text-slate-500" />
                <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Plan</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Amount</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Order ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 text-slate-600">{new Date(order.createdOn).toLocaleDateString()}</td>
                                <td className="px-6 py-3 font-medium text-slate-900">{order.planName} ({order.durationMonths} mo)</td>
                                <td className="px-6 py-3 text-slate-600">₹{order.amountInPaise / 100}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-slate-500">{order.razorpayOrderId || '-'}</td>
                            </tr>
                        ))}
                        {paymentHistory.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No payment history found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Renewal Modal */}
        {renewModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Renew Subscription</h3>
                    <p className="text-slate-600 mb-6">Choose a duration to extend your current <strong>{company.planType}</strong> plan.</p>
                    
                    <div className="space-y-3 mb-6">
                        <button 
                            onClick={() => setSelectedDuration(1)}
                            className={`w-full p-4 rounded-lg border text-left flex justify-between ${selectedDuration === 1 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                            <span className="font-medium">1 Month</span>
                            {selectedDuration === 1 && <CheckCircle size={20} className="text-blue-600"/>}
                        </button>
                        <button 
                            onClick={() => setSelectedDuration(3)}
                            className={`w-full p-4 rounded-lg border text-left flex justify-between ${selectedDuration === 3 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                            <span className="font-medium">3 Months</span>
                            {selectedDuration === 3 && <CheckCircle size={20} className="text-blue-600"/>}
                        </button>
                        <button 
                            onClick={() => setSelectedDuration(12)}
                            className={`w-full p-4 rounded-lg border text-left flex justify-between ${selectedDuration === 12 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                            <span className="font-medium">12 Months</span>
                            {selectedDuration === 12 && <CheckCircle size={20} className="text-blue-600"/>}
                        </button>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setRenewModalOpen(false)}>Cancel</Button>
                        {razorpayConfigured ? (
                            <Button onClick={() => handlePayment(company.planType as PlanType, selectedDuration)} isLoading={loading}>
                                Pay with Razorpay
                            </Button>
                        ) : (
                            <Button onClick={handleManualRenew} isLoading={loading}>Manual Renew (Test)</Button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
