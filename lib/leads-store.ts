import { normalizeDomain, normalizeEmail, normalizePhone, normalizeCompanyName } from "./normalizer";
import { isFuzzyDuplicate } from "./dedupe";
import { prisma } from "./db";

export interface StoredLead {
  id: string;
  workspaceId: string;
  company: string;
  domain: string;
  website: string;
  contactName: string;
  contactTitle?: string;
  email: string;
  emailLower: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  source: string;
  sourceRef?: string;
  buyerType: string;
  emailValid: boolean | null;
  emailValidationReason?: string;
  aiClass: "b2b" | "consumer" | null;
  aiConfidence: number;
  aiReasoning?: string;
  emailStatus: "not_sent" | "sent" | "opened" | "replied" | "bounced" | "queued" | "failed" | "skipped";
  pipelineStage: string;
  optedOut: boolean;
  called: boolean;
  callNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface StoredDiscoveryRun {
  id: string;
  workspaceId: string;
  product: string;
  category: string;
  country: string;
  state?: string;
  city?: string;
  sources: string[];
  leadsFound: number;
  duplicatesBlocked: number;
  invalidCount: number;
  b2bCount: number;
  costCredits: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  date: string;
}

export interface StoredCampaign {
  id: string;
  workspaceId: string;
  name: string;
  product: string;
  country: string;
  subject: string;
  bodyTemplate: string;
  attachmentId?: string;
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  bounced: number;
  status: "active" | "draft" | "paused" | "completed";
  date: string;
}

export interface StoredSuppression {
  id: string;
  workspaceId: string;
  emailLower: string;
  domain?: string;
  reason: "unsubscribed" | "bounced" | "complained" | "manual";
  createdAt: string;
}

export interface StoredActivityLog {
  id: string;
  workspaceId: string;
  leadId?: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface WorkspaceSettings {
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  dailyCap: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  warmUpMode: boolean;
  autoStopOnBounce: boolean;
  bounceThresholdPct: number;
  emailSignature: string;
}

// In-memory persistent state (shared across API route requests in memory)
class LeadsDataStore {
  private leads: Map<string, StoredLead> = new Map();
  private runs: Map<string, StoredDiscoveryRun> = new Map();
  private campaigns: Map<string, StoredCampaign> = new Map();
  private suppressions: Map<string, StoredSuppression> = new Map();
  private credentials: Map<string, { apiKey?: string; apiSecret?: string; isActive: boolean; budget: number }> = new Map();
  private activityLogs: StoredActivityLog[] = [];
  private settings: WorkspaceSettings = {
    senderName: "Avinash Singh | Aura Crafts Exports",
    senderEmail: "exportleads.demo@gmail.com",
    senderAddress: "Plot 42, Export Promotion Zone, Moradabad, UP, India - 244001",
    dailyCap: 40,
    minDelaySeconds: 60,
    maxDelaySeconds: 180,
    warmUpMode: true,
    autoStopOnBounce: true,
    bounceThresholdPct: 5.0,
    emailSignature: `Avinash Singh\nHead of Global Trade | Aura Crafts Exports, India\nDirect / WhatsApp: +91 98110 23456\nWeb: https://auracraftsexports.com\nSpecialized in Handcrafted 7-Chakra Singing Bowls & Artisan Metal Decor`,
  };

  private duplicatesBlockedCounter = 0;

  constructor() {
    this.syncFromPrisma();
  }

