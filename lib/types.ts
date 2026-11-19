export type SourceType =
  | "google"
  | "facebook"
  | "linkedin"
  | "directory"
  | "website"
  | "manual"
  | "GOOGLE"
  | "GOOGLE_PLACES"
  | "DIRECTORY"
  | "WEBSITE"
  | "LINKEDIN"
  | "APOLLO"
  | "HUNTER"
  | "IMPORT_CSV"
  | "MANUAL"
  | string;

export type BuyerType =
  | "Importer"
  | "Wholesaler"
  | "Retailer"
  | "Distributor"
  | "Wellness Store"
  | "Showroom"
  | "Consumer";

export type EmailStatus = "not_sent" | "sent" | "opened" | "replied" | "bounced";

export interface Lead {
  id: string;
  company: string;
  website: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  source: SourceType;
  buyerType: BuyerType;
  emailValid: boolean | null;
  emailValidationReason?: string;
  aiClass: "b2b" | "consumer" | null;
  aiConfidence: number;
  aiReasoning?: string;
  emailStatus: EmailStatus;
  createdAt: string;
  called?: boolean;
  callNotes?: string;
}

export interface DiscoveryRun {
  id: string;
  product: string;
  category: string;
  country: string;
  state?: string;
  city?: string;
  sources: string[];
  leadsFound: number;
  duplicatesBlocked: number;
  status: "completed" | "running" | "failed";
  date: string;
}

export interface Campaign {
  id: string;
  name: string;
  product: string;
  country: string;
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  bounced: number;
  status: "active" | "draft" | "completed";
  date: string;
}

export interface ValidationPurgedEntry {
  id: string;
  leadId: string;
  company: string;
  email: string;
  reason: "syntax_invalid" | "disposable_domain" | "no_mx_record" | "role_based";
  purgedAt: string;
  originalLead: Lead;
}

export interface EmailLog {
  id: string;
  leadId: string;
  company: string;
  contactName: string;
  email: string;
  subject: string;
  status: "sent" | "opened" | "replied" | "bounced";
  timestamp: string;
  sentAt: string;
}
