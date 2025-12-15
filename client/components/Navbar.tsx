
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { User, RoleType, Company, NavQuickLink, NavTargetType, ThemePreference } from '../types';
import { mockLogout, getUnreadNotificationCount, getCompany, getNavQuickLinks, updateUser } from '../services/mockDb';
import { LayoutDashboard, Users, Grid, LogOut, User as UserIcon, FileText, Link as LinkIcon, Home, Bell, Search, Briefcase, Settings, ChevronDown, ExternalLink, BarChart2, Building2, ShieldAlert, Star, Copy, CheckSquare, HelpCircle, BookOpen, Calendar, Bot, Menu, X, Moon, Sun, Eye, EyeOff, CreditCard } from 'lucide-react';

interface NavbarProps {
  user: User;
  realRole?: RoleType;
  previewMode?: boolean;
  onTogglePreview?: () => void;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, realRole, previewMode, onTogglePreview, onLogout, onUserUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const updateCount = () => {
        setUnreadCount(getUnreadNotificationCount(user.id));
    };
    updateCount();
    const interval = setInterval(updateCount, 5000); 
    const comp = getCompany(user.companyId);
    setCompany(comp);
    return () => clearInterval(interval);
  }, [user.id, user.companyId]); 

  const handleLogout = () => {
    mockLogout();
    onLogout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowMobileMenu(false);
    }
  };

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTheme = e.target.value as ThemePreference;
      try {
          const updatedUser = await updateUser({ ...user, themePreference: newTheme });
          if (onUserUpdate) onUserUpdate(updatedUser);
      } catch (error) {
          console.error("Failed to update theme", error);
      }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const primaryColor = company?.primaryColor || '#ffffff';
  const useCustomHeader = !!company?.primaryColor;
  const isLightHeader = !useCustomHeader || primaryColor === '#ffffff' || primaryColor === '#f8fafc';
  
  const headerStyle = useCustomHeader ? { backgroundColor: primaryColor } : {};
  const textColorClass = useCustomHeader && !isLightHeader ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const activeClass = useCustomHeader && !isLightHeader ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700';

  const NavItem = ({ path, label }: { path: string; label: string }) => (
    <Link
      to={path}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        isActive(path) ? activeClass : textColorClass
      }`}
    >
      {label}
    </Link>
  );

  // Allow toggle if the user is ACTUALLY an admin
  const canPreview = realRole === RoleType.CompanyAdmin;

  return (
    <nav className={`border-b border-slate-200 sticky top-0 z-40 ${!useCustomHeader ? 'bg-white' : ''}`} style={headerStyle}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo & Company Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 mr-8">
              {company?.logoURL ? (
                   <img src={company.logoURL} alt="Logo" className="h-8 w-auto object-contain rounded" />
              ) : (
                   <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">I</div>
              )}
              <span className={`text-lg font-bold ${useCustomHeader && !isLightHeader ? 'text-white' : 'text-slate-900'}`}>
                  {company?.companyName || 'Intranet'}
              </span>
            </Link>

            {/* Center: Main Menu (Desktop) */}
            <div className="hidden md:flex items-center space-x-1 overflow-x-auto">
              <NavItem path="/" label="Home" />
              <NavItem path="/spaces" label="Spaces" />
              <NavItem path="/pages" label="Pages" />
              <NavItem path="/documents" label="Documents" />
              <NavItem path="/events" label="Events" />
              <NavItem path="/directory" label="People" />
              <NavItem path="/help" label="KB" />
              <NavItem path="/workspace" label="Workspace" />
              <NavItem path="/ai-assistant" label="AI" />
            </div>
          </div>
          
          {/* Right: Search, Notifications, Profile, Mobile Toggle */}
          <div className="flex items-center gap-3">
             <form onSubmit={handleSearch} className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-1.5 bg-slate-100/50 border-transparent focus:bg-white border focus:border-blue-500 rounded-full text-sm w-32 lg:w-48 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             </form>

            {/* Admin Menu Dropdown - Hidden if effective role is not admin (e.g. preview mode) */}
            {user.role === RoleType.CompanyAdmin && (
                <div className="relative hidden md:block">
                    <button 
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${textColorClass}`}
                    >
                        Admin <ChevronDown size={14} />
                    </button>
                    {showAdminMenu && (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAdminMenu(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20 text-slate-700 animate-fade-in">
                            <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><LayoutDashboard size={16}/> Stats Dashboard</Link>
                            <Link to="/users" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><Users size={16}/> User Management</Link>
                            <Link to="/departments" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><Building2 size={16}/> Departments</Link>
                            <Link to="/policies" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><ShieldAlert size={16}/> Policy Dashboard</Link>
                            <Link to="/templates" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><Copy size={16}/> Page Templates</Link>
                            <Link to="/acknowledgements" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><CheckSquare size={16}/> Acknowledgements</Link>
                            <Link to="/admin/knowledge-categories" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><BookOpen size={16}/> KB Admin</Link>
                            <Link to="/analytics" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><BarChart2 size={16}/> Usage Analytics</Link>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <Link to="/billing" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-blue-600" onClick={() => setShowAdminMenu(false)}><CreditCard size={16}/> Billing & Subscription</Link>
                            <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowAdminMenu(false)}><Settings size={16}/> Settings</Link>
                        </div>
                        </>
                    )}
                </div>
            )}

            {user.role === RoleType.SuperAdmin && (
                 <div className="hidden md:flex items-center gap-2">
                     <Link to="/super-admin/companies" className={`text-sm font-medium px-3 py-2 rounded-md ${textColorClass}`}>Companies</Link>
                     <Link to="/super-admin/billing" className={`text-sm font-medium px-3 py-2 rounded-md ${textColorClass}`}>Billing Control</Link>
                 </div>
            )}

            {/* Notifications */}
            <Link to="/notifications" className={`relative p-2 rounded-full transition-colors ${textColorClass}`}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300/50">
                        <UserIcon size={20} className="text-slate-500" />
                    </div>
                </button>
                {showProfileMenu && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20 text-slate-700 animate-fade-in">
                        <div className="px-4 py-2 border-b border-slate-100 mb-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        
                        {/* Preview Mode Toggle */}
                        {canPreview && (
                            <button
                                onClick={() => {
                                    if (onTogglePreview) onTogglePreview();
                                    setShowProfileMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                            >
                                {previewMode ? (
                                    <>
                                        <EyeOff size={16} className="text-slate-500" />
                                        <span>Exit Preview</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye size={16} className="text-slate-500" />
                                        <span>Preview as Employee</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Theme Switcher */}
                        <div className="px-4 py-2 border-b border-slate-100">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Moon size={10}/> Theme</label>
                            <select 
                                value={user.themePreference || 'System'} 
                                onChange={handleThemeChange}
                                className="w-full text-xs border-slate-200 bg-slate-50 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            >
                                <option value={ThemePreference.System}>System</option>
                                <option value={ThemePreference.Light}>Light</option>
                                <option value={ThemePreference.Dark}>Dark</option>
                            </select>
                        </div>

                        <Link to="/workspace" className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setShowProfileMenu(false)}>My Workspace</Link>
                        <Link to="/profile/edit" className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setShowProfileMenu(false)}>Edit Profile</Link>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2">
                            <LogOut size={14}/> Logout
                        </button>
                    </div>
                    </>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className={`md:hidden p-2 ${textColorClass}`}>
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-slate-200 py-4 px-4 space-y-3 shadow-lg absolute w-full z-50">
             <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             </form>

             <Link to="/" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Home</Link>
             <Link to="/spaces" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Spaces</Link>
             <Link to="/pages" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Pages</Link>
             <Link to="/documents" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Documents</Link>
             <Link to="/events" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Events</Link>
             <Link to="/directory" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>People</Link>
             <Link to="/help" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Knowledge Base</Link>
             <Link to="/workspace" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>My Workspace</Link>
             <Link to="/ai-assistant" className="block py-2 text-slate-700 font-medium hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>AI Assistant</Link>
             
             {user.role === RoleType.CompanyAdmin && (
                 <div className="pt-2 border-t border-slate-100 mt-2">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Admin</p>
                     <Link to="/dashboard" className="block py-2 text-slate-700 text-sm hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
                     <Link to="/billing" className="block py-2 text-slate-700 text-sm hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Billing & Subscription</Link>
                     <Link to="/settings" className="block py-2 text-slate-700 text-sm hover:bg-slate-50 rounded px-2" onClick={() => setShowMobileMenu(false)}>Settings</Link>
                 </div>
             )}
        </div>
      )}
    </nav>
  );
};
