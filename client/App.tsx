
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User, RoleType, ThemePreference } from './types';
import { getSession, initializeDemoData, getCompany, checkSubscriptionStatus } from './services/mockDb';
import { Navbar } from './components/Navbar';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Dashboard } from './screens/Dashboard';
import { HomeScreen } from './screens/HomeScreen';
import { UserManagement } from './screens/UserManagement';
import { SpaceManagement } from './screens/SpaceManagement';
import { SpaceMembers } from './screens/SpaceMembers';
import { PagesList } from './screens/PagesList';
import { PageEditor } from './screens/PageEditor';
import { PageView } from './screens/PageView';
import { PageWidgetEditor } from './screens/PageWidgetEditor';
import { DocumentsList } from './screens/DocumentsList';
import { DocumentEditor } from './screens/DocumentEditor';
import { DocumentView } from './screens/DocumentView';
import { AnnouncementsList } from './screens/AnnouncementsList';
import { AnnouncementEditor } from './screens/AnnouncementEditor';
import { AnnouncementView } from './screens/AnnouncementView';
import { GlobalSearch } from './screens/GlobalSearch';
import { MyWorkspace } from './screens/MyWorkspace';
import { ProfileEdit } from './screens/ProfileEdit';
import { ActivityFeed } from './screens/ActivityFeed';
import { Notifications } from './screens/Notifications';
import { CompanySettings } from './screens/CompanySettings';
import { NavQuickLinkEditor } from './screens/NavQuickLinkEditor';
import { AnalyticsDashboard } from './screens/AnalyticsDashboard';
import { PeopleDirectory } from './screens/PeopleDirectory';
import { UserProfile } from './screens/UserProfile';
import { DepartmentManagement } from './screens/DepartmentManagement';
import { DepartmentEditor } from './screens/DepartmentEditor';
import { DocumentPolicyDashboard } from './screens/DocumentPolicyDashboard';
import { MyFavorites } from './screens/MyFavorites';
import { PageTemplateManagement } from './screens/PageTemplateManagement';
import { PageTemplateEditor } from './screens/PageTemplateEditor';
import { CreatePageFromTemplate } from './screens/CreatePageFromTemplate';
import { AcknowledgementReport } from './screens/AcknowledgementReport';
import { KnowledgeBase } from './screens/KnowledgeBase';
import { KnowledgeCategoryManagement } from './screens/KnowledgeCategoryManagement';
import { KnowledgeCategoryEditor } from './screens/KnowledgeCategoryEditor';
import { KnowledgeArticleManagement } from './screens/KnowledgeArticleManagement';
import { KnowledgeArticleEditor } from './screens/KnowledgeArticleEditor';
import { EventsList } from './screens/EventsList';
import { EventEditor } from './screens/EventEditor';
import { EventView } from './screens/EventView';
import { AIAssistantScreen } from './screens/AIAssistantScreen';
import { AIQueryDetailScreen } from './screens/AIQueryDetailScreen';
import { SuperAdminCompanyList } from './screens/SuperAdminCompanyList';
import { SuperAdminCompanyDetail } from './screens/SuperAdminCompanyDetail';
import { SuperAdminCreateCompany } from './screens/SuperAdminCreateCompany';
import { SuperAdminBilling } from './screens/SuperAdminBilling';
import { SuperAdminRazorpaySettings } from './screens/SuperAdminRazorpaySettings';
import { CompanyBilling } from './screens/CompanyBilling';
import { GoogleSignup } from './screens/GoogleSignup';
import { Eye, AlertTriangle } from 'lucide-react';
import { Button } from './components/ui/Button';
import { DevicePreviewToolbar, DeviceType } from './components/DevicePreviewToolbar';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('#f8fafc'); // Default bg
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    initializeDemoData(); // Initialize demo data if empty
    const session = getSession();
    
    // Load preview mode state
    const storedPreview = sessionStorage.getItem('intranet_preview_mode');
    if (storedPreview === 'true') setPreviewMode(true);

    if (session) {
      setUser(session);
      const comp = getCompany(session.companyId);
      if (comp) {
          applyBranding(comp);
          // Check subscription status on load
          checkSubscriptionStatus(comp.id);
      }
    }
    setLoading(false);
  }, []);

  // Theme Application Logic
  useEffect(() => {
    const applyTheme = () => {
        const pref = user?.themePreference || ThemePreference.System;
        const root = document.documentElement;
        
        let isDark = false;
        if (pref === ThemePreference.Dark) {
            isDark = true;
        } else if (pref === ThemePreference.Light) {
            isDark = false;
        } else {
            // System preference
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            root.classList.add('theme-dark');
            root.classList.remove('theme-light');
        } else {
            root.classList.add('theme-light');
            root.classList.remove('theme-dark');
        }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (user?.themePreference === ThemePreference.System) {
            applyTheme();
        }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [user?.themePreference]);

  const loadFonts = (headingFont: string, bodyFont: string) => {
      const fontsToLoad = new Set<string>();
      
      const checkFont = (fontFamilyStr: string) => {
          if (fontFamilyStr.includes('Inter')) fontsToLoad.add('family=Inter:wght@400;500;600;700');
          if (fontFamilyStr.includes('Roboto')) fontsToLoad.add('family=Roboto:wght@400;500;700');
          if (fontFamilyStr.includes('Open Sans')) fontsToLoad.add('family=Open+Sans:wght@400;600;700');
          if (fontFamilyStr.includes('Lato')) fontsToLoad.add('family=Lato:wght@400;700');
      };

      if (headingFont) checkFont(headingFont);
      if (bodyFont) checkFont(bodyFont);

      if (fontsToLoad.size > 0) {
          const linkId = 'google-fonts-dynamic';
          let link = document.getElementById(linkId) as HTMLLinkElement;
          if (!link) {
              link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              document.head.appendChild(link);
          }
          // Combine requests: https://fonts.googleapis.com/css2?family=A&family=B&display=swap
          const params = Array.from(fontsToLoad).join('&');
          link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
      }
  };

  const applyBranding = (comp: any) => {
      if (comp.secondaryColor) setThemeColor(comp.secondaryColor);
      
      // Inject Dynamic CSS for Class Hijacking
      const styleId = 'branding-overrides';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
      }

      // Default Red/Black theme if not specified
      const primary = comp.primaryColor || '#dc2626';
      const accent = comp.accentColor || '#b91c1c';

      // FORCE OVERRIDE all blue-600 etc to the company primary color
      styleEl.innerHTML = `
          :root {
             --accent-color: ${primary} !important;
             --accent-hover: ${accent} !important;
             --accent-light: ${primary}15 !important;
          }
          
          /* Hijack Common Tailwind Classes */
          .bg-blue-600 { background-color: var(--accent-color) !important; }
          .bg-blue-500 { background-color: var(--accent-color) !important; }
          .bg-indigo-600 { background-color: var(--accent-color) !important; }
          
          .text-blue-600 { color: var(--accent-color) !important; }
          .text-blue-500 { color: var(--accent-color) !important; }
          .text-indigo-600 { color: var(--accent-color) !important; }
          
          .border-blue-600 { border-color: var(--accent-color) !important; }
          .border-blue-200 { border-color: color-mix(in srgb, var(--accent-color), white 70%) !important; }
          
          .hover\\:bg-blue-700:hover { background-color: var(--accent-hover) !important; }
          .hover\\:text-blue-700:hover { color: var(--accent-hover) !important; }
          
          .bg-blue-50 { background-color: var(--accent-light) !important; }
          .bg-indigo-50 { background-color: var(--accent-light) !important; }
      `;

      // Apply Favicon
      if (comp.faviconURL) {
          const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = comp.faviconURL;
          document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Apply Typography
      if (comp.headingFontFamily) {
          document.documentElement.style.setProperty('--font-heading', comp.headingFontFamily);
      } else {
          document.documentElement.style.removeProperty('--font-heading');
      }

      if (comp.bodyFontFamily) {
          document.documentElement.style.setProperty('--font-body', comp.bodyFontFamily);
      } else {
          document.documentElement.style.removeProperty('--font-body');
      }

      // Load external fonts if needed
      loadFonts(comp.headingFontFamily || '', comp.bodyFontFamily || '');
  };

  const handleLogin = (newUser: User) => {
      setUser(newUser);
      setPreviewMode(false); 
      sessionStorage.removeItem('intranet_preview_mode');
      const comp = getCompany(newUser.companyId);
      if(comp) {
          applyBranding(comp);
          checkSubscriptionStatus(comp.id);
      }
  };
  
  const handleLogout = () => {
      setUser(null);
      setThemeColor('#f8fafc');
      setPreviewMode(false);
      sessionStorage.removeItem('intranet_preview_mode');
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.add('theme-light');
      document.documentElement.style.removeProperty('--font-heading');
      document.documentElement.style.removeProperty('--font-body');
  };

  const handleUserUpdate = (updatedUser: User) => {
      setUser(updatedUser);
  };

  const togglePreviewMode = () => {
      const newState = !previewMode;
      setPreviewMode(newState);
      sessionStorage.setItem('intranet_preview_mode', String(newState));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  }

  // Create effective user: if preview mode is ON, force role to Member
  const effectiveUser: User | null = user ? {
      ...user,
      role: previewMode ? RoleType.Member : user.role
  } : null;

  // Logic for Admin Status
  const isRealAdmin = user?.role === RoleType.CompanyAdmin || user?.role === RoleType.SuperAdmin;

  const ProtectedLayout = () => {
    if (!effectiveUser) return <Navigate to="/login" />;
    
    // Check Subscription Expiry
    const comp = getCompany(effectiveUser.companyId);
    const isExpired = comp && !comp.isSubscriptionActive;
    const isSuperAdmin = effectiveUser.role === RoleType.SuperAdmin;
    
    if (isExpired && !isSuperAdmin) {
        const currentPath = window.location.hash.replace('#', '');
        const isBillingPage = currentPath === '/billing';
        
        if (effectiveUser.role === RoleType.CompanyAdmin) {
            if (!isBillingPage) {
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Subscription Expired</h1>
                            <p className="text-slate-500">Your company subscription has expired. Please renew to restore access.</p>
                            <a href="#/billing">
                                <Button>Go to Billing</Button>
                            </a>
                        </div>
                    </div>
                );
            }
        } else {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Access Suspended</h1>
                        <p className="text-slate-500">This company's subscription has expired. Please contact your administrator.</p>
                        <Button variant="secondary" onClick={handleLogout}>Logout</Button>
                    </div>
                </div>
            );
        }
    }

    // Calculate Container Style based on Preview Device
    const containerStyle: React.CSSProperties = {
        width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
        maxWidth: '100%',
        margin: '0 auto',
        transition: 'all 0.3s ease-in-out',
        boxShadow: previewDevice !== 'desktop' ? '0 0 40px rgba(0,0,0,0.15)' : 'none',
        borderLeft: previewDevice !== 'desktop' ? '1px solid #e2e8f0' : 'none',
        borderRight: previewDevice !== 'desktop' ? '1px solid #e2e8f0' : 'none',
        minHeight: '100vh',
        backgroundColor: effectiveUser.themePreference === 'Dark' ? 'var(--bg-app)' : '#fff' // Inner content bg
    };

    const wrapperBg = previewDevice !== 'desktop' ? '#f1f5f9' : (effectiveUser.themePreference === 'Dark' ? 'var(--bg-app)' : themeColor);

    return (
      <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: wrapperBg }}>
        {/* Employee Preview Banner */}
        {previewMode && (
            <div className="bg-indigo-600 text-white w-full relative z-50">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye size={16} />
                        You are viewing the site in Preview as Employee mode.
                    </div>
                    <button 
                        onClick={togglePreviewMode}
                        className="bg-white text-indigo-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-indigo-50 transition-colors"
                    >
                        Exit Preview
                    </button>
                </div>
            </div>
        )}

        {/* Device Toolbar for Admins */}
        {isRealAdmin && (
            <DevicePreviewToolbar currentDevice={previewDevice} onDeviceChange={setPreviewDevice} />
        )}

        {/* Navbar - Always full width, but content centered */}
        <Navbar 
            user={effectiveUser} 
            realRole={user?.role}
            previewMode={previewMode}
            onTogglePreview={togglePreviewMode}
            onLogout={handleLogout} 
            onUserUpdate={handleUserUpdate} 
        />
        
        {/* Resizable Content Area */}
        <div style={containerStyle} className="flex flex-col flex-1">
            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/google-signup" element={<GoogleSignup onLogin={handleLogin} />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomeScreen currentUser={effectiveUser!} />} />
          <Route path="/workspace" element={<MyWorkspace currentUser={effectiveUser!} />} />
          <Route path="/notifications" element={<Notifications currentUser={effectiveUser!} />} />
          <Route path="/profile/edit" element={<ProfileEdit currentUser={effectiveUser!} />} />
          <Route path="/search" element={<GlobalSearch currentUser={effectiveUser!} />} />
          <Route path="/dashboard" element={<Dashboard currentUser={effectiveUser!} />} />
          
          <Route path="/directory" element={<PeopleDirectory currentUser={effectiveUser!} />} />
          <Route path="/directory/:userId" element={<UserProfile currentUser={effectiveUser!} />} />

          <Route path="/announcements" element={<AnnouncementsList currentUser={effectiveUser!} />} />
          <Route path="/announcements/new" element={<AnnouncementEditor currentUser={effectiveUser!} />} />
          <Route path="/announcements/:id" element={<AnnouncementView currentUser={effectiveUser!} />} />
          <Route path="/announcements/:id/edit" element={<AnnouncementEditor currentUser={effectiveUser!} />} />

          <Route path="/events" element={<EventsList currentUser={effectiveUser!} />} />
          <Route path="/events/new" element={<EventEditor currentUser={effectiveUser!} />} />
          <Route path="/events/:id" element={<EventView currentUser={effectiveUser!} />} />
          <Route path="/events/:id/edit" element={<EventEditor currentUser={effectiveUser!} />} />

          <Route path="/pages" element={<PagesList currentUser={effectiveUser!} />} />
          <Route path="/pages/new" element={<PageEditor currentUser={effectiveUser!} />} />
          <Route path="/pages/create-from-template" element={<CreatePageFromTemplate currentUser={effectiveUser!} />} />
          <Route path="/pages/:id" element={<PageView currentUser={effectiveUser!} />} />
          <Route path="/pages/:id/edit" element={<PageEditor currentUser={effectiveUser!} />} />
          
          <Route path="/pages/:pageId/widgets/new" element={<PageWidgetEditor currentUser={effectiveUser!} />} />
          <Route path="/pages/:pageId/widgets/:widgetId/edit" element={<PageWidgetEditor currentUser={effectiveUser!} />} />

          <Route path="/documents" element={<DocumentsList currentUser={effectiveUser!} />} />
          <Route path="/documents/new" element={<DocumentEditor currentUser={effectiveUser!} />} />
          <Route path="/documents/:id" element={<DocumentView currentUser={effectiveUser!} />} />
          <Route path="/documents/:id/edit" element={<DocumentEditor currentUser={effectiveUser!} />} />

          <Route path="/spaces" element={<SpaceManagement currentUser={effectiveUser!} />} />
          <Route path="/spaces/:spaceId/members" element={<SpaceMembers currentUser={effectiveUser!} />} />

          <Route path="/help" element={<KnowledgeBase currentUser={effectiveUser!} />} />

          <Route path="/ai-assistant" element={<AIAssistantScreen currentUser={effectiveUser!} />} />
          <Route path="/ai-assistant/:id" element={<AIQueryDetailScreen currentUser={effectiveUser!} />} />

          {/* Admin Routes - Check effectiveUser role */}
          <Route path="/users" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <UserManagement currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/departments" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <DepartmentManagement currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/departments/new" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <DepartmentEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/departments/:id/edit" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <DepartmentEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/policies" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <DocumentPolicyDashboard currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

          <Route path="/activity" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <ActivityFeed currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/analytics" element={
            effectiveUser?.role === RoleType.CompanyAdmin ? <AnalyticsDashboard currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          
          <Route path="/billing" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <CompanyBilling currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

          <Route path="/settings" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <CompanySettings currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/settings/nav-links/new" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <NavQuickLinkEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/settings/nav-links/:id/edit" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <NavQuickLinkEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

          <Route path="/templates" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <PageTemplateManagement currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
           <Route path="/templates/new" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <PageTemplateEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
           <Route path="/templates/:id/edit" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <PageTemplateEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

           <Route path="/acknowledgements" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <AcknowledgementReport currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

          <Route path="/admin/knowledge-categories" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeCategoryManagement currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/admin/knowledge-categories/new" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeCategoryEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/admin/knowledge-categories/:id/edit" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeCategoryEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          
          <Route path="/admin/knowledge-articles" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeArticleManagement currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/admin/knowledge-articles/new" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeArticleEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/admin/knowledge-articles/:id/edit" element={
             effectiveUser?.role === RoleType.CompanyAdmin ? <KnowledgeArticleEditor currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

          <Route path="/favorites" element={<MyFavorites currentUser={effectiveUser!} />} />

          <Route path="/super-admin/companies" element={
             effectiveUser?.role === RoleType.SuperAdmin ? <SuperAdminCompanyList currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/super-admin/companies/new" element={
             effectiveUser?.role === RoleType.SuperAdmin ? <SuperAdminCreateCompany currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/super-admin/companies/:id" element={
             effectiveUser?.role === RoleType.SuperAdmin ? <SuperAdminCompanyDetail currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/super-admin/billing" element={
             effectiveUser?.role === RoleType.SuperAdmin ? <SuperAdminBilling currentUser={effectiveUser} /> : <Navigate to="/" />
          } />
          <Route path="/super-admin/razorpay-settings" element={
             effectiveUser?.role === RoleType.SuperAdmin ? <SuperAdminRazorpaySettings currentUser={effectiveUser} /> : <Navigate to="/" />
          } />

        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
