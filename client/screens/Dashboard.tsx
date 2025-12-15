
import React, { useEffect, useState } from 'react';
import { User, Space, RoleType, Company, PlanType } from '../types';
import { getUsers, getSpaces, getCompany } from '../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Grid, Briefcase, Activity, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface DashboardProps {
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [stats, setStats] = useState({
    userCount: 0,
    spaceCount: 0,
    activeUsers: 0,
    deptData: [] as any[],
  });

  useEffect(() => {
    // Load company info
    const comp = getCompany(currentUser.companyId);
    setCompany(comp);

    // Load fresh data on mount
    const users = getUsers(currentUser.companyId);
    const spaces = getSpaces(currentUser.companyId);

    // Calc stats
    const departments: Record<string, number> = {};
    users.forEach(u => {
      departments[u.department] = (departments[u.department] || 0) + 1;
    });

    const chartData = Object.entries(departments).map(([name, count]) => ({
      name,
      count
    }));

    setStats({
      userCount: users.length,
      spaceCount: spaces.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      deptData: chartData
    });
  }, [currentUser.companyId]);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Plan Usage Logic
  const isBasic = company?.planType === PlanType.Basic;
  const maxUsers = 50;
  const maxSpaces = 5;
  
  const userUsagePercent = isBasic ? Math.min((stats.userCount / maxUsers) * 100, 100) : 0;
  const spaceUsagePercent = isBasic ? Math.min((stats.spaceCount / maxSpaces) * 100, 100) : 0;
  
  const showWarning = isBasic && (stats.userCount >= (maxUsers - 5) || stats.spaceCount >= (maxSpaces - 1));

  // Theme Palette for Charts (Red & Black/Greys)
  const CHART_COLORS = ['#dc2626', '#1f2937', '#ef4444', '#4b5563'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <span className="text-sm text-slate-500">Welcome back, {currentUser.fullName}</span>
      </div>

      {/* PLAN USAGE SECTION (Admin Only) */}
      {currentUser.role === RoleType.CompanyAdmin && company && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Crown size={20} className={isBasic ? "text-slate-400" : "text-black"} />
                    <h2 className="font-bold text-slate-900">Plan Usage ({company.planType})</h2>
                </div>
                {isBasic && (
                    <Button size="sm" className="bg-black hover:bg-slate-800 text-white text-xs border-none" onClick={() => window.location.href = '#/billing'}>
                        Upgrade Plan
                    </Button>
                )}
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Usage */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">Users</span>
                            <span className="text-slate-500">
                                {isBasic ? `${stats.userCount} / ${maxUsers}` : `${stats.userCount} (Unlimited)`}
                            </span>
                        </div>
                        {isBasic ? (
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 bg-red-600`} 
                                    style={{ width: `${userUsagePercent}%` }}
                                ></div>
                            </div>
                        ) : (
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-black rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Space Usage */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">Spaces</span>
                            <span className="text-slate-500">
                                {isBasic ? `${stats.spaceCount} / ${maxSpaces}` : `${stats.spaceCount} (Unlimited)`}
                            </span>
                        </div>
                        {isBasic ? (
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 bg-red-600`} 
                                    style={{ width: `${spaceUsagePercent}%` }}
                                ></div>
                            </div>
                        ) : (
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-black rounded-full"></div>
                            </div>
                        )}
                    </div>
                </div>

                {showWarning && (
                    <div className="mt-6 flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                        <AlertTriangle size={16} />
                        You are close to your plan limits. Upgrade to Pro for unlimited users and spaces.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* STAT CARDS - Red/Black Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.userCount} icon={Users} colorClass="bg-red-600" />
        <StatCard title="Active Spaces" value={stats.spaceCount} icon={Grid} colorClass="bg-slate-800" />
        <StatCard title="Active Users" value={stats.activeUsers} icon={Activity} colorClass="bg-red-500" />
        <StatCard title="Departments" value={stats.deptData.length} icon={Briefcase} colorClass="bg-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Users by Department</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.deptData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {currentUser.role === RoleType.CompanyAdmin ? (
                  <>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="p-2 bg-red-100 rounded-full text-red-600"><Users size={20}/></div>
                        <div>
                            <h4 className="font-medium text-slate-900">Manage Users</h4>
                            <p className="text-sm text-slate-500">Add, edit, or remove team members.</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="p-2 bg-slate-200 rounded-full text-slate-700"><Grid size={20}/></div>
                        <div>
                            <h4 className="font-medium text-slate-900">Manage Spaces</h4>
                            <p className="text-sm text-slate-500">Organize content and projects.</p>
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
                      You are logged in as a {currentUser.role}. Explore the spaces via the navigation.
                  </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
