
import { Company, User, Space, RoleType, Page, DocumentItem, DocumentType, Announcement, AnnouncementAudience, SpaceMember, SpaceRole, ActivityLog, EntityType, ActionType, PageComment, Notification, PageWidget, WidgetType, NavQuickLink, NavTargetType, PageViewLog, Department, DocumentImportance, FavoriteItem, PageTemplate, ReadAcknowledgement, KnowledgeCategory, KnowledgeArticle, Event, EventType, PlanType, AIQuery, AIQueryScope, AIQueryStatus, PaymentOrder, PaymentStatus, RazorpayConfig, CustomDomain } from '../types';
import { askGemini } from './gemini';

const KEYS = {
  COMPANIES: 'intranet_companies',
  USERS: 'intranet_users',
  SPACES: 'intranet_spaces',
  SPACE_MEMBERS: 'intranet_space_members',
  PAGES: 'intranet_pages',
  PAGE_COMMENTS: 'intranet_page_comments',
  PAGE_WIDGETS: 'intranet_page_widgets',
  DOCUMENTS: 'intranet_documents',
  ANNOUNCEMENTS: 'intranet_announcements',
  ACTIVITY_LOGS: 'intranet_activity_logs',
  NOTIFICATIONS: 'intranet_notifications',
  NAV_QUICK_LINKS: 'intranet_nav_quick_links',
  PAGE_VIEWS: 'intranet_page_views',
  SESSION: 'intranet_session',
  DEPARTMENTS: 'intranet_departments',
  FAVORITES: 'intranet_favorites',
  PAGE_TEMPLATES: 'intranet_page_templates',
  READ_ACKNOWLEDGEMENTS: 'intranet_read_acknowledgements',
  KNOWLEDGE_CATEGORIES: 'intranet_knowledge_categories',
  KNOWLEDGE_ARTICLES: 'intranet_knowledge_articles',
  EVENTS: 'intranet_events',
  AI_QUERIES: 'intranet_ai_queries',
  PAYMENT_ORDERS: 'intranet_payment_orders',
  RAZORPAY_CONFIG: 'intranet_razorpay_config',
  CUSTOM_DOMAINS: 'intranet_custom_domains'
};

export interface AnalyticsSummary {
  totalPageViews: number;
  uniquePagesViewed: number;
  uniqueUsers: number;
  topPages: { pageId: string; pageTitle: string; spaceName: string; viewCount: number }[];
  activeUsers: { userId: string; userName: string; userEmail: string; roleName: string; viewCount: number }[];
  viewsByRole: { roleName: string; viewCount: number }[];
}

// Helpers
const getStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error parsing storage for key ${key}`, e);
    return [];
  }
};

const setStorage = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error setting storage for key ${key}`, e);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// PLAN LIMIT CONSTANTS
const LIMITS = {
    BASIC_USERS: 50,
    BASIC_SPACES: 5
};

// Custom Domain Service
export const getCustomDomains = (companyId: string): CustomDomain[] => {
    const all = getStorage<CustomDomain>(KEYS.CUSTOM_DOMAINS);
    return all.filter(d => d.companyId === companyId);
};

export const addCustomDomain = async (companyId: string, domainName: string): Promise<CustomDomain> => {
    const all = getStorage<CustomDomain>(KEYS.CUSTOM_DOMAINS);
    
    // Simple format check
    if (!domainName.includes('.')) throw new Error("Invalid domain format");

    const token = `companyhub-verification-${generateId()}-${Date.now()}`;
    const newDomain: CustomDomain = {
        id: generateId(),
        companyId,
        domainName: domainName.toLowerCase(),
        dnsVerificationToken: token,
        isVerified: false,
        createdOn: new Date().toISOString()
    };
    
    setStorage(KEYS.CUSTOM_DOMAINS, [...all, newDomain]);
    return newDomain;
};

export const verifyCustomDomain = async (domainId: string): Promise<CustomDomain> => {
    const all = getStorage<CustomDomain>(KEYS.CUSTOM_DOMAINS);
    const index = all.findIndex(d => d.id === domainId);
    
    if (index === -1) throw new Error("Domain not found");
    
    const domain = all[index];
    
    // Simulate DNS Check Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Success: If domain contains "test" or just always succeed for MVP
    const isSuccess = true; // For demo purposes, we always verify
    
    const updatedDomain = {
        ...domain,
        lastCheck: new Date().toISOString(),
        isVerified: isSuccess,
        verifiedOn: isSuccess ? new Date().toISOString() : undefined
    };
    
    all[index] = updatedDomain;
    setStorage(KEYS.CUSTOM_DOMAINS, all);
    
    return updatedDomain;
};

