

export enum RoleType {
  SuperAdmin = 'SuperAdmin',
  CompanyAdmin = 'CompanyAdmin',
  SpaceManager = 'SpaceManager',
  Member = 'Member',
  Viewer = 'Viewer'
}

export enum PlanType {
  Basic = 'Basic',
  Pro = 'Pro'
}

// NEW: Razorpay Types
export enum PaymentStatus {
  Created = 'Created',
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export interface PaymentOrder {
  id: string;
  companyId: string;
  planName: PlanType;
  durationMonths: number;
  amountInPaise: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  createdOn: string; // ISO String
  paidOn?: string; // ISO String
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

// NEW: Custom Domain
export interface CustomDomain {
  id: string;
  companyId: string;
  domainName: string;
  dnsVerificationToken: string;
  isVerified: boolean;
  createdOn: string;
  verifiedOn?: string;
  lastCheck?: string;
}

export enum ThemePreference {
  Light = 'Light',
  Dark = 'Dark',
  System = 'System'
}

export interface Company {
  id: string;
  companyName: string;
  logoURL: string;
  faviconURL?: string; 
  primaryAdminEmail: string;
  createdOn: string; // ISO String
  inviteCode?: string; // New field for joining via code
  // Branding fields
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  homeTitle?: string;
  showLogoInHeader?: boolean;
  headingFontFamily?: string;
  bodyFontFamily?: string;
  // Super Admin fields
  planType?: PlanType;
  isActive?: boolean;
  maxUsers?: number;
  notes?: string;
  // Subscription Fields
  subscriptionPlan?: PlanType; // Synced with planType
  subscriptionStartDate?: string; // ISO String
  subscriptionEndDate?: string; // ISO String
  isSubscriptionActive?: boolean;
  renewalStatus?: 'Active' | 'ExpiringSoon' | 'Expired';
  geminiApiKey?: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  createdOn: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string; // Plaintext for MVP simulation
  designation: string;
  department: string; // Legacy text field
  departmentId?: string; // New structured relation
  status: 'active' | 'inactive';
  companyId: string;
  role: RoleType;
  themePreference?: ThemePreference; 
  whatsappNumber?: string;
}

export interface Space {
  id: string;
  spaceName: string;
  description: string;
  companyId: string;
  createdBy: string; // User ID
  createdAt: string; // ISO String
  coverImageURL?: string; 
}

export enum SpaceRole {
  SpaceManager = 'SpaceManager',
  Member = 'Member'
}

export interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  roleInSpace: SpaceRole;
  isActive: boolean;
  createdOn: string;
}

export interface Page {
  id: string;
  pageTitle: string;
  summary?: string;
  content: string;
  status: 'Draft' | 'Published';
  spaceId: string;
  companyId: string;
  createdBy: string; // User ID
  updatedBy?: string; // User ID
  createdOn: string; // ISO String
  updatedOn: string; // ISO String
  headerImageURL?: string; 
}

export interface PageComment {
  id: string;
  pageId: string;
  companyId: string;
  userId: string;
  commentText: string;
  createdOn: string; // ISO String
  isEdited: boolean;
  editedOn?: string; // ISO String
  isActive: boolean;
}

export enum WidgetType {
  EmbedFrame = 'EmbedFrame'
}

export interface PageWidget {
  id: string;
  pageId: string;
  companyId: string;
  widgetTitle: string;
  widgetType: WidgetType;
  embedURL: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  createdBy: string; // User ID
  createdOn: string; // ISO String
  updatedBy?: string; // User ID
  updatedOn?: string; // ISO String
}

export enum DocumentType {
  FileLink = 'FileLink',
  ExternalLink = 'ExternalLink',
  InternalNote = 'InternalNote',
  Embed = 'Embed'
}

export enum DocumentImportance {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  itemType: DocumentType;
  fileURL?: string;
  externalURL?: string;
  spaceId: string;
  pageId?: string;
  companyId: string;
  createdBy: string; // User ID
  createdOn: string; // ISO String
  updatedBy?: string; // User ID
  updatedOn: string; // ISO String
  tags?: string; // Comma separated
  isActive: boolean;
  // New Fields
  isPolicy?: boolean;
  expiryDate?: string; // ISO Date String YYYY-MM-DD
  ownerUserId?: string;
  importanceLevel?: DocumentImportance;
  previewImageURL?: string; 
}

export enum AnnouncementAudience {
  CompanyWide = 'CompanyWide',
  SpaceSpecific = 'SpaceSpecific'
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audienceType: AnnouncementAudience;
  spaceId?: string;
  companyId: string;
  createdBy: string; // User ID
  createdOn: string; // ISO String
  isPinned: boolean;
  isActive: boolean;
  announcementImageURL?: string; 
}

export enum EntityType {
  Page = 'Page',
  DocumentItem = 'DocumentItem',
  Announcement = 'Announcement',
  Space = 'Space',
  KnowledgeArticle = 'KnowledgeArticle',
  Event = 'Event',
  Other = 'Other'
}

export enum ActionType {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  Published = 'Published',
  Unpublished = 'Unpublished',
  Pinned = 'Pinned',
  Unpinned = 'Unpinned'
}

export interface ActivityLog {
  id: string;
  companyId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  actionType: ActionType;
  description?: string;
  createdOn: string; // ISO String
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  entityType: EntityType | 'Other';
  entityId?: string;
  isRead: boolean;
  createdOn: string;
}

export enum NavTargetType {
  ExternalURL = 'ExternalURL',
  Page = 'Page',
  Space = 'Space',
  Documents = 'Documents',
  Announcements = 'Announcements',
  Other = 'Other'
}

export interface NavQuickLink {
  id: string;
  companyId: string;
  label: string;
  targetType: NavTargetType;
  targetURL?: string;
  pageId?: string;
  spaceId?: string;
  displayOrder?: number;
  isActive: boolean;
}

export interface PageViewLog {
  id: string;
  companyId: string;
  pageId: string;
  userId: string;
  viewedOn: string; // ISO String
  userRoleName?: string;
}

export interface FavoriteItem {
  id: string;
  companyId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  createdOn: string;
  isActive: boolean;
}

export interface PageTemplate {
  id: string;
  companyId: string;
  templateName: string;
  description?: string;
  defaultTitlePrefix?: string;
  defaultSummary?: string;
  defaultContent?: string;
  defaultStatus: 'Draft' | 'Published';
  recommendedSpaceId?: string;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
}

export interface ReadAcknowledgement {
  id: string;
  companyId: string;
  userId: string;
  entityType: EntityType; // Announcement or DocumentItem
  entityId: string;
  acknowledgedOn: string; // ISO String
}

export interface KnowledgeCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  createdOn: string;
}

