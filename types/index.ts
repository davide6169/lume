// ============================================
// LUME - Type Definitions
// ============================================

// ============================================
// Database Models
// ============================================

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceAudience {
  id: string;
  userId: string;
  name: string;
  type: 'facebook' | 'instagram';
  urls: string[];
  selected: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  interests?: string[];
  [key: string]: any;
}

export interface SharedAudience {
  id: string;
  userId: string;
  sourceAudienceId: string;
  sourceAudienceType: 'facebook' | 'instagram';
  name: string;
  contacts: Contact[];
  selected: boolean;
  uploadedToMeta: boolean;
  metaAudienceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: 'CONTAINS' | 'EQUALS' | 'NOT' | 'STARTS_WITH' | 'ENDS_WITH' | 'NOT_STARTS_WITH' | 'NOT_ENDS_WITH' | 'GT' | 'LT';
  logicalOperator?: 'AND' | 'OR';
  value: any;
}

export interface Filter {
  id: string;
  userId: string;
  name: string;
  rules: FilterRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  encryptedKeys: {
    meta?: string;
    supabase?: string;
    openrouter?: string;
    mixedbread?: string;
    apollo?: string;
    hunter?: string;
  };
  demoMode: boolean;
  selectedLlmModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCost {
  id: string;
  userId: string;
  service: 'supabase' | 'openrouter' | 'mixedbread' | 'apollo' | 'hunter';
  operation: string;
  cost: number;
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  userId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  created_at?: Date | string; // Support both camelCase and snake_case from DB
}

export interface Job {
  id: string;
  userId: string;
  type: 'SEARCH' | 'UPLOAD_TO_META';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  payload: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
  timeline: Array<{
    timestamp: string;
    event: string;
    details?: any;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// UI State Types
// ============================================

export interface SearchProgress {
  sourceAudienceId: string;
  sourceAudienceName: string;
  totalUrls: number;
  processedUrls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  contactsFound: number;
  currentUrl?: string;
  error?: string;
}

export interface OverallProgress {
  totalSourceAudiences: number;
  processedSourceAudiences: number;
  totalUrls: number;
  processedUrls: number;
  percentage: number;
  isRunning: boolean;
  canCancel: boolean;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateSourceAudienceRequest {
  name: string;
  type: 'facebook' | 'instagram';
  urls: string[];
}

export interface SearchRequest {
  sourceAudienceIds: string[];
}

export interface SearchResponse {
  jobId: string;
  message: string;
}

export interface UploadToMetaRequest {
  sharedAudienceIds: string[];
}

export interface ExportRequest {
  sharedAudienceIds: string[];
  filterIds?: string[];
}

// ============================================
// Demo Mode Types
// ============================================

export interface DemoData {
  sourceAudiences: SourceAudience[];
  sharedAudiences: SharedAudience[];
  contacts: Contact[];
  costs: ServiceCost[];
}

// ============================================
// Import/Export Types
// ============================================

export interface ExportableSettings {
  apiKeys?: {
    meta?: string;
    supabase?: string;
    openrouter?: string;
    mixedbread?: string;
    apollo?: string;
    hunter?: string;
  };
  demoMode?: boolean;
  logsEnabled?: boolean;
  selectedLlmModel?: string;
  selectedEmbeddingModel?: string;
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
}

export interface ExportableSourceAudiences {
  sourceAudiences: Omit<SourceAudience, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
}

export interface ExportableFilters {
  filters: Omit<Filter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
}

// ============================================
// Dashboard Statistics
// ============================================

export interface DashboardStats {
  totalSourceAudiences: number;
  totalUrls: number;
  totalContactsFound: number;
  totalContactsUploaded: number;
  totalCost: number;
  costsByService: {
    service: string;
    cost: number;
  }[];
  recentActivity: {
    date: Date;
    sourceAudiences: number;
    contacts: number;
  }[];
}

// ============================================
// Meta Ads Types
// ============================================

export interface MetaAudience {
  id: string;
  name: string;
  description?: string;
  approximateCount: number;
  subtype: string;
  timeCreated: number;
  timeUpdated: number;
}

export interface MetaCustomAudienceCreateRequest {
  name: string;
  subtype: 'CUSTOM';
  description?: string;
  customer_file_source: 'USER_PROVIDED';
  schema: Array<{
    field: string;
    type: string;
  }>;
  data: Array<{
    [key: string]: string;
  }>;
}

// ============================================
// Service Response Types
// ============================================

export interface MetaGraphApiResponse {
  data: any[];
  paging?: {
    cursors?: {
      after: string;
      before: string;
    };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MixedbreadEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ApolloContactResponse {
  person?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    title?: string;
    organization?: string;
  };
}

export interface HunterEmailResponse {
  data?: {
    email: string;
    status: 'valid' | 'invalid' | 'accept_all' | 'unknown';
    score: number;
    domain?: string;
    sources?: Array<{
      domain: string;
      uri: string;
      extracted_on: string;
    }>;
  };
}

// ============================================
// Utility Types
// ============================================

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// ============================================
// Meta GraphAPI Types
// ============================================

export interface ParsedMetaUrl {
  platform: 'facebook' | 'instagram';
  type: 'page' | 'group' | 'post' | 'profile' | 'media';
  id: string;
  username?: string;
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
}

export interface FacebookComment {
  id: string;
  from: {
    id: string;
    name: string;
  };
  message: string;
  created_time: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramComment {
  id: string;
  from: {
    id: string;
    username: string;
  };
  text: string;
  timestamp: string;
}

export interface FetchOptions {
  limit?: number;
  after?: string;
  fields?: string[];
}

export enum MetaErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  PRIVATE_CONTENT = 'PRIVATE_CONTENT',
  UNKNOWN = 'UNKNOWN'
}

export interface MetaGraphApiError {
  type: MetaErrorType;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
  code?: number;
}