  private async syncFromPrisma() {
    try {
      const dbLeads = await prisma.lead.findMany();
      if (dbLeads && dbLeads.length > 0) {
        dbLeads.forEach((l) => {
          this.leads.set(l.id, {
            id: l.id,
            workspaceId: "ws_demo_auracrafts",
            company: l.company,
            domain: l.domain || "",
            website: l.website || "",
            contactName: l.contactName || "",
            contactTitle: l.contactTitle || undefined,
            email: l.email || "",
            emailLower: l.emailLower || l.email?.toLowerCase() || "",
            phone: l.phone || "",
            country: l.country,
            state: l.state || "",
            city: l.city || "",
            address: l.address || undefined,
            source: l.source,
            sourceRef: l.sourceRef || undefined,
            buyerType: l.buyerType,
            emailValid: l.emailValid,
            emailValidationReason: l.emailValidationReason || undefined,
            aiClass: (l.aiClass as any) || null,
            aiConfidence: l.aiConfidence,
            aiReasoning: l.aiReasoning || undefined,
            emailStatus: (l.emailStatus as any) || "not_sent",
            pipelineStage: l.pipelineStage,
            optedOut: l.optedOut,
            called: l.called,
            callNotes: l.callNotes || undefined,
            notes: l.notes || undefined,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
            isDeleted: false,
          });
        });
      }

      const dbRuns = await prisma.discoveryRun.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (dbRuns && dbRuns.length > 0) {
        dbRuns.forEach((r) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(r.params || "{}");
          } catch {}
          this.runs.set(r.id, {
            id: r.id,
            workspaceId: "ws_demo_auracrafts",
            product: parsed.product || "Singing Bowls",
            category: parsed.category || "Home Decor",
            country: parsed.country || "United States",
            state: parsed.state,
            city: parsed.city,
            sources: parsed.sources || ["Google Places (New)"],
            leadsFound: r.foundCount,
            duplicatesBlocked: r.duplicatesCount,
            invalidCount: 0,
            b2bCount: r.foundCount,
            costCredits: 0,
            status: (r.status.toLowerCase() as any) || "completed",
            startedAt: r.startedAt.toISOString(),
            finishedAt: r.finishedAt?.toISOString(),
            date: r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          });
        });
      }
    } catch (err) {
      // Prisma syncing handled gracefully in case DB is being migrated
    }
  }

