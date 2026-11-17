"use client";

import * as React from "react";
import { Sidebar, SectionId } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { OverviewSection } from "@/components/dashboard/sections/overview-section";
import { DiscoverySection } from "@/components/dashboard/sections/discovery-section";
import { DatabaseSection } from "@/components/dashboard/sections/database-section";
import { ValidationSection } from "@/components/dashboard/sections/validation-section";
import { ClassificationSection } from "@/components/dashboard/sections/classification-section";
import { OutreachSection } from "@/components/dashboard/sections/outreach-section";
import { ReportsSection } from "@/components/dashboard/sections/reports-section";
import { SettingsSection } from "@/components/dashboard/sections/settings-section";

import {
  INITIAL_LEADS,
  INITIAL_DISCOVERY_RUNS,
  INITIAL_CAMPAIGNS,
  INITIAL_EMAIL_LOGS,
} from "@/lib/mock-data";
import { Lead, DiscoveryRun, Campaign, EmailLog } from "@/lib/types";

export default function DashboardPage() {
  // App Shell Navigation State
  const [currentSection, setCurrentSection] = React.useState<SectionId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Central Application Data Stores
  const [leads, setLeads] = React.useState<Lead[]>(INITIAL_LEADS);
  const [discoveryRuns, setDiscoveryRuns] = React.useState<DiscoveryRun[]>(INITIAL_DISCOVERY_RUNS);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [emailLogs, setEmailLogs] = React.useState<EmailLog[]>(INITIAL_EMAIL_LOGS);
  const [duplicatesBlocked, setDuplicatesBlocked] = React.useState<number>(11);

  // Lead update handler
  const handleUpdateLead = React.useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }, []);

  // Delete leads handler
  const handleDeleteLeads = React.useCallback((ids: string[]) => {
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
  }, []);

  // Add newly discovered leads handler (with deduplication tracking)
  const handleAddDiscoveredLeads = React.useCallback(
    (newLeads: Lead[], run: DiscoveryRun) => {
      setLeads((prev) => [...newLeads, ...prev]);
      setDiscoveryRuns((prev) => [run, ...prev]);
      setDuplicatesBlocked((prev) => prev + run.duplicatesBlocked);
    },
    []
  );

  // Ingest imported leads from CSV
  const handleImportLeads = React.useCallback((imported: Lead[]) => {
    setLeads((prev) => [...imported, ...prev]);
  }, []);

  // Start campaign handler
  const handleSendCampaign = React.useCallback(
    (recipients: Lead[], newLogs: EmailLog[]) => {
      const recipientIds = recipients.map((r) => r.id);
      setLeads((prev) =>
        prev.map((l) =>
          recipientIds.includes(l.id) ? { ...l, emailStatus: "sent" } : l
        )
      );

      setEmailLogs((prev) => [...newLogs, ...prev]);

      const newCampaign: Campaign = {
        id: `CAMP-${202 + campaigns.length}`,
        name: `Singing Bowls US Wholesale - Batch #${campaigns.length + 1}`,
        product: "Singing Bowls (7-Chakra & Antique)",
        country: "United States",
        sent: recipients.length,
        delivered: recipients.length,
        opened: 0,
        replied: 0,
        bounced: 0,
        status: "active",
        date: "Today",
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
    },
    [campaigns.length]
  );

  // Clear & Reset database handlers for Settings
  const handleClearDatabase = React.useCallback(() => {
    setLeads([]);
    setEmailLogs([]);
    setDiscoveryRuns([]);
  }, []);

  const handleResetDemoData = React.useCallback(() => {
    setLeads(INITIAL_LEADS);
    setDiscoveryRuns(INITIAL_DISCOVERY_RUNS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setDuplicatesBlocked(11);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        leadCount={leads.length}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        {/* Sticky Header */}
        <Header
          currentSection={currentSection}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentSection !== "database") {
              setCurrentSection("database");
            }
          }}
        />

        {/* Dynamic Section Body */}
        <main className="flex-1 p-6 space-y-6">
          <div
            key={currentSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          >
            {currentSection === "overview" && (
              <OverviewSection
                leads={leads}
                emailLogs={emailLogs}
                onSelectSection={setCurrentSection}
                duplicatesBlocked={duplicatesBlocked}
              />
            )}

            {currentSection === "discovery" && (
              <DiscoverySection
                onAddLeads={handleAddDiscoveredLeads}
                discoveryRuns={discoveryRuns}
                existingLeads={leads}
              />
            )}

            {currentSection === "database" && (
              <DatabaseSection
                leads={leads}
                onUpdateLead={handleUpdateLead}
                onDeleteLeads={handleDeleteLeads}
                onImportLeads={handleImportLeads}
                duplicatesBlocked={duplicatesBlocked}
                onNavigateToOutreach={() => setCurrentSection("outreach")}
              />
            )}

            {currentSection === "validation" && (
              <ValidationSection
                leads={leads}
                onUpdateLead={handleUpdateLead}
              />
            )}

            {currentSection === "classification" && (
              <ClassificationSection
                leads={leads}
                onUpdateLead={handleUpdateLead}
              />
            )}

            {currentSection === "outreach" && (
              <OutreachSection
                leads={leads}
                onSendCampaign={handleSendCampaign}
              />
            )}

            {currentSection === "reports" && (
              <ReportsSection
                leads={leads}
                campaigns={campaigns}
              />
            )}

            {currentSection === "settings" && (
              <SettingsSection
                onClearDatabase={handleClearDatabase}
                onResetDemoData={handleResetDemoData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
