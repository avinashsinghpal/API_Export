import * as React from "react";
import { Search, Calendar, Bell, ShieldCheck } from "lucide-react";
import { SectionId } from "./sidebar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  currentSection: SectionId;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNotificationClick?: () => void;
  unreadCount?: number;
}

const SECTION_TITLES: Record<SectionId, { title: string; subtitle: string }> = {
  overview: {
    title: "Executive Overview",
    subtitle: "Real-time funnel performance and exporter pipeline KPIs",
  },
  discovery: {
    title: "Buyer Discovery Engine",
    subtitle: "Automated multi-channel search across US importers, wholesalers & retailers",
  },
  database: {
    title: "Centralized Leads Database",
    subtitle: "Unified repository with automated deduplication & contact history",
  },
  validation: {
    title: "Email Hygiene & Verification",
    subtitle: "Multi-tier syntax, MX records, disposable domain, and role detection",
  },
  classification: {
    title: "AI Buyer Classification",
    subtitle: "Powered by Gemini AI to separate commercial B2B buyers from retail consumers",
  },
  outreach: {
    title: "Gmail Outreach & Delivery",
    subtitle: "Safe personalized cold email engine with attached product presentation PDF",
  },
  reports: {
    title: "Campaigns & Performance Reports",
    subtitle: "Conversion metrics, state breakdown, and channel reply rates",
  },
  settings: {
    title: "System & Exporter Settings",
    subtitle: "Company profile, Gemini API keys, Gmail OAuth, and deduplication rules",
  },
};

export function Header({
  currentSection,
  searchQuery,
  onSearchChange,
  unreadCount = 2,
}: HeaderProps) {
  const meta = SECTION_TITLES[currentSection] || {
    title: "ExportLeads Dashboard",
    subtitle: "International B2B Buyer Engine",
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between gap-4">
      {/* Left: Section Title & Date range badge */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block truncate">
            {meta.subtitle}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground border border-border shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last 30 days</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Animated Expanding Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads, companies..."
            className="h-9 w-44 sm:w-48 focus:w-64 transition-all duration-300 rounded-lg border border-border bg-secondary pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
          />
        </div>

        {/* Live Delivery Safeguard Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-[11px] text-accent font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safeguards Active</span>
        </div>

        {/* Notification Bell with pulsing green dot */}
        <button
          className="relative w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>

        {/* Gradient Exporter Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-border">
          <div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-primary-foreground font-semibold text-xs shadow-sm ring-1 ring-border"
            title="Aura Crafts Exports (New Delhi)"
          >
            AC
          </div>
          <div className="hidden xl:flex flex-col text-left text-xs leading-tight">
            <span className="font-medium text-foreground">Aura Crafts India</span>
            <span className="text-[10px] text-muted-foreground font-mono">Verified Exporter</span>
          </div>
        </div>
      </div>
    </header>
  );
}