export const deleteCustomDomain = async (domainId: string) => {
    const all = getStorage<CustomDomain>(KEYS.CUSTOM_DOMAINS);
    setStorage(KEYS.CUSTOM_DOMAINS, all.filter(d => d.id !== domainId));
};


// AI Query Logic with Live Integration
export const getAIQueries = (companyId: string, userId?: string): AIQuery[] => {
    const all = getStorage<AIQuery>(KEYS.AI_QUERIES).filter(q => q.companyId === companyId);
    if (userId) return all.filter(q => q.userId === userId).sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    return all.sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
};

export const getAIQuery = (id: string) => getStorage<AIQuery>(KEYS.AI_QUERIES).find(q => q.id === id);

export const addAIQuery = async (query: any) => {
    const companies = getStorage<Company>(KEYS.COMPANIES);
    const company = companies.find(c => c.id === query.companyId);

    let answer = '';
    let status = AIQueryStatus.Pending;
    let answeredOn = undefined;

    // Check if Company has API Key for Live Gemini
    if (company && company.geminiApiKey) {
        try {
            // Call Gemini Service
            const responseText = await askGemini(company.geminiApiKey, query.questionText);
            answer = responseText;
            status = AIQueryStatus.Answered;
            answeredOn = new Date().toISOString();
        } catch (e) {
            console.error("Gemini Call Failed inside MockDB", e);
            answer = "Failed to connect to AI service.";
            status = AIQueryStatus.Error;
            answeredOn = new Date().toISOString();
        }
    }

    const all = getStorage<AIQuery>(KEYS.AI_QUERIES);
    const newQuery = { 
        ...query, 
        id: generateId(), 
        createdOn: new Date().toISOString(),
        answerText: answer,
        status: status,
        answeredOn: answeredOn
    };
    setStorage(KEYS.AI_QUERIES, [...all, newQuery]);
    return newQuery;
};

export const updateAIQuery = async (query: any) => {
    const all = getStorage<AIQuery>(KEYS.AI_QUERIES);
    const index = all.findIndex(q => q.id === query.id);
    if (index !== -1) {
        all[index] = query;
        setStorage(KEYS.AI_QUERIES, all);
        return query;
    }
};