  // Leads queries
  public listLeads(workspaceId: string, options?: {
    search?: string;
    filter?: string;
    stage?: string;
    limit?: number;
    offset?: number;
  }) {
    let list = Array.from(this.leads.values()).filter(
      (l) => l.workspaceId === workspaceId && !l.isDeleted
    );

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.company.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q)
      );
    }

    if (options?.filter) {
      const f = options.filter;
      if (f === "new") list = list.filter((l) => l.emailStatus === "not_sent");
      else if (f === "b2b") list = list.filter((l) => l.aiClass === "b2b");
      else if (f === "consumer") list = list.filter((l) => l.aiClass === "consumer");
      else if (f === "valid_email") list = list.filter((l) => l.emailValid === true);
      else if (f === "invalid_email") list = list.filter((l) => l.emailValid === false);
      else if (f === "contacted") list = list.filter((l) => l.emailStatus !== "not_sent");
      else if (f === "replied") list = list.filter((l) => l.emailStatus === "replied");
      else if (f === "called") list = list.filter((l) => l.called);
    }

    const total = list.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return {
      leads: list.slice(offset, offset + limit),
      total,
      limit,
      offset,
    };
  }

  public getLead(id: string, workspaceId: string): StoredLead | undefined {
    const lead = this.leads.get(id);
    if (lead && lead.workspaceId === workspaceId && !lead.isDeleted) {
      return lead;
    }
    return undefined;
  }

  public findDuplicate(workspaceId: string, email: string, domain?: string): StoredLead | undefined {
    const normEmail = normalizeEmail(email);
    const normDomain = domain ? normalizeDomain(domain) : "";

    for (const lead of this.leads.values()) {
      if (lead.workspaceId !== workspaceId || lead.isDeleted) continue;
      if (lead.emailLower === normEmail) return lead;
      if (normDomain && lead.domain === normDomain) return lead;
    }
    return undefined;
  }

  public createLead(workspaceId: string, lead: Partial<StoredLead>): { lead?: StoredLead; duplicate?: boolean; reason?: string } {
    const emailLower = normalizeEmail(lead.email || "");
    const domain = normalizeDomain(lead.website || "");

    const existing = this.findDuplicate(workspaceId, emailLower, domain);
    if (existing) {
      this.duplicatesBlockedCounter++;
      return { duplicate: true, reason: `Duplicate detected: matches existing company '${existing.company}'` };
    }

    const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newLead: StoredLead = {
      id,
      workspaceId,
      company: normalizeCompanyName(lead.company || "Unnamed Company"),
      domain,
      website: lead.website || `https://${domain}`,
      contactName: lead.contactName || "Purchasing Manager",
      contactTitle: lead.contactTitle || "Buyer",
      email: lead.email || "",
      emailLower,
      phone: normalizePhone(lead.phone || ""),
      country: lead.country || "United States",
      state: lead.state || "Texas",
      city: lead.city || "Austin",
      address: lead.address || "",
      source: lead.source || "MANUAL",
      buyerType: lead.buyerType || "WHOLESALER",
      emailValid: lead.emailValid ?? null,
      emailValidationReason: lead.emailValidationReason,
      aiClass: lead.aiClass ?? null,
      aiConfidence: lead.aiConfidence ?? 0,
      aiReasoning: lead.aiReasoning,
      emailStatus: lead.emailStatus || "not_sent",
      pipelineStage: lead.pipelineStage || "discovered",
      optedOut: false,
      called: lead.called || false,
      callNotes: lead.callNotes || "",
      notes: lead.notes || "",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    this.leads.set(id, newLead);
    this.addActivityLog(workspaceId, "lead_created", id, { company: newLead.company });

    // Persist to SQLite
    prisma.lead.upsert({
      where: { emailLower: newLead.emailLower || id },
      update: {
        company: newLead.company,
        domain: newLead.domain,
        website: newLead.website,
        contactName: newLead.contactName,
        email: newLead.email,
        phone: newLead.phone,
        state: newLead.state,
        city: newLead.city,
        source: newLead.source,
        buyerType: newLead.buyerType,
        emailValid: newLead.emailValid,
        emailValidationReason: newLead.emailValidationReason,
        aiClass: newLead.aiClass,
        aiConfidence: newLead.aiConfidence,
        aiReasoning: newLead.aiReasoning,
        emailStatus: newLead.emailStatus,
        called: newLead.called,
        callNotes: newLead.callNotes,
      },
      create: {
        id: newLead.id,
        company: newLead.company,
        domain: newLead.domain,
        website: newLead.website,
        contactName: newLead.contactName,
        email: newLead.email,
        emailLower: newLead.emailLower || newLead.id,
        phone: newLead.phone,
        state: newLead.state,
        city: newLead.city,
        country: newLead.country,
        source: newLead.source,
        buyerType: newLead.buyerType,
        emailValid: newLead.emailValid,
        emailValidationReason: newLead.emailValidationReason,
        aiClass: newLead.aiClass,
        aiConfidence: newLead.aiConfidence,
        aiReasoning: newLead.aiReasoning,
        emailStatus: newLead.emailStatus,
        called: newLead.called,
        callNotes: newLead.callNotes,
      },
    }).catch(() => {});

    return { lead: newLead };
  }

  public updateLead(id: string, workspaceId: string, updates: Partial<StoredLead>): StoredLead | undefined {
    const existing = this.getLead(id, workspaceId);
    if (!existing) return undefined;

    const updated: StoredLead = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(id, updated);
    this.addActivityLog(workspaceId, "lead_updated", id, updates);

    // Persist to SQLite
    prisma.lead.update({
      where: { id },
      data: {
        company: updated.company,
        website: updated.website,
        domain: updated.domain,
        contactName: updated.contactName,
        email: updated.email,
        phone: updated.phone,
        city: updated.city,
        state: updated.state,
        buyerType: updated.buyerType,
        emailStatus: updated.emailStatus,
        emailValid: updated.emailValid,
        emailValidationReason: updated.emailValidationReason,
        aiClass: updated.aiClass,
        aiConfidence: updated.aiConfidence,
        aiReasoning: updated.aiReasoning,
        called: updated.called,
        callNotes: updated.callNotes,
      },
    }).catch(() => {});

    return updated;
  }

  public deleteLeads(ids: string[], workspaceId: string): number {
    let deletedCount = 0;
    ids.forEach((id) => {
      const lead = this.getLead(id, workspaceId);
      if (lead) {
        lead.isDeleted = true;
        this.leads.set(id, lead);
        deletedCount++;
        this.addActivityLog(workspaceId, "lead_deleted", id);
      }
    });

    // Delete in SQLite
    prisma.lead.deleteMany({
      where: { id: { in: ids } },
    }).catch(() => {});

    return deletedCount;
  }

  // Discovery runs
  public listDiscoveryRuns(workspaceId: string): StoredDiscoveryRun[] {
    return Array.from(this.runs.values())
      .filter((r) => r.workspaceId === workspaceId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  public createDiscoveryRun(workspaceId: string, run: Partial<StoredDiscoveryRun>): StoredDiscoveryRun {
    const id = run.id || `RUN-${1050 + this.runs.size}`;
    const newRun: StoredDiscoveryRun = {
      id,
      workspaceId,
      product: run.product || "Singing Bowls",
      category: run.category || "Home Decor",
      country: run.country || "United States",
      state: run.state,
      city: run.city,
      sources: run.sources || ["Google Places", "Web Crawler"],
      leadsFound: run.leadsFound || 0,
      duplicatesBlocked: run.duplicatesBlocked || 0,
      invalidCount: run.invalidCount || 0,
      b2bCount: run.b2bCount || 0,
      costCredits: run.costCredits || 0,
      status: run.status || "completed",
      startedAt: run.startedAt || new Date().toISOString(),
      finishedAt: run.finishedAt || new Date().toISOString(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    this.runs.set(id, newRun);

    // Save to SQLite
    prisma.discoveryRun.upsert({
      where: { id },
      update: {
        status: newRun.status.toUpperCase(),
        foundCount: newRun.leadsFound,
        duplicatesCount: newRun.duplicatesBlocked,
      },
      create: {
        id,
        params: JSON.stringify({
          product: newRun.product,
          category: newRun.category,
          country: newRun.country,
          state: newRun.state,
          city: newRun.city,
          sources: newRun.sources,
        }),
        status: newRun.status.toUpperCase(),
        foundCount: newRun.leadsFound,
        duplicatesCount: newRun.duplicatesBlocked,
        startedAt: new Date(newRun.startedAt || Date.now()),
      },
    }).catch(() => {});

    return newRun;
  }

  public getDiscoveryRun(id: string): StoredDiscoveryRun | undefined {
    return this.runs.get(id);
  }

  public async addRunLog(runId: string, level: string, message: string) {
    try {
      await prisma.runLog.create({
        data: {
          runId,
          level,
          message,
        },
      });
    } catch {
      // Fallback
    }
  }

  // Campaigns
  public listCampaigns(workspaceId: string): StoredCampaign[] {
    return Array.from(this.campaigns.values())
      .filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  public createCampaign(workspaceId: string, camp: Partial<StoredCampaign>): StoredCampaign {
    const id = camp.id || `CAMP-${200 + this.campaigns.size + 1}`;
    const newCamp: StoredCampaign = {
      id,
      workspaceId,
      name: camp.name || "US Wholesale Outreach",
      product: camp.product || "Singing Bowls",
      country: camp.country || "United States",
      subject: camp.subject || "Wholesale Inquiry",
      bodyTemplate: camp.bodyTemplate || "",
      attachmentId: camp.attachmentId,
      sent: camp.sent || 0,
      delivered: camp.delivered || 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      status: camp.status || "active",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    this.campaigns.set(id, newCamp);
    return newCamp;
  }

  // Suppressions
  public isSuppressed(workspaceId: string, email: string): boolean {
    const norm = normalizeEmail(email);
    for (const supp of this.suppressions.values()) {
      if (supp.workspaceId === workspaceId && supp.emailLower === norm) {
        return true;
      }
    }
    return false;
  }

  public addSuppression(workspaceId: string, email: string, reason: StoredSuppression["reason"]): void {
    const norm = normalizeEmail(email);
    const id = `supp-${Date.now()}`;
    this.suppressions.set(id, {
      id,
      workspaceId,
      emailLower: norm,
      reason,
      createdAt: new Date().toISOString(),
    });

    // Mark existing lead as optedOut
    for (const lead of this.leads.values()) {
      if (lead.workspaceId === workspaceId && lead.emailLower === norm) {
        lead.optedOut = true;
        this.leads.set(lead.id, lead);
      }
    }
  }

  // Activity logs
  public addActivityLog(workspaceId: string, action: string, leadId?: string, details?: Record<string, any>): void {
    this.activityLogs.unshift({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      workspaceId,
      leadId,
      action,
      details,
      createdAt: new Date().toISOString(),
    });
    if (this.activityLogs.length > 200) {
      this.activityLogs.pop();
    }
  }

  public listActivityLogs(workspaceId: string, limit = 20): StoredActivityLog[] {
    return this.activityLogs.filter((a) => a.workspaceId === workspaceId).slice(0, limit);
  }

  // Settings & Credentials
  public getSettings(): WorkspaceSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<WorkspaceSettings>): WorkspaceSettings {
    this.settings = { ...this.settings, ...updates };
    return this.getSettings();
  }

  public getCredential(provider: string) {
    return this.credentials.get(provider);
  }

  public saveCredential(provider: string, data: { apiKey?: string; apiSecret?: string; isActive?: boolean; budget?: number }) {
    const existing = this.credentials.get(provider) || { isActive: true, budget: 100 };
    this.credentials.set(provider, {
      ...existing,
      ...data,
      isActive: data.isActive ?? existing.isActive,
      budget: data.budget ?? existing.budget,
    });
  }

  public getDuplicatesBlockedCount(): number {
    return this.duplicatesBlockedCounter;
  }

  public resetStore() {
    this.leads.clear();
    this.runs.clear();
    this.activityLogs = [];
    this.duplicatesBlockedCounter = 0;
    this.syncFromPrisma();
  }
}

// Singleton global instance
export const leadsStore = new LeadsDataStore();
