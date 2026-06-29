export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  avatarUrl?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
  department?: { id: string; name: string } | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  description?: string | null;
  logoUrl?: string | null;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'MANAGER'
  | 'AGENT'
  | 'EMPLOYEE';

export type TicketCategory = 'HR' | 'IT' | 'ADMIN' | 'FINANCE';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CLOSED';

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export type DocumentSource = 'MANUAL_UPLOAD' | 'WORKDAY' | 'GOOGLE_DRIVE' | 'SLACK';

export interface AuthResponse {
  token: string;
  user: User;
  company: Company;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  source?: DocumentSource;
  externalId?: string | null;
  sourceUrl?: string | null;
  category?: string | null;
  tags?: string[] | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  uploadedBy?: { id: string; firstName: string; lastName: string };
  _count?: { chunks: number };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[] | null;
  confidence?: number | null;
  suggestTicket?: boolean;
  createdAt: string;
}

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
}

export interface ChatSession {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string; email?: string };
  assignee?: { id: string; firstName: string; lastName: string; email?: string } | null;
  department?: { id: string; name: string } | null;
  comments?: TicketComment[];
  activities?: TicketActivity[];
}

export interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

export interface TicketActivity {
  id: string;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; firstName: string; lastName: string } | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { users: number; tickets: number };
}

export interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalChats: number;
  totalTickets: number;
  openTickets: number;
  unansweredQuestions: number;
  mostAskedTopics: { category: string; count: number }[];
  recentTickets: Pick<
    Ticket,
    'id' | 'ticketNumber' | 'subject' | 'status' | 'category' | 'createdAt'
  >[];
}

export interface Integration {
  provider: string;
  name: string;
  description: string;
  category: string;
  status: string;
  connectedAt?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  location: string | null;
  htmlLink: string | null;
  meetLink: string | null;
  meetCode: string | null;
  allDay: boolean;
  organizerName: string | null;
  organizerEmail: string | null;
  attendeeCount: number;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  start: string;
  duration: number;
  timezone: string;
  joinUrl: string;
  password: string | null;
  hostEmail: string | null;
  meetingNumber: string;
}
