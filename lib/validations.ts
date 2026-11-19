import { z } from "zod";

// ==========================================
// Discovery & Provider Schemas
// ==========================================

export const BuyerTypeEnum = z.enum([
  "IMPORTER",
  "WHOLESALER",
  "RETAILER",
  "DISTRIBUTOR",
  "SHOWROOM",
  "WELLNESS_STORE",
  "INDIVIDUAL",
  "UNKNOWN",
]);

export const LeadSourceEnum = z.enum([
  "GOOGLE",
  "GOOGLE_PLACES",
  "DIRECTORY",
  "WEBSITE",
  "LINKEDIN",
  "APOLLO",
  "HUNTER",
  "IMPORT_CSV",
  "MANUAL",
]);

export const EmailStatusEnum = z.enum([
  "NOT_SENT",
  "QUEUED",
  "SENT",
  "OPENED",
  "REPLIED",
  "BOUNCED",
  "FAILED",
  "SKIPPED",
]);

export const EmailValidationStatusEnum = z.enum([
  "UNCHECKED",
  "VALID",
  "INVALID",
  "RISKY",
  "CATCH_ALL",
]);

export const AIClassificationEnum = z.enum([
  "B2B",
  "CONSUMER",
  "UNKNOWN",
]);

export const DiscoverySearchInputSchema = z.object({
  product: z.string().min(2, "Product name is required"),
  category: z.string().optional().default("Home Decor"),
  country: z.string().default("United States"),
  state: z.string().optional(),
  city: z.string().optional(),
  buyerTypes: z.array(z.string()).default(["Wholesaler", "Showroom", "Importer"]),
  providers: z.array(z.string()).default(["google_places", "google_search", "web_enrich"]),
  resultCap: z.number().int().positive().max(100).default(20),
});

export type DiscoverySearchInput = z.infer<typeof DiscoverySearchInputSchema>;

export const RawLeadSchema = z.object({
  company: z.string().min(1),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("United States"),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  email: z.string().optional(),
  source: LeadSourceEnum.default("GOOGLE_PLACES"),
  sourceRef: z.string().optional(),
  buyerType: BuyerTypeEnum.default("UNKNOWN"),
  snippet: z.string().optional(),
});

export type RawLead = z.infer<typeof RawLeadSchema>;

// ==========================================
// AI Classification Schema (Gemini Structured)
// ==========================================

export const GeminiClassificationSchema = z.object({
  classification: z.enum(["b2b", "consumer", "unknown"]),
  buyerType: z.enum([
    "importer",
    "wholesaler",
    "retailer",
    "distributor",
    "showroom",
    "wellness_store",
    "individual",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(250),
});

export type GeminiClassificationOutput = z.infer<typeof GeminiClassificationSchema>;

// ==========================================
// Lead CRUD & Import Schemas
// ==========================================

export const CreateLeadSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  website: z.string().url("Valid website URL required").or(z.string().min(3)),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  country: z.string().default("United States"),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  source: LeadSourceEnum.default("MANUAL"),
  buyerType: BuyerTypeEnum.default("WHOLESALER"),
  notes: z.string().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  emailStatus: EmailStatusEnum.optional(),
  emailValidation: EmailValidationStatusEnum.optional(),
  emailStatusReason: z.string().optional(),
  aiClass: AIClassificationEnum.optional(),
  aiConfidence: z.number().optional(),
  aiReasoning: z.string().optional(),
  pipelineStage: z.string().optional(),
  called: z.boolean().optional(),
  callNotes: z.string().optional(),
  optedOut: z.boolean().optional(),
});

export const BulkLeadActionSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, "At least one lead must be selected"),
  action: z.enum(["validate", "classify", "delete", "export", "add_to_campaign"]),
  campaignId: z.string().optional(),
});

// ==========================================
// Outreach & Campaign Schemas
// ==========================================

export const CreateCampaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required"),
  product: z.string().min(2, "Product is required"),
  country: z.string().default("United States"),
  subject: z.string().min(3, "Subject line is required"),
  bodyTemplate: z.string().min(10, "Email body template is required"),
  attachmentId: z.string().optional(),
  leadIds: z.array(z.string()).optional(),
  sendConfig: z.object({
    dailyCap: z.number().int().min(1).max(200).default(40),
    delayMinSeconds: z.number().int().min(15).max(300).default(60),
    delayMaxSeconds: z.number().int().min(30).max(600).default(180),
    warmUpMode: z.boolean().default(true),
    skipAlreadyContacted: z.boolean().default(true),
    autoStopBounce: z.boolean().default(true),
    respectBusinessHours: z.boolean().default(true),
  }).default({}),
});

export const TestEmailSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string(),
  bodyTemplate: z.string(),
  attachmentName: z.string().optional(),
});

// ==========================================
// Settings & Credentials Schemas
// ==========================================

export const WorkspaceSettingsSchema = z.object({
  senderName: z.string().min(2),
  senderEmail: z.string().email(),
  senderAddress: z.string().min(5),
  dailyCap: z.number().int().min(1).max(200),
  minDelaySeconds: z.number().int().min(15).max(300),
  maxDelaySeconds: z.number().int().min(30).max(600),
  warmUpMode: z.boolean(),
  autoStopOnBounce: z.boolean(),
  bounceThresholdPct: z.number().min(1).max(20),
  emailSignature: z.string().optional(),
});

export const ProviderCredentialInputSchema = z.object({
  provider: z.string(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  monthlyCreditBudget: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});
