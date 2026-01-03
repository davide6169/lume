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
  operator: 'AND' | 'OR' | 'NOT' | 'CONTAINS' | 'EQUALS' | 'GT' | 'LT';
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
  createdAt: Date;
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
  selectedLlmModel?: string;
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
