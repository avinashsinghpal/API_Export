import * as React from "react";
import {
  LayoutDashboard,
  Search,
  Database,
  CheckCircle2,
  Sparkles,
  Send,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionId =
  | "overview"
  | "discovery"
  | "database"
  | "validation"
  | "classification"
  | "outreach"
  | "reports"
  | "settings";

interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  leadCount?: number;
}

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "discovery", label: "Buyer Discovery", icon: Search },
  { id: "database", label: "Leads Database", icon: Database },
  { id: "validation", label: "Email Validation", icon: CheckCircle2 },
  { id: "classification", label: "AI Classification", icon: Sparkles, badge: "Gemini" },
  { id: "outreach", label: "Outreach & Gmail", icon: Send },
  { id: "reports", label: "Campaigns & Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  leadCount,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col select-none",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Top Brand Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3 overflow-hidden shrink-0">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-md">
          <Globe2 className="w-5 h-5 text-black stroke-[2.2]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 transition-opacity duration-300">
            <span className="font-semibold text-lg tracking-tight text-foreground truncate">
              ExportLeads
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-wider -mt-1 uppercase">
              India → USA Exporter
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={cn(
                "group relative flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none cursor-pointer",
                isActive
                  ? "bg-sidebar-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-accent" />
              )}

              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                )}
              />

              {!collapsed && (
                <div className="ml-3 flex-1 flex items-center justify-between truncate text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/15 text-accent font-medium uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                  {item.id === "database" && leadCount !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-secondary font-mono text-muted-foreground">
                      {leadCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Exporter Info & Collapse Button */}
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded-lg bg-card border border-border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Demo Scenario:</span>
              <span className="font-mono text-accent text-[11px] font-semibold">Active</span>
            </div>
            <p className="font-medium text-foreground truncate">Singing Bowls (Home Decor)</p>
            <p className="text-[11px] text-muted-foreground">Origin: India → Dest: US</p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full h-9 rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer gap-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
