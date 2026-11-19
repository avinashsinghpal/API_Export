"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead, DiscoveryRun, Campaign } from "@/lib/types";

// ==========================================
// Leads Query & Mutations
// ==========================================

export function useLeadsQuery(params?: { search?: string; filter?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.filter && params.filter !== "all") qs.set("filter", params.filter);
  if (params?.limit) qs.set("limit", params.limit.toString());
  if (params?.offset) qs.set("offset", params.offset.toString());

  return useQuery({
    queryKey: ["leads", params?.search, params?.filter, params?.limit, params?.offset],
    queryFn: async () => {
      const res = await fetch(`/api/leads?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json() as Promise<{
        leads: Lead[];
        total: number;
        limit: number;
        offset: number;
        duplicatesBlocked: number;
      }>;
    },
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updated: Partial<Lead> & { id: string }) => {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLead: Partial<Lead>) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

export function useDeleteLeadsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, action: "delete" }),
      });
      if (!res.ok) throw new Error("Failed to delete leads");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

export function useBulkLeadActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadIds, action }: { leadIds: string[]; action: "validate" | "classify" | "delete" }) => {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, action }),
      });
      if (!res.ok) throw new Error("Failed to execute bulk action");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

// ==========================================
// Discovery Runs Query & Mutations
// ==========================================

export function useDiscoveryRunsQuery() {
  return useQuery({
    queryKey: ["discovery-runs"],
    queryFn: async () => {
      const res = await fetch("/api/discovery/runs");
      if (!res.ok) throw new Error("Failed to fetch discovery runs");
      const data = await res.json();
      return data.runs as DiscoveryRun[];
    },
  });
}

export function useRunDiscoveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      product: string;
      category?: string;
      country?: string;
      state?: string;
      city?: string;
      buyerTypes?: string[];
      providers?: string[];
      resultCap?: number;
    }) => {
      const res = await fetch("/api/discovery/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery run failed");
      return data as { run: DiscoveryRun; leads: Lead[]; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-runs"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

// ==========================================
// Hygiene & Classification Mutations
// ==========================================

export function useValidateEmailsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadIds?: string[]) => {
      const res = await fetch("/api/leads/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      if (!res.ok) throw new Error("Failed to validate emails");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

export function useClassifyLeadsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadIds, threshold }: { leadIds?: string[]; threshold?: number }) => {
      const res = await fetch("/api/leads/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, threshold }),
      });
      if (!res.ok) throw new Error("Failed to classify leads");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

// ==========================================
// Campaigns Query & Mutations
// ==========================================

export function useCampaignsQuery() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      return data.campaigns as Campaign[];
    },
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      product: string;
      country?: string;
      subject: string;
      bodyTemplate: string;
      leadIds?: string[];
      sendConfig?: Record<string, any>;
    }) => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start campaign");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    },
  });
}

// ==========================================
// Reports Summary
// ==========================================

export function useReportsSummaryQuery() {
  return useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => {
      const res = await fetch("/api/reports/summary");
      if (!res.ok) throw new Error("Failed to fetch reports summary");
      return res.json() as Promise<{
        totalLeads: number;
        validEmails: number;
        invalidEmails: number;
        validB2B: number;
        consumerCount: number;
        sent: number;
        delivered: number;
        opened: number;
        replied: number;
        bounced: number;
        replyRate: number;
        openRate: number;
        bounceRate: number;
        duplicatesBlocked: number;
      }>;
    },
  });
}

// ==========================================
// Settings & Integrations
// ==========================================

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      return data.settings;
    },
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useIntegrationsQuery() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      const data = await res.json();
      return data.providers;
    },
  });
}
