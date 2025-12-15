
import React, { useState, useEffect } from 'react';
import { User, RoleType } from '../types';
import { getAnalyticsData, AnalyticsSummary, checkFeatureAccess } from '../services/mockDb';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, FileText, Eye, Filter, ArrowRight, Lock } from 'lucide-react';
import { UpgradeModal } from '../components/UpgradeModal';

interface AnalyticsDashboardProps {
  currentUser: User;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [dateRange, setDateRange] = useState({
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
  });
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
      const hasAccess = checkFeatureAccess(currentUser.companyId, 'analytics');
      if (!hasAccess) {
          setIsRestricted(true);
      } else {
          fetchData();
      }
  }, [currentUser.companyId, dateRange]);

  const fetchData = () => {
    const summary = getAnalyticsData(
        currentUser.companyId,
        new Date(dateRange.from),
        new Date(dateRange.to + 'T23:59:59')
    );
    setData(summary);
  };

  if (isRestricted) {
      return (
          <div className="flex items-center justify-center h-96 animate-fade-in">
              <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-slate-100 shadow-lg">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Usage Analytics</h2>
                  <p className="text-slate-500 mb-6">
                      Detailed usage insights are available on the Pro plan.
                  </p>
                  <Button onClick={() => alert("Redirecting to billing...")}>Upgrade to Unlock</Button>
              </div>
          </div>
      );
  }

  if (!data) return <div className="p-8 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usage Analytics</h1>
          <p className="text-sm text-slate-500">Insights into page views and user engagement.</p>
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-600 px-2">Date Range:</span>
            <input 
                type="date" 
                className="text-sm border border-slate-300 rounded px-2 py-1"
                value={dateRange.from}
                onChange={e => setDateRange({...dateRange, from: e.target.value})}
            />
            <span className="text-slate-400">-</span>
            <input 
                type="date" 
                className="text-sm border border-slate-300 rounded px-2 py-1"
                value={dateRange.to}
                onChange={e => setDateRange({...dateRange, to: e.target.value})}
            />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Page Views</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.totalPageViews}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Eye size={24} />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Unique Pages Viewed</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.uniquePagesViewed}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <FileText size={24} />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Unique Users</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.uniqueUsers}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Users size={24} />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
                 Top Pages
             </div>
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500">
                     <tr>
                         <th className="px-6 py-3 font-semibold">Page Title</th>
                         <th className="px-6 py-3 font-semibold">Space</th>
                         <th className="px-6 py-3 font-semibold text-right">Views</th>
                         <th className="px-6 py-3"></th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {data.topPages.map((p, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                             <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-xs" title={p.pageTitle}>{p.pageTitle}</td>
                             <td className="px-6 py-3 text-slate-500">{p.spaceName}</td>
                             <td className="px-6 py-3 text-right font-medium text-slate-900">{p.viewCount}</td>
                             <td className="px-6 py-3 text-right">
                                 <Link to={`/pages/${p.pageId}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end gap-1">
                                     Open <ArrowRight size={12} />
                                 </Link>
                             </td>
                         </tr>
                     ))}
                     {data.topPages.length === 0 && (
                         <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No page views in this period.</td></tr>
                     )}
                 </tbody>
             </table>
          </div>

          <div className="space-y-6">
                {/* Active Users */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
                        Top Active Users
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">User</th>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold text-right">Views</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.activeUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-slate-900">{u.userName}</div>
                                        <div className="text-xs text-slate-500">{u.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-xs">{u.roleName}</td>
                                    <td className="px-6 py-3 text-right font-medium text-slate-900">{u.viewCount}</td>
                                </tr>
                            ))}
                             {data.activeUsers.length === 0 && (
                                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No active users in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                 {/* Views by Role */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
                        Views by Role
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Role</th>
                                <th className="px-6 py-3 font-semibold text-right">Total Views</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.viewsByRole.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{r.roleName}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">{r.viewCount}</td>
                                </tr>
                            ))}
                             {data.viewsByRole.length === 0 && (
                                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">No data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
          </div>
      </div>
    </div>
  );
};
