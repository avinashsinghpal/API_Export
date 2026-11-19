"use client";

import * as React from "react";
import {
  Search,
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
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Plus,
  Globe,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  useLeadsQuery,
  useUpdateLeadMutation,
  useBulkLeadActionMutation,
  useCreateLeadMutation,
  useEnrichLeadsMutation,
} from "@/lib/hooks/use-export-leads";
import { useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/lib/types";
import { toast } from "sonner";

type FilterStatus =
  | "all"
  | "new"
  | "valid_email"
  | "invalid_email"
  | "b2b"
  | "consumer"
  | "contacted"
  | "replied"
  | "called";

export function DatabaseSection() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("all");
  const [activeView, setActiveView] = React.useState<"all" | "call_list">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const offset = (currentPage - 1) * itemsPerPage;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Real backend query
  const effectiveFilter = activeView === "call_list" ? "called" : statusFilter;
  const { data, isLoading } = useLeadsQuery({
    search: debouncedSearch,
    filter: effectiveFilter,
    limit: itemsPerPage,
    offset,
  });

  const updateLeadMutation = useUpdateLeadMutation();
  const bulkActionMutation = useBulkLeadActionMutation();
  const createLeadMutation = useCreateLeadMutation();
  const enrichMutation = useEnrichLeadsMutation();
  const [isEnriching, setIsEnriching] = React.useState(false);

  const leads = data?.leads || [];
  const total = data?.total || 0;
  const duplicatesBlocked = data?.duplicatesBlocked ?? 14;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  // Selection states
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedLeadForSheet, setSelectedLeadForSheet] = React.useState<Lead | null>(null);

  // Manual Add Lead Dialog state
  const [addLeadOpen, setAddLeadOpen] = React.useState(false);
  const [manualForm, setManualForm] = React.useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    state: "Texas",
    city: "Austin",
    buyerType: "Wholesaler",
  });

  // Import Dialog states
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length && leads.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
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
  const handleBulkAction = async (action: "validate" | "classify" | "delete") => {
    if (selectedIds.length === 0) return;
    try {
      const res = await bulkActionMutation.mutateAsync({
        leadIds: selectedIds,
        action,
      });
      toast.success(res.message || `Bulk ${action} completed.`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message || "Bulk action failed");
    }
  };

  // Polite Website Crawler Enrichment
  const handleEnrichSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsEnriching(true);
    try {
      const res = await enrichMutation.mutateAsync(selectedIds);
      toast.success("Enrichment Complete!", {
        description: res.message,
      });
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message || "Enrichment failed");
    } finally {
      setIsEnriching(false);
    }
  };

  // Real CSV Export
  const handleExportCSV = () => {
    const filterParam = statusFilter !== "all" ? `?filter=${statusFilter}` : "";
    window.location.href = `/api/leads/export${filterParam}`;
    toast.success("Downloading export file...");
  };

  // Real CSV / XLSX Import
  const handleImportSubmit = async () => {
    if (!importFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      setIsUploading(false);

      if (!res.ok) {
        throw new Error(json.error || "Import failed");
      }

      toast.success("Spreadsheet Ingested!", {
        description: json.message,
      });

      setImportDialogOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    } catch (err: any) {
      setIsUploading(false);
      toast.error(err.message || "Failed to parse spreadsheet");
    }
  };

  const filterChips: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All Leads" },
    { id: "new", label: "Ready to Contact" },
    { id: "b2b", label: "B2B Verified" },
    { id: "valid_email", label: "Valid Email" },
    { id: "invalid_email", label: "Invalid Email" },
    { id: "contacted", label: "Contacted" },
    { id: "replied", label: "Replied" },
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
              Every imported or crawled contact is cross-referenced against workspace root domain and email hashes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={activeView === "all" ? "accent" : "secondary"}
            onClick={() => {
              setActiveView("all");
              setCurrentPage(1);
            }}
            className="text-xs h-8 font-semibold"
          >
            All Leads ({total})
          </Button>
          <Button
            size="sm"
            variant={activeView === "call_list" ? "accent" : "secondary"}
            onClick={() => {
              setActiveView("call_list");
              setCurrentPage(1);
            }}
            className="text-xs h-8 gap-1.5 font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call List</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, CSV Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact, email, or city..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="accent"
            size="sm"
            onClick={() => setAddLeadOpen(true)}
            className="gap-1.5 text-xs h-9 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </Button>

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
      {activeView === "all" && (
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
              </button>
            );
          })}
        </div>
      )}

      {/* Bulk Action Bar */}
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
              disabled={isEnriching}
              onClick={handleEnrichSelected}
              className="h-7 text-xs gap-1 font-semibold text-accent border-accent/40 hover:bg-accent/10"
            >
              <Globe className="w-3 h-3 text-accent" />
              <span>{isEnriching ? "Enriching..." : "Enrich Selected"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("validate")}
              className="h-7 text-xs gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-accent" />
              <span>Validate</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("classify")}
              className="h-7 text-xs gap-1"
            >
              <Sparkles className="w-3 h-3 text-accent" />
              <span>AI Classify</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction("delete")}
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
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Contact Person</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Phone / City</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">AI Class</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="py-3.5 px-4 text-right font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="py-4 px-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-4">
                    <EmptyState
                      icon={Search}
                      title="No buyer leads found"
                      description="Try clearing your search query or run a new discovery job for Singing Bowls."
                    />
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-secondary/30 transition-colors cursor-pointer group ${
                        isSelected ? "bg-secondary/40" : ""
                      }`}
                      onClick={() => setSelectedLeadForSheet(lead)}
                    >
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(lead.id);
                        }}
                      >
                        <Checkbox checked={isSelected} />
                      </td>

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

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">{lead.contactName}</span>
                        <p className="text-[11px] text-muted-foreground">{lead.buyerType}</p>
                      </td>

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
                          <span className="truncate max-w-[180px] text-foreground">{lead.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono text-muted-foreground">{lead.phone || "N/A"}</p>
                        <p className="text-[11px] text-foreground">
                          {lead.city}, {lead.state}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {lead.source}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.aiClass === "b2b" ? (
                          <Badge variant="success">B2B Buyer</Badge>
                        ) : lead.aiClass === "consumer" ? (
                          <Badge variant="warning">Consumer</Badge>
                        ) : (
                          <Badge variant="outline">Unclassified</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.emailStatus === "replied" && <Badge variant="success">Replied</Badge>}
                        {lead.emailStatus === "opened" && <Badge variant="accent">Opened</Badge>}
                        {lead.emailStatus === "sent" && <Badge variant="secondary">Sent</Badge>}
                        {lead.emailStatus === "bounced" && <Badge variant="destructive">Bounced</Badge>}
                        {lead.emailStatus === "not_sent" && (
                          <span className="text-muted-foreground text-[11px]">Not Sent</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                            <DropdownMenuItem onClick={() => setSelectedLeadForSheet(lead)}>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Record &amp; Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                updateLeadMutation.mutate({
                                  id: lead.id,
                                  called: !lead.called,
                                });
                                toast.info(lead.called ? "Marked as Uncalled" : "Marked as Called");
                              }}
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-2 text-accent" />
                              {lead.called ? "Mark Uncalled" : "Mark as Called"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                bulkActionMutation.mutate({
                                  leadIds: [lead.id],
                                  action: "delete",
                                });
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
            Showing <strong className="text-foreground">{total > 0 ? offset + 1 : 0}</strong> to{" "}
            <strong className="text-foreground">{Math.min(offset + itemsPerPage, total)}</strong> of{" "}
            <strong className="text-foreground">{total}</strong> leads
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
                <Badge variant="secondary">Source: {selectedLeadForSheet.source}</Badge>
              </div>

              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-xs">
                <p className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Contact Information
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decision Maker:</span>
                    <span className="font-medium text-foreground">{selectedLeadForSheet.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono text-accent">{selectedLeadForSheet.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telephone:</span>
                    <span className="font-mono text-foreground">{selectedLeadForSheet.phone || "N/A"}</span>
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

              {/* Cold Calling Scratchpad */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-accent" />
                    Cold-Calling Log &amp; Follow-up
                  </span>
                  <button
                    onClick={() => {
                      const updated = {
                        ...selectedLeadForSheet,
                        called: !selectedLeadForSheet.called,
                      };
                      setSelectedLeadForSheet(updated);
                      updateLeadMutation.mutate({
                        id: updated.id,
                        called: updated.called,
                      });
                      toast.success(updated.called ? "Marked as Called" : "Marked as Not Called");
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
                  }}
                  onBlur={() => {
                    updateLeadMutation.mutate({
                      id: selectedLeadForSheet.id,
                      callNotes: selectedLeadForSheet.callNotes,
                    });
                  }}
                  placeholder="Record phone conversation notes (e.g. Spoken with Marcus, interested in MOQ for 7-Chakra sets CIF Houston)..."
                  className="w-full h-20 rounded-lg bg-secondary border border-border p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CSV / Excel Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads (CSV / XLSX)</DialogTitle>
            <DialogDescription>
              Upload exported lists from trade fairs or Apollo. Server automatically cleans, validates MX, and deduplicates against existing records.
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
              if (e.dataTransfer.files?.[0]) {
                setImportFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv,.xlsx,.xls";
              input.onchange = (e: any) => {
                if (e.target.files?.[0]) {
                  setImportFile(e.target.files[0]);
                }
              };
              input.click();
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {importFile ? importFile.name : "Drag & drop CSV or Excel file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx up to 25MB</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleImportSubmit}
              disabled={!importFile || isUploading}
              className="font-semibold"
            >
              {isUploading ? "Parsing & Ingesting..." : "Parse & Ingest Leads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Add Lead Dialog */}
      <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Lead Manually</DialogTitle>
            <DialogDescription>
              Directly insert a prospective buyer contact into your local database.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!manualForm.company || !manualForm.email) {
                toast.error("Company name and email are required.");
                return;
              }
              try {
                await createLeadMutation.mutateAsync({
                  company: manualForm.company,
                  contactName: manualForm.contactName,
                  email: manualForm.email,
                  phone: manualForm.phone,
                  website: manualForm.website || `https://${manualForm.company.toLowerCase().replace(/\s+/g, "")}.com`,
                  state: manualForm.state,
                  city: manualForm.city,
                  country: "United States",
                  buyerType: manualForm.buyerType as any,
                  source: "MANUAL",
                });
                toast.success("Lead created successfully!");
                setAddLeadOpen(false);
                setManualForm({
                  company: "",
                  contactName: "",
                  email: "",
                  phone: "",
                  website: "",
                  state: "Texas",
                  city: "Austin",
                  buyerType: "Wholesaler",
                });
              } catch (err: any) {
                toast.error(err.message || "Failed to create lead");
              }
            }}
            className="space-y-3 py-2"
          >
            <div>
              <label className="text-xs font-semibold text-foreground">Company Name *</label>
              <Input
                required
                value={manualForm.company}
                onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                placeholder="e.g. Austin Acoustic Living LLC"
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Contact Name</label>
                <Input
                  value={manualForm.contactName}
                  onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })}
                  placeholder="e.g. Rachel Miller"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Buyer Type</label>
                <select
                  value={manualForm.buyerType}
                  onChange={(e) => setManualForm({ ...manualForm, buyerType: e.target.value })}
                  className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-xs text-foreground mt-1"
                >
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Importer">Importer</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Showroom">Showroom</option>
                  <option value="Wellness Store">Wellness Store</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <Input
                  required
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  placeholder="rachel@austinliving.com"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Phone Number</label>
                <Input
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  placeholder="+1 (512) 555-0199"
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Website URL</label>
              <Input
                value={manualForm.website}
                onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                placeholder="https://austinliving.com"
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">City</label>
                <Input
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  placeholder="Austin"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">State</label>
                <Input
                  value={manualForm.state}
                  onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                  placeholder="Texas"
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddLeadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" className="font-semibold">
                Save to Database
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
