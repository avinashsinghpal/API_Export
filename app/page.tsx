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
import { useReportsSummaryQuery, useIntegrationsQuery } from "@/lib/hooks/use-export-leads";
import { AlertTriangle, Key, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [currentSection, setCurrentSection] = React.useState<SectionId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  const { data: summary } = useReportsSummaryQuery();
  const { data: integrations = [] } = useIntegrationsQuery();

  const placesIntegration = integrations.find((p: any) => p.id === "google_places");
  const showMissingKeyBanner = !bannerDismissed && placesIntegration && !placesIntegration.hasKey;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        leadCount={summary?.totalLeads ?? 36}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ${sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
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
          {showMissingKeyBanner && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-warning/40 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Local Demo Mode Active — No Google Places API Key configured
                  </p>
                  <p className="text-muted-foreground">
                    Using pre-seeded US buyer directory. To discover live Google Places businesses, add your key in{" "}
                    <button
                      type="button"
                      onClick={() => setCurrentSection("settings")}
                      className="text-accent hover:underline font-semibold"
                    >
                      Settings &rarr;
                    </button>{" "}
                    or configure <code className="font-mono bg-secondary px-1 py-0.5 rounded text-[11px]">.env.local</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentSection("settings")}
                  className="h-7 text-xs gap-1.5"
                >
                  <Key className="w-3 h-3 text-accent" />
                  <span>Configure Key</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setBannerDismissed(true)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div
            key={currentSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          >
            {currentSection === "overview" && (
              <OverviewSection onSelectSection={setCurrentSection} />
            )}

            {currentSection === "discovery" && (
              <DiscoverySection />
            )}

            {currentSection === "database" && (
              <DatabaseSection />
            )}

            {currentSection === "validation" && (
              <ValidationSection />
            )}

            {currentSection === "classification" && (
              <ClassificationSection />
            )}

            {currentSection === "outreach" && (
              <OutreachSection />
            )}

            {currentSection === "reports" && (
              <ReportsSection />
            )}

            {currentSection === "settings" && (
              <SettingsSection />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
