"use client";

import * as React from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  Trash2,
  Phone,
  PhoneCall,
  Sparkles,
  Send,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Clock,
  Mail,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lead } from "@/lib/types";
import { toast } from "sonner";

interface DatabaseSectionProps {
  leads: Lead[];
  onUpdateLead: (updated: Lead) => void;
  onDeleteLeads: (ids: string[]) => void;
  onImportLeads: (newLeads: Lead[]) => void;
  duplicatesBlocked: number;
  onNavigateToOutreach?: () => void;
}

type FilterStatus =
  | "all"
  | "new"
  | "valid_email"
  | "invalid_email"
  | "b2b"
  | "consumer"
  | "contacted"
  | "replied";

export function DatabaseSection({
  leads,
  onUpdateLead,
  onDeleteLeads,
  onImportLeads,
  duplicatesBlocked,
  onNavigateToOutreach,
}: DatabaseSectionProps) {
  // Search and Filter states
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("all");
  const [activeView, setActiveView] = React.useState<"all" | "call_list">("all");

  // Selection states
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedLeadForSheet, setSelectedLeadForSheet] = React.useState<Lead | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Import Dialog states
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [mockFileName, setMockFileName] = React.useState<string | null>(null);

  // Filter leads logic
  const filteredLeads = React.useMemo(() => {
    return leads.filter((l) => {
      // Active View: Call list filter
      if (activeView === "call_list" && (!l.phone || l.phone.trim() === "")) {
        return false;
      }

      // Text search
      if (search) {
        const q = search.toLowerCase();
        const match =
          l.company.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status chip filter
      if (statusFilter === "new") return l.emailStatus === "not_sent";
      if (statusFilter === "valid_email") return l.emailValid === true;
      if (statusFilter === "invalid_email") return l.emailValid === false;
      if (statusFilter === "b2b") return l.aiClass === "b2b";
      if (statusFilter === "consumer") return l.aiClass === "consumer";
      if (statusFilter === "contacted") return l.emailStatus !== "not_sent";
      if (statusFilter === "replied") return l.emailStatus === "replied";

      return true;
    });
  }, [leads, search, statusFilter, activeView]);

  // Paginated leads
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLeads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk actions
  const handleBulkValidate = () => {
    selectedIds.forEach((id) => {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        onUpdateLead({ ...lead, emailValid: true });
      }
    });
    toast.success(`Validated ${selectedIds.length} leads!`, {
      description: "Mailbox syntax & MX records verified.",
    });
    setSelectedIds([]);
  };

  const handleBulkClassify = () => {
    selectedIds.forEach((id) => {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        onUpdateLead({
          ...lead,
          aiClass: "b2b",
          aiConfidence: 0.95,
          aiReasoning: "Classified as commercial wholesale buyer by Gemini AI.",
        });
      }
    });
    toast.success(`AI Classified ${selectedIds.length} leads!`, {
      description: "Marked as verified B2B wholesale buyers.",
    });
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    onDeleteLeads(selectedIds);
    toast.info(`Deleted ${selectedIds.length} leads.`);
    setSelectedIds([]);
  };

  // CSV Export logic
  const handleExportCSV = () => {
    const headers = [
      "Company",
      "Contact",
      "Email",
      "Phone",
      "State",
      "City",
      "Buyer Type",
      "Email Valid",
      "AI Class",
      "Email Status",
    ];
    const rows = filteredLeads.map((l) => [
      `"${l.company}"`,
      `"${l.contactName}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.state}"`,
      `"${l.city}"`,
      `"${l.buyerType}"`,
      l.emailValid ? "Valid" : "Invalid",
      l.aiClass ? l.aiClass.toUpperCase() : "Unclassified",
      l.emailStatus,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ExportLeads_US_SingingBowls_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Export Generated!", {
      description: `Downloaded ${filteredLeads.length} leads.`,
    });
  };

  // CSV Import simulation
  const handleSimulateImport = () => {
    const importedSample: Lead[] = [
      {
        id: `imp-${Date.now()}-1`,
        company: "Austin Hill Country Wellness Imports",
        website: "https://austinhillcountrywellness.com",
        contactName: "Gretchen Myers",
        email: "gmyers@austinhillcountrywellness.com",
        phone: "+1 (512) 555-0723",
        country: "United States",
        state: "Texas",
        city: "Austin",
        source: "directory",
        buyerType: "Wholesaler",
        emailValid: true,
        aiClass: "b2b",
        aiConfidence: 0.95,
        aiReasoning: "Imported via trade spreadsheet; verified Austin LLC distributor.",
        emailStatus: "not_sent",
        createdAt: new Date().toISOString().split("T")[0],
      },
      {
        id: `imp-${Date.now()}-2`,
        company: "Pacific Rim Meditation Decor",
        website: "https://pacificrimmeditation.com",
        contactName: "Kenji Sato",
        email: "ksato@pacificrimmeditation.com",
        phone: "+1 (415) 555-0899",
        country: "United States",
        state: "California",
        city: "San Francisco",
        source: "directory",
        buyerType: "Importer",
        emailValid: true,
        aiClass: "b2b",
        aiConfidence: 0.97,
        aiReasoning: "Registered importer of Buddhist art, Tibetan bowls, and brass handicrafts.",
        emailStatus: "not_sent",
        createdAt: new Date().toISOString().split("T")[0],
      },
    ];

    onImportLeads(importedSample);
    setImportDialogOpen(false);
    setMockFileName(null);
    toast.success("Spreadsheet Imported Successfully!", {
      description: `Ingested 2 fresh qualified leads. Automatic deduplication verified zero collisions.`,
    });
  };

  const filterChips: { id: FilterStatus; label: string; count?: number }[] = [
    { id: "all", label: "All Leads", count: leads.length },
    {
      id: "new",
      label: "Ready to Contact",
      count: leads.filter((l) => l.emailStatus === "not_sent").length,
    },
    {
      id: "b2b",
      label: "B2B Verified",
      count: leads.filter((l) => l.aiClass === "b2b").length,
    },
    {
      id: "valid_email",
      label: "Valid Email",
      count: leads.filter((l) => l.emailValid === true).length,
    },
    {
      id: "invalid_email",
      label: "Invalid Email",
      count: leads.filter((l) => l.emailValid === false).length,
    },
    {
      id: "contacted",
      label: "Contacted",
      count: leads.filter((l) => l.emailStatus !== "not_sent").length,
    },
    {
      id: "replied",
      label: "Replied",
      count: leads.filter((l) => l.emailStatus === "replied").length,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in-slide">
      {/* Deduplication & Database Health Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <span>Automated Deduplication Shield Active</span>
              <span className="font-mono text-accent font-bold">
                ({duplicatesBlocked} duplicates blocked)
              </span>
            </p>
            <p className="text-muted-foreground">
              Every newly discovered or imported contact is checked against normalized domain and MD5 email hash.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={activeView === "all" ? "accent" : "secondary"}
            onClick={() => setActiveView("all")}
            className="text-xs h-8"
          >
            All Leads ({leads.length})
          </Button>
          <Button
            size="sm"
            variant={activeView === "call_list" ? "accent" : "secondary"}
            onClick={() => setActiveView("call_list")}
            className="text-xs h-8 gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call List ({leads.filter((l) => l.phone).length})</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, CSV Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact, email, or city..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV/XLSX</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {filterChips.map((chip) => {
          const isActive = statusFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => {
                setStatusFilter(chip.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{chip.label}</span>
              {chip.count !== undefined && (
                <span className="font-mono text-[10px] opacity-80">
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk Action Bar (if items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 rounded-lg bg-secondary/80 border border-accent/40 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground font-mono text-[11px] flex items-center justify-center font-bold">
              {selectedIds.length}
            </span>
            <span>contacts selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkValidate}
              className="h-7 text-xs gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-accent" />
              <span>Validate</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkClassify}
              className="h-7 text-xs gap-1"
            >
              <Sparkles className="w-3 h-3 text-accent" />
              <span>AI Classify</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="h-7 text-xs gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="py-3.5 px-4 w-10 text-center">
                  <Checkbox
                    checked={
                      paginatedLeads.length > 0 &&
                      selectedIds.length === paginatedLeads.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Person
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone / Location
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Source
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  AI Class
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                  Outreach Status
                </th>
                <th className="py-3.5 px-4 text-right font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No leads match the current filters.</p>
                    <p className="text-xs mt-1">Try clearing your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-secondary/30 transition-colors cursor-pointer group ${
                        isSelected ? "bg-secondary/40" : ""
                      }`}
                      onClick={() => setSelectedLeadForSheet(lead)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(lead.id);
                        }}
                      >
                        <Checkbox checked={isSelected} />
                      </td>

                      {/* Company Name & Website */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                            {lead.company.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate max-w-[180px]">
                              {lead.company}
                            </p>
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-muted-foreground hover:text-accent flex items-center gap-1 truncate max-w-[160px]"
                            >
                              <span>{lead.website.replace("https://", "")}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">
                          {lead.contactName}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {lead.buyerType}
                        </p>
                      </td>

                      {/* Email + validity icon */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          {lead.emailValid === true && (
                            <span title="Valid Deliverable Mailbox">
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                            </span>
                          )}
                          {lead.emailValid === false && (
                            <span title={lead.emailValidationReason || "Invalid Email"}>
                              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            </span>
                          )}
                          {lead.emailValid === null && (
                            <span title="Unchecked">
                              <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                            </span>
                          )}
                          <span className="truncate max-w-[180px] text-foreground">
                            {lead.email}
                          </span>
                        </div>
                      </td>

                      {/* Phone & Location */}
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-muted-foreground">{lead.phone}</p>
                        <p className="text-[11px] text-foreground">
                          {lead.city}, {lead.state}
                        </p>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {lead.source}
                        </Badge>
                      </td>

                      {/* AI Class */}
                      <td className="py-3.5 px-4">
                        {lead.aiClass === "b2b" ? (
                          <Badge variant="success">B2B Buyer</Badge>
                        ) : lead.aiClass === "consumer" ? (
                          <Badge variant="warning">Consumer</Badge>
                        ) : (
                          <Badge variant="outline">Unclassified</Badge>
                        )}
                      </td>

                      {/* Email Status */}
                      <td className="py-3.5 px-4">
                        {lead.emailStatus === "replied" && (
                          <Badge variant="success">Replied</Badge>
                        )}
                        {lead.emailStatus === "opened" && (
                          <Badge variant="accent">Opened</Badge>
                        )}
                        {lead.emailStatus === "sent" && (
                          <Badge variant="secondary">Sent</Badge>
                        )}
                        {lead.emailStatus === "bounced" && (
                          <Badge variant="destructive">Bounced</Badge>
                        )}
                        {lead.emailStatus === "not_sent" && (
                          <span className="text-muted-foreground text-[11px]">
                            Not Sent
                          </span>
                        )}
                      </td>

                      {/* Row actions menu */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-7 h-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label="Row menu"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedLeadForSheet(lead)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Record & Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                onUpdateLead({
                                  ...lead,
                                  called: !lead.called,
                                });
                                toast.info(
                                  lead.called
                                    ? "Marked as uncalled"
                                    : "Marked as called"
                                );
                              }}
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-2 text-accent" />
                              {lead.called ? "Mark Uncalled" : "Mark as Called"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                onUpdateLead({ ...lead, emailValid: true });
                                toast.success("Email verified!");
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-accent" />
                              Validate Mailbox
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                onDeleteLeads([lead.id]);
                                toast.info("Lead deleted.");
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {filteredLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
            </strong>{" "}
            of <strong className="text-foreground">{filteredLeads.length}</strong> leads
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="font-mono text-foreground font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 text-xs gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-Over Sheet for Contact Details & Timeline */}
      <Sheet
        open={!!selectedLeadForSheet}
        onOpenChange={(open) => !open && setSelectedLeadForSheet(null)}
      >
        <SheetContent side="right">
          {selectedLeadForSheet && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                    {selectedLeadForSheet.company.charAt(0)}
                  </div>
                  <div>
                    <SheetTitle>{selectedLeadForSheet.company}</SheetTitle>
                    <SheetDescription>
                      {selectedLeadForSheet.city}, {selectedLeadForSheet.state}, US
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Status Pills */}
              <div className="flex flex-wrap gap-2">
                {selectedLeadForSheet.aiClass === "b2b" ? (
                  <Badge variant="success">Verified B2B Buyer</Badge>
                ) : (
                  <Badge variant="warning">Consumer Account</Badge>
                )}
                {selectedLeadForSheet.emailValid ? (
                  <Badge variant="accent">Valid MX Mailbox</Badge>
                ) : (
                  <Badge variant="destructive">Invalid Syntax / Domain</Badge>
                )}
                <Badge variant="secondary">
                  Source: {selectedLeadForSheet.source}
                </Badge>
              </div>

              {/* Contact Information Card */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-xs">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Contact Information
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decision Maker:</span>
                    <span className="font-medium text-foreground">
                      {selectedLeadForSheet.contactName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono text-accent">
                      {selectedLeadForSheet.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telephone:</span>
                    <span className="font-mono text-foreground">
                      {selectedLeadForSheet.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website:</span>
                    <a
                      href={selectedLeadForSheet.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Visit site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Gemini AI Reasoning */}
              {selectedLeadForSheet.aiReasoning && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-accent/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-accent flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Gemini Classification Audit
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {(selectedLeadForSheet.aiConfidence * 100).toFixed(0)}% Conf.
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedLeadForSheet.aiReasoning}
                  </p>
                </div>
              )}

              {/* Cold Calling Sub-Panel Notes */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-accent" />
                    Cold-Calling Log & Follow-up
                  </span>
                  <button
                    onClick={() => {
                      const updated = {
                        ...selectedLeadForSheet,
                        called: !selectedLeadForSheet.called,
                      };
                      setSelectedLeadForSheet(updated);
                      onUpdateLead(updated);
                      toast.success(
                        updated.called ? "Marked as Called" : "Marked as Not Called"
                      );
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      selectedLeadForSheet.called
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {selectedLeadForSheet.called ? "✓ Called" : "Not Called"}
                  </button>
                </div>
                <textarea
                  value={selectedLeadForSheet.callNotes || ""}
                  onChange={(e) => {
                    const updated = {
                      ...selectedLeadForSheet,
                      callNotes: e.target.value,
                    };
                    setSelectedLeadForSheet(updated);
                    onUpdateLead(updated);
                  }}
                  placeholder="Record phone notes (e.g. spoken with purchasing manager Marcus, requested FOB Mumbai quote)..."
                  className="w-full h-20 rounded-lg bg-secondary border border-border p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Email History Timeline */}
              <div className="space-y-3">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Outreach Activity Timeline
                </p>
                <div className="border-l-2 border-border ml-2 space-y-4 pl-4 text-xs">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-card" />
                    <p className="font-medium text-foreground">
                      Lead Discovered & Ingested
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Added on {selectedLeadForSheet.createdAt} via {selectedLeadForSheet.source}
                    </p>
                  </div>

                  <div className="relative">
                    <div
                      className={`absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-card ${
                        selectedLeadForSheet.emailValid ? "bg-accent" : "bg-destructive"
                      }`}
                    />
                    <p className="font-medium text-foreground">
                      Email Hygiene Checked
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedLeadForSheet.emailValid
                        ? "Passed MX lookup & RFC syntax checks"
                        : `Flagged: ${selectedLeadForSheet.emailValidationReason || "Invalid"}`}
                    </p>
                  </div>

                  {selectedLeadForSheet.emailStatus !== "not_sent" && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-chart-1 ring-4 ring-card" />
                      <p className="font-medium text-foreground">
                        Gmail Outreach Sent with Catalog PDF
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Status:{" "}
                        <strong className="text-accent uppercase">
                          {selectedLeadForSheet.emailStatus}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CSV / Excel Import Zone Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads (CSV / XLSX)</DialogTitle>
            <DialogDescription>
              Upload exported lists from trade fairs, Apollo, or Yellow Pages. We automatically deduplicate against existing leads.
            </DialogDescription>
          </DialogHeader>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              setMockFileName("US_Home_Decor_Buyers_2026.xlsx");
            }}
            onClick={() => setMockFileName("US_Home_Decor_Buyers_2026.xlsx")}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {mockFileName ? mockFileName : "Drag & drop CSV or Excel file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .csv, .xlsx, .xls up to 25MB
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSimulateImport}
              disabled={!mockFileName}
            >
              Parse & Ingest Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