export interface KnowledgeArticle {
  id: string;
  companyId: string;
  categoryId: string;
  title: string;
  question?: string;
  answer: string;
  relatedSpaceId?: string;
  relatedPageId?: string;
  tags?: string; // Comma separated
  isActive: boolean;
  isFeatured: boolean;
  createdBy: string;
  createdOn: string;
  updatedBy?: string;
  updatedOn?: string;
}

export enum EventType {
  CompanyEvent = 'CompanyEvent',
  Holiday = 'Holiday',
  Training = 'Training',
  Birthday = 'Birthday',
  Other = 'Other'
}

export interface Event {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  eventType: EventType;
  startDateTime: string; // ISO String
  endDateTime?: string; // ISO String
  location?: string;
  spaceId?: string;
  isAllDay: boolean;
  isPublic: boolean;
  createdBy: string;
  createdOn: string;
  updatedOn?: string;
  isActive: boolean;
  eventBannerURL?: string; 
}

// AI Assistant Types
export enum AIQueryScope {
  Global = 'Global',
  Space = 'Space',
  Page = 'Page',
  Document = 'Document',
  KnowledgeBase = 'KnowledgeBase'
}

export enum AIQueryStatus {
  Pending = 'Pending',
  Answered = 'Answered',
  Error = 'Error'
}

export interface AIQuery {
  id: string;
  companyId: string;
  userId: string;
  scopeType: AIQueryScope;
  scopeSpaceId?: string;
  scopePageId?: string;
  scopeDocumentId?: string;
  scopeKnowledgeArticleId?: string;
  questionText: string;
  answerText?: string;
  status: AIQueryStatus;
  createdOn: string; // ISO String
  answeredOn?: string; // ISO String
}

export const SEED_ROLES = [
  RoleType.SuperAdmin,
  RoleType.CompanyAdmin,
  RoleType.SpaceManager,
  RoleType.Member,
  RoleType.Viewer
];