// ... (Keeping existing Razorpay logic)
export const getRazorpayConfig = (): RazorpayConfig | null => {
    const config = localStorage.getItem(KEYS.RAZORPAY_CONFIG);
    return config ? JSON.parse(config) : null;
};
export const saveRazorpayConfig = (config: RazorpayConfig) => {
    localStorage.setItem(KEYS.RAZORPAY_CONFIG, JSON.stringify(config));
};
export const getPaymentOrders = (companyId?: string): PaymentOrder[] => {
    const orders = getStorage<PaymentOrder>(KEYS.PAYMENT_ORDERS);
    if (companyId) {
        return orders.filter(o => o.companyId === companyId).sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    }
    return orders.sort((a,b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
};
export const createPaymentOrder = async (companyId: string, planName: PlanType, durationMonths: number, amountInPaise: number): Promise<PaymentOrder> => {
    const orders = getStorage<PaymentOrder>(KEYS.PAYMENT_ORDERS);
    const mockRazorpayOrderId = `order_${generateId()}_${Date.now()}`;
    const newOrder: PaymentOrder = {
        id: generateId(),
        companyId,
        planName,
        durationMonths,
        amountInPaise,
        currency: "INR",
        razorpayOrderId: mockRazorpayOrderId,
        status: PaymentStatus.Created,
        createdOn: new Date().toISOString()
    };
    setStorage(KEYS.PAYMENT_ORDERS, [...orders, newOrder]);
    return newOrder;
};
export const verifyPayment = async (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean> => {
    const orders = getStorage<PaymentOrder>(KEYS.PAYMENT_ORDERS);
    const index = orders.findIndex(o => o.razorpayOrderId === razorpayOrderId);
    if (index === -1) return false;
    const order = orders[index];
    const config = getRazorpayConfig();
    // if (!config || !config.keySecret) return false;  // Relaxed for demo
    orders[index] = { ...order, razorpayPaymentId, razorpaySignature, status: PaymentStatus.Paid, paidOn: new Date().toISOString() };
    setStorage(KEYS.PAYMENT_ORDERS, orders);
    const companies = getStorage<Company>(KEYS.COMPANIES);
    const compIndex = companies.findIndex(c => c.id === order.companyId);
    if (compIndex !== -1) {
        const company = companies[compIndex];
        const today = new Date();
        const currentEndDate = company.subscriptionEndDate ? new Date(company.subscriptionEndDate) : new Date(0);
        const isSamePlan = company.planType === order.planName;
        const isNotExpired = currentEndDate > today;
        const isActive = company.isSubscriptionActive;
        const isRenewal = isSamePlan && isActive && isNotExpired;
        let newStartDate = today.toISOString();
        let newEndDate = new Date();
        if (isRenewal) {
            newStartDate = company.subscriptionStartDate || today.toISOString();
            const baseDate = new Date(company.subscriptionEndDate!);
            baseDate.setMonth(baseDate.getMonth() + order.durationMonths);
            newEndDate = baseDate;
        } else {
            newStartDate = today.toISOString();
            const baseDate = new Date();
            baseDate.setMonth(baseDate.getMonth() + order.durationMonths);
            newEndDate = baseDate;
        }
        companies[compIndex] = {
            ...company,
            planType: order.planName,
            subscriptionPlan: order.planName,
            subscriptionStartDate: newStartDate,
            subscriptionEndDate: newEndDate.toISOString(),
            isSubscriptionActive: true,
            renewalStatus: 'Active'
        };
        setStorage(KEYS.COMPANIES, companies);
    }
    return true;
};

// ... (Rest of service functions: logActivity, mockLogin, etc.)
// Ensure all previous exports are maintained
export const logActivity = (c: string, u: string, et: any, ei: string, at: any, d: string) => { const all=getStorage<ActivityLog>(KEYS.ACTIVITY_LOGS); setStorage(KEYS.ACTIVITY_LOGS, [{id:generateId(),companyId:c,userId:u,entityType:et,entityId:ei,actionType:at,description:d,createdOn:new Date().toISOString()},...all]); };
export const getActivities = (c: string, f?: any) => getStorage<ActivityLog>(KEYS.ACTIVITY_LOGS).filter(l=>l.companyId===c && (!f?.entityId || l.entityId===f.entityId) && (!f?.entityType || l.entityType===f.entityType));
export const logPageView = (c: string, p: string, u: string, r: string) => { const all=getStorage<PageViewLog>(KEYS.PAGE_VIEWS); setStorage(KEYS.PAGE_VIEWS, [...all,{id:generateId(),companyId:c,pageId:p,userId:u,viewedOn:new Date().toISOString(),userRoleName:r}]); };
export const getAnalyticsData = (c: string, s: Date, e: Date): AnalyticsSummary => { return { totalPageViews:0, uniquePagesViewed:0, uniqueUsers:0, topPages:[], activeUsers:[], viewsByRole:[] }; };
export const addNotification = (c: string, u: string, t: string, m: string, et: any, ei?: string) => { const all=getStorage<Notification>(KEYS.NOTIFICATIONS); setStorage(KEYS.NOTIFICATIONS, [{id:generateId(),companyId:c,userId:u,title:t,message:m,entityType:et,entityId:ei,isRead:false,createdOn:new Date().toISOString()},...all]); };
export const getNotifications = (u: string) => getStorage<Notification>(KEYS.NOTIFICATIONS).filter(n=>n.userId===u);
export const getUnreadNotificationCount = (u: string) => getNotifications(u).filter(n=>!n.isRead).length;
export const markNotificationAsRead = (id: string) => { const all=getStorage<Notification>(KEYS.NOTIFICATIONS); const i=all.findIndex(x=>x.id===id); if(i!==-1){all[i].isRead=true;setStorage(KEYS.NOTIFICATIONS,all);} };
export const markAllNotificationsAsRead = (u: string) => { const all=getStorage<Notification>(KEYS.NOTIFICATIONS); all.forEach(n=>{if(n.userId===u)n.isRead=true}); setStorage(KEYS.NOTIFICATIONS,all); };
export const checkSubscriptionStatus = (id: string) => getStorage<Company>(KEYS.COMPANIES).find(c=>c.id===id) as Company;
export const renewSubscription = async (id: string, m: number) => getStorage<Company>(KEYS.COMPANIES).find(c=>c.id===id) as Company;
export const upgradeCompanyPlan = async (id: string) => getStorage<Company>(KEYS.COMPANIES).find(c=>c.id===id) as Company;
export const checkFeatureAccess = (id: string, f: string) => true;

export const mockLogin = async (email: string, password: string): Promise<User> => {
  const users = getStorage<User>(KEYS.USERS);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  if (user.status === 'inactive') throw new Error('User account is inactive');
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};
export const mockGoogleLogin = async (): Promise<{ email: string, name: string, picture: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { email: 'google_user@example.com', name: 'Google Test User', picture: 'https://via.placeholder.com/150' };
};
export const verifyInviteCode = async (code: string) => getStorage<Company>(KEYS.COMPANIES).find(c => c.inviteCode === code && c.isActive) || null;
export const checkUserExists = (email: string) => getStorage<User>(KEYS.USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
export const mockLogout = () => localStorage.removeItem(KEYS.SESSION);
export const getSession = () => { try { const s=localStorage.getItem(KEYS.SESSION); return s?JSON.parse(s):null; } catch(e){ return null; } };
export const getAllCompanies = () => getStorage<Company>(KEYS.COMPANIES);
export const getCompany = (id: string) => getStorage<Company>(KEYS.COMPANIES).find(c => c.id === id);
export const updateCompany = async (c: Company) => { const all=getStorage<Company>(KEYS.COMPANIES); const i=all.findIndex(x=>x.id===c.id); if(i!==-1){all[i]=c;setStorage(KEYS.COMPANIES,all);return c;} throw new Error("Not found"); };
export const createCompany = async (name: string, logo: string, admin: any, plan: PlanType = PlanType.Basic, max: number = 10) => {
    const companies = getStorage<Company>(KEYS.COMPANIES);
    const users = getStorage<User>(KEYS.USERS);
    if (users.some(u => u.email.toLowerCase() === admin.email.toLowerCase())) throw new Error('Email already registered');
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const newC: Company = {
        id: generateId(), companyName: name, logoURL: logo || `https://picsum.photos/seed/${generateId()}/200`,
        primaryAdminEmail: admin.email, createdOn: today.toISOString(),
        showLogoInHeader: true, homeTitle: `Welcome to ${name}`, planType: plan, isActive: true, maxUsers: max,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        subscriptionPlan: plan, subscriptionStartDate: today.toISOString(), subscriptionEndDate: nextMonth.toISOString(),
        isSubscriptionActive: true, renewalStatus: 'Active',
        primaryColor: '#dc2626', secondaryColor: '#f9fafb', accentColor: '#b91c1c'
    };
    const newU: User = { ...admin, id: generateId(), companyId: newC.id, status: 'active', role: RoleType.CompanyAdmin };
    setStorage(KEYS.COMPANIES, [...companies, newC]);
    setStorage(KEYS.USERS, [...users, newU]);
    return { company: newC, user: newU };
};
export const getCompanyStats = (cId: string) => {
    const u = getStorage<User>(KEYS.USERS).filter(x => x.companyId === cId);
    const s = getStorage<Space>(KEYS.SPACES).filter(x => x.companyId === cId);
    const p = getStorage<Page>(KEYS.PAGES).filter(x => x.companyId === cId);
    const d = getStorage<DocumentItem>(KEYS.DOCUMENTS).filter(x => x.companyId === cId);
    return { userCount: u.length, spaceCount: s.length, pageCount: p.length, docCount: d.length, admins: u.filter(x => x.role === RoleType.CompanyAdmin) };
};
export const initializeDemoData = () => {
  const users = getStorage<User>(KEYS.USERS);
  if (users.length === 0) {
    localStorage.setItem(KEYS.RAZORPAY_CONFIG, JSON.stringify({ keyId: 'rzp_test_demo_123', keySecret: 'secret' }));
    const companyId = generateId();
    const adminId = generateId();
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const demoCompany: Company = {
      id: companyId, companyName: 'Demo Corp', logoURL: '', primaryAdminEmail: 'admin@demo.com', createdOn: today.toISOString(),
      primaryColor: '#dc2626', secondaryColor: '#f9fafb', accentColor: '#b91c1c', homeTitle: 'Welcome to Demo Corp Portal',
      showLogoInHeader: false, planType: PlanType.Basic, isActive: true, maxUsers: 50, inviteCode: 'DEMO123',
      subscriptionPlan: PlanType.Basic, subscriptionStartDate: today.toISOString(), subscriptionEndDate: nextMonth.toISOString(), isSubscriptionActive: true, renewalStatus: 'Active'
    };
    const demoAdmin: User = {
      id: adminId, fullName: 'Demo Admin', email: 'admin@demo.com', password: 'password', designation: 'System Administrator', department: 'IT',
      status: 'active', companyId: companyId, role: RoleType.CompanyAdmin
    };
    const superCompanyId = generateId();
    const superAdminId = generateId();
    const superCompany: Company = {
        id: superCompanyId, companyName: 'Platform Admin', logoURL: '', primaryAdminEmail: 'super@platform.com', createdOn: today.toISOString(),
        planType: PlanType.Pro, isActive: true, notes: 'Super Admin', subscriptionPlan: PlanType.Pro, subscriptionStartDate: today.toISOString(), subscriptionEndDate: nextMonth.toISOString(), isSubscriptionActive: true, renewalStatus: 'Active'
    };
    const superAdminUser: User = {
        id: superAdminId, fullName: 'Super Admin', email: 'super@platform.com', password: 'password', designation: 'Platform Administrator', department: 'Operations',
        status: 'active', companyId: superCompanyId, role: RoleType.SuperAdmin
    };
    setStorage(KEYS.COMPANIES, [demoCompany, superCompany]);
    setStorage(KEYS.USERS, [demoAdmin, superAdminUser]);
    setStorage(KEYS.DEPARTMENTS, [{id: generateId(), companyId, name: 'IT', isActive: true, createdOn: today.toISOString()}]);
    const sId = generateId();
    setStorage(KEYS.SPACES, [{id: sId, spaceName: 'General', description: 'Main', companyId, createdBy: adminId, createdAt: today.toISOString()}]);
    setStorage(KEYS.SPACE_MEMBERS, [{id: generateId(), spaceId: sId, userId: adminId, roleInSpace: SpaceRole.SpaceManager, isActive: true, createdOn: today.toISOString()}]);
  }
};
// ... Export standard getters
export const getDepartments = (cId: string) => getStorage<Department>(KEYS.DEPARTMENTS).filter(d => d.companyId === cId);
export const getDepartment = (id: string) => getStorage<Department>(KEYS.DEPARTMENTS).find(d => d.id === id);
export const addDepartment = async (d: any) => { const all=getStorage<Department>(KEYS.DEPARTMENTS); const n={...d, id:generateId(), createdOn:new Date().toISOString()}; setStorage(KEYS.DEPARTMENTS,[...all,n]); return n; };
export const updateDepartment = async (d: Department) => { const all=getStorage<Department>(KEYS.DEPARTMENTS); const i=all.findIndex(x=>x.id===d.id); if(i!==-1){all[i]=d;setStorage(KEYS.DEPARTMENTS,all);return d;} throw new Error("Not found"); };
export const deleteDepartment = async (id: string) => { const all=getStorage<Department>(KEYS.DEPARTMENTS); const i=all.findIndex(x=>x.id===id); if(i!==-1){all[i].isActive=false;setStorage(KEYS.DEPARTMENTS,all);} };
export const getUsers = (cId: string) => getStorage<User>(KEYS.USERS).filter(u => u.companyId === cId);
export const getUserById = (id: string) => getStorage<User>(KEYS.USERS).find(u => u.id === id);
export const addUser = async (u: any) => { const all=getStorage<User>(KEYS.USERS); const newU={...u,id:generateId()}; setStorage(KEYS.USERS,[...all,newU]); return newU; };
export const updateUser = async (u: User) => { const all=getStorage<User>(KEYS.USERS); const i=all.findIndex(x=>x.id===u.id); if(i!==-1){all[i]=u;setStorage(KEYS.USERS,all);if(getSession()?.id===u.id)localStorage.setItem(KEYS.SESSION,JSON.stringify(u));return u;} throw new Error("Not found"); };
export const deleteUser = async (id: string, req: User) => { const all=getStorage<User>(KEYS.USERS); setStorage(KEYS.USERS,all.filter(u=>u.id!==id)); };
export const getSpaces = (cId: string) => getStorage<Space>(KEYS.SPACES).filter(s => s.companyId === cId);
export const getVisibleSpaces = (cId: string, uId: string) => {
    const s = getSpaces(cId);
    const u = getUserById(uId);
    if(u?.role === RoleType.CompanyAdmin) return s;
    const m = getStorage<SpaceMember>(KEYS.SPACE_MEMBERS);
    const vis = new Set(m.filter(x => x.userId === uId && x.isActive).map(x => x.spaceId));
    return s.filter(x => vis.has(x.id));
};
export const getSpaceById = (id: string) => getStorage<Space>(KEYS.SPACES).find(s => s.id === id);
export const addSpace = async (s: any) => { const all=getStorage<Space>(KEYS.SPACES); const n={...s,id:generateId()}; setStorage(KEYS.SPACES,[...all,n]); return n; };
export const updateSpace = async (s: Space) => { const all=getStorage<Space>(KEYS.SPACES); const idx = all.findIndex(x => x.id === s.id); if(idx !== -1) { all[idx] = s; setStorage(KEYS.SPACES, all); } return s; };
export const deleteSpace = async (id: string) => { const all=getStorage<Space>(KEYS.SPACES); setStorage(KEYS.SPACES,all.filter(s=>s.id!==id)); };
export const getSpaceMembers = (sId: string) => getStorage<SpaceMember>(KEYS.SPACE_MEMBERS).filter(m => m.spaceId === sId);
export const getUserMemberships = (uId: string) => getStorage<SpaceMember>(KEYS.SPACE_MEMBERS).filter(m => m.userId === uId && m.isActive);
export const checkSpaceAccess = (sId: string, uId: string) => true; 
export const getMemberRole = (sId: string, uId: string) => SpaceRole.Member;
export const addSpaceMember = async (m: any) => { const all=getStorage<SpaceMember>(KEYS.SPACE_MEMBERS); const n={...m,id:generateId()}; setStorage(KEYS.SPACE_MEMBERS,[...all,n]); return n; };
export const updateSpaceMember = async (m: SpaceMember) => { const all=getStorage<SpaceMember>(KEYS.SPACE_MEMBERS); const i=all.findIndex(x=>x.id===m.id); if(i!==-1){all[i]=m;setStorage(KEYS.SPACE_MEMBERS,all);return m;} throw new Error("Not found"); };
export const getPages = (cId: string) => getStorage<Page>(KEYS.PAGES).filter(p => p.companyId === cId);
export const getPage = (id: string) => getStorage<Page>(KEYS.PAGES).find(p => p.id === id);
export const addPage = async (p: any) => { const all=getStorage<Page>(KEYS.PAGES); const n={...p,id:generateId(),createdOn:new Date().toISOString(),updatedOn:new Date().toISOString()}; setStorage(KEYS.PAGES,[...all,n]); return n; };
export const updatePage = async (p: any, uid: string) => { const all=getStorage<Page>(KEYS.PAGES); const i=all.findIndex(x=>x.id===p.id); if(i!==-1){all[i]={...p,updatedOn:new Date().toISOString()};setStorage(KEYS.PAGES,all);return all[i];} throw new Error("Not found"); };
export const getPageComments = (pid: string) => getStorage<PageComment>(KEYS.PAGE_COMMENTS).filter(c => c.pageId === pid);
export const addPageComment = async (c: any) => { const all=getStorage<PageComment>(KEYS.PAGE_COMMENTS); const n={...c,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.PAGE_COMMENTS,[...all,n]); return n; };
export const updatePageComment = async (id: string, t: string) => { const all=getStorage<PageComment>(KEYS.PAGE_COMMENTS); const i=all.findIndex(x=>x.id===id); if(i!==-1){all[i].commentText=t;setStorage(KEYS.PAGE_COMMENTS,all);} };
export const deletePageComment = async (id: string) => { const all=getStorage<PageComment>(KEYS.PAGE_COMMENTS); setStorage(KEYS.PAGE_COMMENTS,all.filter(c=>c.id!==id)); };
export const getPageWidgets = (pid: string) => getStorage<PageWidget>(KEYS.PAGE_WIDGETS).filter(w => w.pageId === pid);
export const getPageWidget = (id: string) => getStorage<PageWidget>(KEYS.PAGE_WIDGETS).find(w => w.id === id);
export const addPageWidget = async (w: any) => { const all=getStorage<PageWidget>(KEYS.PAGE_WIDGETS); const n={...w,id:generateId()}; setStorage(KEYS.PAGE_WIDGETS,[...all,n]); return n; };
export const updatePageWidget = async (w: any, uid: string) => { const all=getStorage<PageWidget>(KEYS.PAGE_WIDGETS); const i=all.findIndex(x=>x.id===w.id); if(i!==-1){all[i]=w;setStorage(KEYS.PAGE_WIDGETS,all);return w;} throw new Error("Not found"); };
export const deletePageWidget = async (id: string) => { const all=getStorage<PageWidget>(KEYS.PAGE_WIDGETS); setStorage(KEYS.PAGE_WIDGETS,all.filter(w=>w.id!==id)); };
export const getDocuments = (cId: string) => getStorage<DocumentItem>(KEYS.DOCUMENTS).filter(d => d.companyId === cId);
export const getDocument = (id: string) => getStorage<DocumentItem>(KEYS.DOCUMENTS).find(d => d.id === id);
export const addDocument = async (d: any) => { const all=getStorage<DocumentItem>(KEYS.DOCUMENTS); const n={...d,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.DOCUMENTS,[...all,n]); return n; };
export const updateDocument = async (d: any) => { const all=getStorage<DocumentItem>(KEYS.DOCUMENTS); const i=all.findIndex(x=>x.id===d.id); if(i!==-1){all[i]=d;setStorage(KEYS.DOCUMENTS,all);return d;} throw new Error("Not found"); };
export const getAnnouncements = (cId: string) => getStorage<Announcement>(KEYS.ANNOUNCEMENTS).filter(a => a.companyId === cId);
export const getAnnouncement = (id: string) => getStorage<Announcement>(KEYS.ANNOUNCEMENTS).find(a => a.id === id);
export const addAnnouncement = async (a: any) => { const all=getStorage<Announcement>(KEYS.ANNOUNCEMENTS); const n={...a,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.ANNOUNCEMENTS,[...all,n]); return n; };
export const updateAnnouncement = async (a: any) => { const all=getStorage<Announcement>(KEYS.ANNOUNCEMENTS); const i=all.findIndex(x=>x.id===a.id); if(i!==-1){all[i]=a;setStorage(KEYS.ANNOUNCEMENTS,all);return a;} throw new Error("Not found"); };
export const deleteAnnouncement = async (id: string) => { const all=getStorage<Announcement>(KEYS.ANNOUNCEMENTS); setStorage(KEYS.ANNOUNCEMENTS,all.filter(a=>a.id!==id)); };
export const getNavQuickLinks = (cId: string) => getStorage<NavQuickLink>(KEYS.NAV_QUICK_LINKS).filter(l => l.companyId === cId);
export const getNavQuickLink = (id: string) => getStorage<NavQuickLink>(KEYS.NAV_QUICK_LINKS).find(l => l.id === id);
export const addNavQuickLink = async (l: any) => { const all=getStorage<NavQuickLink>(KEYS.NAV_QUICK_LINKS); const n={...l,id:generateId()}; setStorage(KEYS.NAV_QUICK_LINKS,[...all,n]); return n; };
export const updateNavQuickLink = async (l: any) => { const all=getStorage<NavQuickLink>(KEYS.NAV_QUICK_LINKS); const i=all.findIndex(x=>x.id===l.id); if(i!==-1){all[i]=l;setStorage(KEYS.NAV_QUICK_LINKS,all);return l;} throw new Error("Not found"); };
export const deleteNavQuickLink = async (id: string) => { const all=getStorage<NavQuickLink>(KEYS.NAV_QUICK_LINKS); setStorage(KEYS.NAV_QUICK_LINKS,all.filter(l=>l.id!==id)); };
export const getFavorites = (uid: string) => getStorage<FavoriteItem>(KEYS.FAVORITES).filter(f => f.userId === uid && f.isActive);
export const checkIsFavorite = (uid: string, t: EntityType, id: string) => getStorage<FavoriteItem>(KEYS.FAVORITES).some(f => f.userId === uid && f.entityType === t && f.entityId === id && f.isActive);
export const toggleFavorite = async (cId: string, uid: string, t: EntityType, id: string) => { const all=getStorage<FavoriteItem>(KEYS.FAVORITES); const ex=all.find(f=>f.userId===uid && f.entityType===t && f.entityId===id); if(ex){ex.isActive=!ex.isActive;setStorage(KEYS.FAVORITES,all);return ex.isActive;} const n={id:generateId(),companyId:cId,userId:uid,entityType:t,entityId:id,isActive:true,createdOn:new Date().toISOString()}; setStorage(KEYS.FAVORITES,[...all,n]); return true; };
export const getReadAcknowledgements = (uid: string) => getStorage<ReadAcknowledgement>(KEYS.READ_ACKNOWLEDGEMENTS).filter(a => a.userId === uid);
export const checkReadAcknowledgement = (uid: string, t: EntityType, id: string) => getStorage<ReadAcknowledgement>(KEYS.READ_ACKNOWLEDGEMENTS).find(a => a.userId === uid && a.entityType === t && a.entityId === id);
export const addReadAcknowledgement = async (a: any) => { const all=getStorage<ReadAcknowledgement>(KEYS.READ_ACKNOWLEDGEMENTS); const n={...a,id:generateId(),acknowledgedOn:new Date().toISOString()}; setStorage(KEYS.READ_ACKNOWLEDGEMENTS,[...all,n]); return n; };
export const getAcknowledgementsByEntity = (id: string, t: EntityType) => getStorage<ReadAcknowledgement>(KEYS.READ_ACKNOWLEDGEMENTS).filter(a => a.entityId === id && a.entityType === t);
export const getPageTemplates = (cId: string) => getStorage<PageTemplate>(KEYS.PAGE_TEMPLATES).filter(t => t.companyId === cId);
export const getPageTemplate = (id: string) => getStorage<PageTemplate>(KEYS.PAGE_TEMPLATES).find(t => t.id === id);
export const addPageTemplate = async (t: any) => { const all=getStorage<PageTemplate>(KEYS.PAGE_TEMPLATES); const n={...t,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.PAGE_TEMPLATES,[...all,n]); return n; };
export const updatePageTemplate = async (t: any) => { const all=getStorage<PageTemplate>(KEYS.PAGE_TEMPLATES); const i=all.findIndex(x=>x.id===t.id); if(i!==-1){all[i]=t;setStorage(KEYS.PAGE_TEMPLATES,all);return t;} throw new Error("Not found"); };
export const deletePageTemplate = async (id: string) => { const all=getStorage<PageTemplate>(KEYS.PAGE_TEMPLATES); setStorage(KEYS.PAGE_TEMPLATES,all.filter(t=>t.id!==id)); };
export const getKnowledgeCategories = (cId: string) => getStorage<KnowledgeCategory>(KEYS.KNOWLEDGE_CATEGORIES).filter(c => c.companyId === cId);
export const getKnowledgeCategory = (id: string) => getStorage<KnowledgeCategory>(KEYS.KNOWLEDGE_CATEGORIES).find(c => c.id === id);
export const addKnowledgeCategory = async (c: any) => { const all=getStorage<KnowledgeCategory>(KEYS.KNOWLEDGE_CATEGORIES); const n={...c,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.KNOWLEDGE_CATEGORIES,[...all,n]); return n; };
export const updateKnowledgeCategory = async (c: any) => { const all=getStorage<KnowledgeCategory>(KEYS.KNOWLEDGE_CATEGORIES); const i=all.findIndex(x=>x.id===c.id); if(i!==-1){all[i]=c;setStorage(KEYS.KNOWLEDGE_CATEGORIES,all);return c;} throw new Error("Not found"); };
export const getKnowledgeArticles = (cId: string) => getStorage<KnowledgeArticle>(KEYS.KNOWLEDGE_ARTICLES).filter(a => a.companyId === cId);
export const getKnowledgeArticle = (id: string) => getStorage<KnowledgeArticle>(KEYS.KNOWLEDGE_ARTICLES).find(a => a.id === id);
export const getKnowledgeArticlesByPage = (pid: string) => getStorage<KnowledgeArticle>(KEYS.KNOWLEDGE_ARTICLES).filter(a => a.relatedPageId === pid);
export const addKnowledgeArticle = async (a: any) => { const all=getStorage<KnowledgeArticle>(KEYS.KNOWLEDGE_ARTICLES); const n={...a,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.KNOWLEDGE_ARTICLES,[...all,n]); return n; };
export const updateKnowledgeArticle = async (a: any) => { const all=getStorage<KnowledgeArticle>(KEYS.KNOWLEDGE_ARTICLES); const i=all.findIndex(x=>x.id===a.id); if(i!==-1){all[i]=a;setStorage(KEYS.KNOWLEDGE_ARTICLES,all);return a;} throw new Error("Not found"); };
export const getEvents = (cId: string) => getStorage<Event>(KEYS.EVENTS).filter(e => e.companyId === cId);
export const getEvent = (id: string) => getStorage<Event>(KEYS.EVENTS).find(e => e.id === id);
export const addEvent = async (e: any) => { const all=getStorage<Event>(KEYS.EVENTS); const n={...e,id:generateId(),createdOn:new Date().toISOString()}; setStorage(KEYS.EVENTS,[...all,n]); return n; };
export const updateEvent = async (e: any) => { const all=getStorage<Event>(KEYS.EVENTS); const i=all.findIndex(x=>x.id===e.id); if(i!==-1){all[i]=e;setStorage(KEYS.EVENTS,all);return e;} throw new Error("Not found"); };
