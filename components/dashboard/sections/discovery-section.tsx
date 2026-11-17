"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  Terminal,
  Globe,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Copy,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lead, DiscoveryRun } from "@/lib/types";
import { toast } from "sonner";

interface DiscoverySectionProps {
  onAddLeads: (newLeads: Lead[], run: DiscoveryRun) => void;
  discoveryRuns: DiscoveryRun[];
  existingLeads: Lead[];
}

export function DiscoverySection({
  onAddLeads,
  discoveryRuns,
  existingLeads,
}: DiscoverySectionProps) {
  // Discovery form state
  const [product, setProduct] = React.useState("Singing Bowls");
  const [category, setCategory] = React.useState("Home Decor");
  const [country, setCountry] = React.useState("United States");
  const [stateFilter, setStateFilter] = React.useState("Texas");
  const [cityFilter, setCityFilter] = React.useState("Austin / Dallas");

  // Sources toggles
  const [sources, setSources] = React.useState({
    google: true,
    linkedin: true,
    directories: true,
    websites: true,
    facebook: false,
  });

  // Buyer types multi-select chips
  const [buyerTypes, setBuyerTypes] = React.useState<string[]>([
    "Wholesalers",
    "Showrooms",
    "Importers",
    "Distributors",
  ]);

  const allBuyerTypeOptions = [
    "Importers",
    "Wholesalers",
    "Retailers",
    "Wellness Stores",
    "Distributors",
    "Showrooms",
  ];

  // Active Tab: Automated vs Manual Toolkit
  const [activeTab, setActiveTab] = React.useState<"automated" | "manual">("automated");

  // Running simulation state
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);

  // Manual Add Lead Dialog state
  const [manualDialogOpen, setManualDialogOpen] = React.useState(false);
  const [manualForm, setManualForm] = React.useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    state: "Texas",
    city: "Houston",
    buyerType: "Wholesaler" as const,
  });

  const toggleBuyerType = (type: string) => {
    if (buyerTypes.includes(type)) {
      if (buyerTypes.length > 1) {
        setBuyerTypes(buyerTypes.filter((t) => t !== type));
      }
    } else {
      setBuyerTypes([...buyerTypes, type]);
    }
  };

  const handleRunDiscovery = () => {
    setIsRunning(true);
    setProgress(5);
    setLogs([`[0.0s] Initializing crawler for product '${product}' in ${country} (${stateFilter || "All States"})...`]);

    const activeSourcesList = Object.entries(sources)
      .filter(([_, v]) => v)
      .map(([k]) => k.toUpperCase());

    const steps = [
      { delay: 400, pct: 20, log: `[0.4s] Querying Google Maps & Business Search with geo-bbox ${stateFilter} [${product} wholesale OR distributor]...` },
      { delay: 900, pct: 45, log: `[0.9s] Scanning ThomasNet & US Trade Registries for HS-code 9206 (Percussion/Acoustic Instruments)...` },
      { delay: 1400, pct: 68, log: `[1.4s] Parsing company websites, extracting owner/buyer emails & telephone contacts...` },
      { delay: 1900, pct: 85, log: `[1.9s] Cross-referencing against internal database: checked 36 existing leads for duplicate domains...` },
      { delay: 2400, pct: 100, log: `[2.4s] Discovery complete. 5 new commercial leads found, 2 duplicate domains blocked.` },
    ];

    steps.forEach(({ delay, pct, log }) => {
      setTimeout(() => {
        setProgress(pct);
        setLogs((prev) => [...prev, log]);
      }, delay);
    });

    setTimeout(() => {
      setIsRunning(false);

      // Create 5 fresh mock leads
      const runId = `RUN-${1050 + discoveryRuns.length}`;
      const newDiscoveredLeads: Lead[] = [
        {
          id: `lead-${Date.now()}-1`,
          company: `${stateFilter || "US"} Artisan Decor & Sound Co.`,
          website: `https://${stateFilter.toLowerCase().replace(/\s+/g, "")}artisandecor.com`,
          contactName: "Julian Vance",
          email: `orders@${stateFilter.toLowerCase().replace(/\s+/g, "")}artisandecor.com`,
          phone: "+1 (512) 555-0391",
          country: "United States",
          state: stateFilter || "Texas",
          city: cityFilter || "Austin",
          source: "google",
          buyerType: "Wholesaler",
          emailValid: true,
          aiClass: "b2b",
          aiConfidence: 0.94,
          aiReasoning: "Commercial showroom holding resale certificate in Texas wholesale district.",
          emailStatus: "not_sent",
          createdAt: new Date().toISOString().split("T")[0],
          called: false,
        },
        {
          id: `lead-${Date.now()}-2`,
          company: "Lone Star Holistic Imports",
          website: "https://lonestarholisticimports.com",
          contactName: "Hannah Morales",
          email: "hannah@lonestarholisticimports.com",
          phone: "+1 (214) 555-0812",
          country: "United States",
          state: "Texas",
          city: "Dallas",
          source: "directory",
          buyerType: "Importer",
          emailValid: true,
          aiClass: "b2b",
          aiConfidence: 0.96,
          aiReasoning: "Registered importer of oriental sound instruments, gongs, and spiritual metalware.",
          emailStatus: "not_sent",
          createdAt: new Date().toISOString().split("T")[0],
          called: false,
        },
        {
          id: `lead-${Date.now()}-3`,
          company: "Southwest Meditation Studio & Supply",
          website: "https://swmeditationsupply.com",
          contactName: "Austin Wright",
          email: "procurement@swmeditationsupply.com",
          phone: "+1 (512) 555-0941",
          country: "United States",
          state: "Texas",
          city: "Austin",
          source: "linkedin",
          buyerType: "Wellness Store",
          emailValid: true,
          aiClass: "b2b",
          aiConfidence: 0.91,
          aiReasoning: "Operates 3 wellness stores and stocks singing bowls for regional practitioners.",
          emailStatus: "not_sent",
          createdAt: new Date().toISOString().split("T")[0],
          called: false,
        },
        {
          id: `lead-${Date.now()}-4`,
          company: "Houston Mystic Haven Gifts",
          website: "https://houstonmystichaven.com",
          contactName: "Clara Bennett",
          email: "clara@houstonmystichaven.com",
          phone: "+1 (713) 555-0143",
          country: "United States",
          state: "Texas",
          city: "Houston",
          source: "website",
          buyerType: "Retailer",
          emailValid: true,
          aiClass: "b2b",
          aiConfidence: 0.88,
          aiReasoning: "Retail gift showroom stocking hand-cast brass and Tibetan items.",
          emailStatus: "not_sent",
          createdAt: new Date().toISOString().split("T")[0],
          called: false,
        },
        {
          id: `lead-${Date.now()}-5`,
          company: "Dallas Sound Sanctuary LLC",
          website: "https://dallassoundsanctuary.com",
          contactName: "Markus Aurel",
          email: "markus@dallassoundsanctuary.com",
          phone: "+1 (972) 555-0128",
          country: "United States",
          state: "Texas",
          city: "Plano",
          source: "google",
          buyerType: "Showroom",
          emailValid: true,
          aiClass: "b2b",
          aiConfidence: 0.93,
          aiReasoning: "Specialty sound therapy showroom buying direct in wholesale pallet volumes.",
          emailStatus: "not_sent",
          createdAt: new Date().toISOString().split("T")[0],
          called: false,
        },
      ];

      const newRun: DiscoveryRun = {
        id: runId,
        product,
        category,
        country,
        state: stateFilter,
        city: cityFilter,
        sources: activeSourcesList,
        leadsFound: 5,
        duplicatesBlocked: 2,
        status: "completed",
        date: "Just now",
      };

      onAddLeads(newDiscoveredLeads, newRun);

      toast.success(`Discovery Run ${runId} Finished!`, {
        description: `Found 5 new qualified US buyers for "${product}". 2 duplicates blocked.`,
      });
    }, 2800);
  };

  const handleManualAddLead = () => {
    if (!manualForm.company || !manualForm.email) {
      toast.error("Please provide company name and email");
      return;
    }

    // Check duplicate
    const isDup = existingLeads.some(
      (l) =>
        l.email.toLowerCase() === manualForm.email.toLowerCase() ||
        (manualForm.website && l.website.toLowerCase().includes(manualForm.website.toLowerCase()))
    );

    if (isDup) {
      toast.error("Duplicate lead blocked!", {
        description: `The email ${manualForm.email} or website already exists in your leads database.`,
      });
      return;
    }

    const newLead: Lead = {
      id: `lead-manual-${Date.now()}`,
      company: manualForm.company,
      website: manualForm.website || `https://${manualForm.company.toLowerCase().replace(/\s+/g, "")}.com`,
      contactName: manualForm.contactName || "Purchasing Manager",
      email: manualForm.email,
      phone: manualForm.phone || "+1 (555) 019-2831",
      country: "United States",
      state: manualForm.state,
      city: manualForm.city,
      source: "website",
      buyerType: manualForm.buyerType,
      emailValid: true,
      aiClass: "b2b",
      aiConfidence: 0.92,
      aiReasoning: "Manually added and verified wholesale contact.",
      emailStatus: "not_sent",
      createdAt: new Date().toISOString().split("T")[0],
      called: false,
    };

    onAddLeads([newLead], {
      id: `MANUAL-${Date.now().toString().slice(-4)}`,
      product: "Singing Bowls",
      category: "Home Decor",
      country: "United States",
      state: manualForm.state,
      sources: ["Manual Entry"],
      leadsFound: 1,
      duplicatesBlocked: 0,
      status: "completed",
      date: "Just now",
    });

    setManualDialogOpen(false);
    toast.success("Lead successfully added!", {
      description: `${manualForm.company} added to central database.`,
    });
    setManualForm({
      company: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      state: "Texas",
      city: "Houston",
      buyerType: "Wholesaler",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Sub-Tabs: Automated Crawler vs Manual Sourcing Toolkit */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("automated")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "automated"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Automated Discovery Engine
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Manual Sourcing Toolkit (Non-IT)</span>
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setManualDialogOpen(true)}
          className="gap-1.5 text-xs"
        >
          <PlusCircle className="w-3.5 h-3.5 text-accent" />
          <span>Add Lead Manually</span>
        </Button>
      </div>

      {activeTab === "automated" ? (
        <>
          {/* Main Discovery Configuration Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 space-y-5">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Search & Target Configuration</CardTitle>
                    <CardDescription>
                      Target product, geographic destination, and commercial filters
                    </CardDescription>
                  </div>
                  <Badge variant="accent">US Market Focus</Badge>
                </div>
              </CardHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Target Export Product
                  </label>
                  <Input
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Singing Bowls, Brass Decor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Product Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home Decor">Home Decor & Accents</SelectItem>
                      <SelectItem value="Wellness & Spa">Wellness, Spa & Sound Healing</SelectItem>
                      <SelectItem value="Handicrafts">Artisanal Metal Handicrafts</SelectItem>
                      <SelectItem value="Spiritual Goods">Meditation & Spiritual Goods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Destination Country
                  </label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States (US)</SelectItem>
                      <SelectItem value="Canada">Canada (CA)</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom (UK)</SelectItem>
                      <SelectItem value="Australia">Australia (AU)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Target State / Province (Optional)
                  </label>
                  <Input
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    placeholder="e.g. Texas, California, Florida"
                  />
                </div>
              </div>

              {/* Source toggles */}
              <div className="pt-2 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground block mb-3">
                  Discovery Channels & Crawl Sources
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-medium text-foreground">Google & Maps</span>
                    <Switch
                      checked={sources.google}
                      onCheckedChange={(checked) =>
                        setSources((prev) => ({ ...prev, google: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-medium text-foreground">LinkedIn Intel</span>
                    <Switch
                      checked={sources.linkedin}
                      onCheckedChange={(checked) =>
                        setSources((prev) => ({ ...prev, linkedin: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-medium text-foreground">B2B Directories</span>
                    <Switch
                      checked={sources.directories}
                      onCheckedChange={(checked) =>
                        setSources((prev) => ({ ...prev, directories: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-medium text-foreground">Company Websites</span>
                    <Switch
                      checked={sources.websites}
                      onCheckedChange={(checked) =>
                        setSources((prev) => ({ ...prev, websites: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs font-medium text-foreground">Facebook Pages</span>
                    <Switch
                      checked={sources.facebook}
                      onCheckedChange={(checked) =>
                        setSources((prev) => ({ ...prev, facebook: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Type Chips */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Target Buyer Profile Types (Multi-Select)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {buyerTypes.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allBuyerTypeOptions.map((type) => {
                    const isSelected = buyerTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleBuyerType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-accent" />
                  <span>Deduplication & MX-syntax validation active</span>
                </div>

                <Button
                  variant="accent"
                  onClick={handleRunDiscovery}
                  disabled={isRunning}
                  className="gap-2 min-w-[160px]"
                >
                  {isRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      <span>Scanning Sources...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Run Discovery</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Side Tip & Stepper Card */}
            <div className="space-y-4">
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="text-sm">Geographic Targeting Tip</CardTitle>
                  <CardDescription>
                    Narrow down geographically to achieve 4x higher open and response rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border">
                      <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">Country Level</p>
                        <p className="text-muted-foreground">United States (US import laws)</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center -my-1 text-muted-foreground">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border">
                      <div className="w-6 h-6 rounded-full bg-chart-1/20 text-chart-1 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        2
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">State Hubs</p>
                        <p className="text-muted-foreground">Texas (Dallas/Austin Design District)</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center -my-1 text-muted-foreground">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border">
                      <div className="w-6 h-6 rounded-full bg-chart-3/20 text-chart-3 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        3
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">Metro & City Niches</p>
                        <p className="text-muted-foreground">Showrooms & Holistic Centers</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground bg-secondary/60 p-2.5 rounded-lg border border-border">
                    💡 <strong className="text-foreground">Pro Exporter Insight:</strong> US buyers respond best when you mention their city or trade mart in the subject line (e.g. &quot;Dallas Trade Mart Singing Bowls Supplier&quot;).
                  </p>
                </CardContent>
              </Card>

              {/* Progress and Live Terminal Log */}
              {isRunning && (
                <Card className="border-accent/40 bg-card">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-accent flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Live Crawler Output
                      </span>
                      <span className="font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                  <div className="bg-black/60 rounded-lg p-3 font-mono text-[11px] text-green-400/90 space-y-1 max-h-36 overflow-y-auto">
                    {logs.map((log, i) => (
                      <div key={i} className="leading-tight">
                        {log}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Discovery Runs Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Discovery Runs</CardTitle>
                <CardDescription>
                  Audit log of automated crawls, leads ingested, and duplicates blocked
                </CardDescription>
              </div>
              <Badge variant="outline">
                Total Runs: {discoveryRuns.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Run ID
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Target Product
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Destination
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Sources
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Leads Found
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Duplicates Blocked
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                        Date / Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {discoveryRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-accent">
                          {run.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {run.product}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {run.country} {run.state ? `(${run.state})` : ""}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex flex-wrap gap-1">
                            {run.sources.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-accent">
                          +{run.leadsFound}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {run.duplicatesBlocked}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success">Completed</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {run.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Manual Sourcing Toolkit (Section 4.9) */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Non-IT Exporter Sourcing Playbook
              </h3>
              <p className="text-xs text-muted-foreground">
                Pre-built deep search queries and direct trade directory links for manual prospecting
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setManualDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Lead Manually</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* LinkedIn Boolean Query Builder */}
            <Card className="space-y-3">
              <CardHeader className="p-0">
                <CardTitle className="text-sm">LinkedIn Recruiter & Sales Search</CardTitle>
                <CardDescription>
                  Copy & paste into LinkedIn Search bar to uncover decision makers
                </CardDescription>
              </CardHeader>
              <div className="p-3 rounded-lg bg-secondary font-mono text-xs text-accent break-all select-all">
                (&quot;Buyer&quot; OR &quot;Purchaser&quot; OR &quot;Merchandiser&quot; OR &quot;CEO&quot;) AND (&quot;Home Decor&quot; OR &quot;Singing Bowls&quot; OR &quot;Sound Therapy&quot;) AND &quot;United States&quot;
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(
                    '("Buyer" OR "Purchaser" OR "Merchandiser" OR "CEO") AND ("Home Decor" OR "Singing Bowls" OR "Sound Therapy") AND "United States"'
                  );
                  toast.success("Query copied to clipboard!");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy LinkedIn Search String</span>
              </Button>
            </Card>

            {/* Google / Maps Query Builder */}
            <Card className="space-y-3">
              <CardHeader className="p-0">
                <CardTitle className="text-sm">Google Maps High-Intent Dork</CardTitle>
                <CardDescription>
                  Extract local wholesale showrooms with published phone numbers
                </CardDescription>
              </CardHeader>
              <div className="p-3 rounded-lg bg-secondary font-mono text-xs text-accent break-all select-all">
                &quot;singing bowls&quot; OR &quot;tingsha bells&quot; wholesale OR showroom intext:&quot;Texas&quot; OR &quot;California&quot; -amazon -walmart
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(
                    '"singing bowls" OR "tingsha bells" wholesale OR showroom intext:"Texas" OR "California" -amazon -walmart'
                  );
                  toast.success("Query copied to clipboard!");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Google Query</span>
              </Button>
            </Card>

            {/* Trade Intelligence Links */}
            <Card className="space-y-3">
              <CardHeader className="p-0">
                <CardTitle className="text-sm">US Customs & Trade Intel</CardTitle>
                <CardDescription>
                  Find real US companies currently importing from India via bills of lading
                </CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <a
                  href="https://www.importyeti.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-foreground transition-colors"
                >
                  <span className="font-medium">ImportYeti (Bill of Lading Intel)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                </a>
                <a
                  href="https://www.thomasnet.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-foreground transition-colors"
                >
                  <span className="font-medium">ThomasNet Industrial Directory</span>
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                </a>
                <a
                  href="https://www.faire.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-foreground transition-colors"
                >
                  <span className="font-medium">Faire Wholesale Marketplace</span>
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Manual Add Lead Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Buyer Lead Manually</DialogTitle>
            <DialogDescription>
              Insert a single B2B prospect discovered through phone calls or trade shows
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Company Name *
              </label>
              <Input
                value={manualForm.company}
                onChange={(e) =>
                  setManualForm({ ...manualForm, company: e.target.value })
                }
                placeholder="e.g. Dallas Mystic Mart"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Contact Person Name
              </label>
              <Input
                value={manualForm.contactName}
                onChange={(e) =>
                  setManualForm({ ...manualForm, contactName: e.target.value })
                }
                placeholder="e.g. Amanda Cole"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Business Email *
              </label>
              <Input
                type="email"
                value={manualForm.email}
                onChange={(e) =>
                  setManualForm({ ...manualForm, email: e.target.value })
                }
                placeholder="buyer@company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Telephone (for Call List)
              </label>
              <Input
                value={manualForm.phone}
                onChange={(e) =>
                  setManualForm({ ...manualForm, phone: e.target.value })
                }
                placeholder="+1 (555) 019-2831"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Website
              </label>
              <Input
                value={manualForm.website}
                onChange={(e) =>
                  setManualForm({ ...manualForm, website: e.target.value })
                }
                placeholder="https://company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Buyer Classification
              </label>
              <Select
                value={manualForm.buyerType}
                onValueChange={(val: any) =>
                  setManualForm({ ...manualForm, buyerType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="Importer">Importer</SelectItem>
                  <SelectItem value="Showroom">Showroom</SelectItem>
                  <SelectItem value="Retailer">Retailer</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Wellness Store">Wellness Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="accent" onClick={handleManualAddLead}>
              Add to Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
