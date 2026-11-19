"use client";

import * as React from "react";
import {
  Search,
  Terminal,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Copy,
  ChevronRight,
  ShieldAlert,
  Coins,
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
import {
  useDiscoveryRunsQuery,
  useRunDiscoveryMutation,
  useCreateLeadMutation,
} from "@/lib/hooks/use-export-leads";
import { toast } from "sonner";

export function DiscoverySection() {
  const { data: runs = [], refetch: refetchRuns } = useDiscoveryRunsQuery();
  const runDiscoveryMutation = useRunDiscoveryMutation();
  const createLeadMutation = useCreateLeadMutation();

  // Search form configuration
  const [product, setProduct] = React.useState("Singing Bowls");
  const [category, setCategory] = React.useState("Home Decor");
  const [country, setCountry] = React.useState("United States");
  const [stateFilter, setStateFilter] = React.useState("Texas");
  const [cityFilter, setCityFilter] = React.useState("Austin");

  // Providers toggles
  const [sources, setSources] = React.useState({
    google_places: true,
    google_search: true,
    apollo: true,
    web_enrich: true,
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

  // Real-time SSE Log stream state
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
    city: "Austin",
    buyerType: "WHOLESALER",
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

  const handleRunDiscovery = async () => {
    setIsRunning(true);
    setProgress(5);
    setLogs([`[0.0s] Initializing discovery pipeline for '${product}' in ${country} (${stateFilter || "All"})...`]);

    const activeProviders = Object.entries(sources)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    try {
      // Connect to SSE stream
      const streamRunId = `RUN-${Date.now().toString().slice(-4)}`;
      const eventSource = new EventSource(`/api/discovery/runs/${streamRunId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setProgress(payload.progress);
          setLogs((prev) => [...prev, payload.log]);
        } catch (e) {}
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      // Trigger server discovery mutation
      const result = await runDiscoveryMutation.mutateAsync({
        product,
        category,
        country,
        state: stateFilter,
        city: cityFilter,
        buyerTypes,
        providers: activeProviders,
        resultCap: 15,
      });

      eventSource.close();
      setIsRunning(false);
      setProgress(100);
      refetchRuns();

      toast.success("Discovery Run Completed!", {
        description: result.message,
      });
    } catch (err: any) {
      setIsRunning(false);
      toast.error("Discovery failed", {
        description: err.message,
      });
    }
  };

  const handleManualAddLead = async () => {
    if (!manualForm.company || !manualForm.email) {
      toast.error("Please provide company name and email");
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

      setManualDialogOpen(false);
      toast.success("Lead successfully added!", {
        description: `${manualForm.company} saved with MX & AI validation.`,
      });
      setManualForm({
        company: "",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        state: "Texas",
        city: "Austin",
        buyerType: "WHOLESALER",
      });
    } catch (err: any) {
      toast.error("Could not add lead", {
        description: err.message,
      });
    }
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
                    <CardTitle>Search &amp; Target Configuration</CardTitle>
                    <CardDescription>
                      Target export product, destination geographic niche, and real licensed providers
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-0.5 rounded">
                      <Coins className="w-3 h-3 text-accent" /> Est. Cost: ~\$0.08 / lead
                    </span>
                    <Badge variant="accent">US Market</Badge>
                  </div>
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
                      <SelectItem value="Home Decor">Home Decor &amp; Accents</SelectItem>
                      <SelectItem value="Wellness & Spa">Wellness &amp; Sound Healing</SelectItem>
                      <SelectItem value="Handicrafts">Artisanal Metal Crafts</SelectItem>
                      <SelectItem value="Spiritual Goods">Meditation &amp; Spiritual Goods</SelectItem>
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
                    Target State / City (Niche Hub)
                  </label>
                  <Input
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    placeholder="e.g. Texas, California, Florida"
                  />
                </div>
              </div>

              {/* Provider Toggles */}
              <div className="pt-2 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground block mb-3">
                  Connected Data Discovery Providers
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Google Places</p>
                      <p className="text-[10px] text-muted-foreground">Showrooms</p>
                    </div>
                    <Switch
                      checked={sources.google_places}
                      onCheckedChange={(c) => setSources((s) => ({ ...s, google_places: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Google Search</p>
                      <p className="text-[10px] text-muted-foreground">Wholesalers</p>
                    </div>
                    <Switch
                      checked={sources.google_search}
                      onCheckedChange={(c) => setSources((s) => ({ ...s, google_search: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Apollo B2B</p>
                      <p className="text-[10px] text-muted-foreground">Procurement</p>
                    </div>
                    <Switch
                      checked={sources.apollo}
                      onCheckedChange={(c) => setSources((s) => ({ ...s, apollo: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Web Enricher</p>
                      <p className="text-[10px] text-muted-foreground">robots.txt safe</p>
                    </div>
                    <Switch
                      checked={sources.web_enrich}
                      onCheckedChange={(c) => setSources((s) => ({ ...s, web_enrich: c }))}
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
                  <span>Deduplication &amp; MX validation automatically executed</span>
                </div>

                <Button
                  variant="accent"
                  onClick={handleRunDiscovery}
                  disabled={isRunning}
                  className="gap-2 min-w-[160px] font-semibold"
                >
                  {isRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      <span>Scanning Providers...</span>
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
                  <CardTitle className="text-sm">Geographic Niche Tip</CardTitle>
                  <CardDescription>
                    Achieve 4x higher response rates by pitching specific US metro trade marts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border">
                      <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">Target Country</p>
                        <p className="text-muted-foreground">United States (Harmonized Tariff 9206)</p>
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
                        <p className="font-semibold text-foreground">Regional Wholesale Hubs</p>
                        <p className="text-muted-foreground">Texas (Dallas World Trade Center)</p>
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
                        <p className="font-semibold text-foreground">Commercial Showrooms</p>
                        <p className="text-muted-foreground">Holistic Living &amp; Home Accents</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground bg-secondary/60 p-2.5 rounded-lg border border-border">
                    💡 <strong className="text-foreground">Pro Exporter Tip:</strong> US wholesale showroom buyers open emails at a 62% higher rate when FOB pricing and catalog PDFs are mentioned in the first 2 lines.
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
                        Live SSE Job Stream
                      </span>
                      <span className="font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                  <div className="bg-black/60 rounded-lg p-3 font-mono text-[11px] text-green-400/90 space-y-1 max-h-40 overflow-y-auto">
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
                  Audit trail of automated searches, qualified leads found, and duplicates blocked
                </CardDescription>
              </div>
              <Badge variant="outline">Total Runs: {runs.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Run ID</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Destination</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Sources</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Leads Found</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Duplicates Blocked</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {runs.map((run) => (
                      <tr key={run.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-accent">{run.id}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{run.product}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {run.country} {run.state ? `(${run.state})` : ""}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex flex-wrap gap-1">
                            {run.sources.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-accent">+{run.leadsFound}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{run.duplicatesBlocked}</td>
                        <td className="py-3 px-4">
                          <Badge variant="success">Completed</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{run.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Manual Sourcing Toolkit (Non-IT Exporters) */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Non-IT Exporter Sourcing Playbook
              </h3>
              <p className="text-xs text-muted-foreground">
                Deep search queries and direct trade directory links for manual prospecting
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setManualDialogOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Lead Manually</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* LinkedIn Search String */}
            <Card className="space-y-3">
              <CardHeader className="p-0">
                <CardTitle className="text-sm">LinkedIn Recruiter &amp; Sales Search</CardTitle>
                <CardDescription>
                  Copy &amp; paste into LinkedIn search bar to find buyers
                </CardDescription>
              </CardHeader>
              <div className="p-3 rounded-lg bg-secondary font-mono text-xs text-accent break-all select-all">
                (&quot;Buyer&quot; OR &quot;Purchaser&quot; OR &quot;Procurement Manager&quot;) AND (&quot;Home Decor&quot; OR &quot;Singing Bowls&quot;) AND &quot;United States&quot;
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(
                    '("Buyer" OR "Purchaser" OR "Procurement Manager") AND ("Home Decor" OR "Singing Bowls") AND "United States"'
                  );
                  toast.success("Query copied to clipboard!");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy LinkedIn Search String</span>
              </Button>
            </Card>

            {/* Google Dork Search */}
            <Card className="space-y-3">
              <CardHeader className="p-0">
                <CardTitle className="text-sm">Google Maps High-Intent Dork</CardTitle>
                <CardDescription>
                  Extract local wholesale showrooms with direct phone numbers
                </CardDescription>
              </CardHeader>
              <div className="p-3 rounded-lg bg-secondary font-mono text-xs text-accent break-all select-all">
                &quot;singing bowls&quot; OR &quot;meditation bells&quot; wholesale OR showroom intext:&quot;Texas&quot; OR &quot;California&quot; -amazon -walmart
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(
                    '"singing bowls" OR "meditation bells" wholesale OR showroom intext:"Texas" OR "California" -amazon -walmart'
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
                <CardTitle className="text-sm">US Customs &amp; Trade Intel</CardTitle>
                <CardDescription>
                  Find real US companies importing Indian handicrafts via bills of lading
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
                  <span className="font-medium">ThomasNet Wholesale Directory</span>
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
              Insert a single B2B prospect discovered through trade fairs or phone calls
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Company Name *</label>
              <Input
                value={manualForm.company}
                onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                placeholder="e.g. Austin Mystic Showroom"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Contact Person</label>
              <Input
                value={manualForm.contactName}
                onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })}
                placeholder="e.g. Marcus Vance"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Business Email *</label>
              <Input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                placeholder="buyer@company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Telephone (Call List)</label>
              <Input
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="+1 (512) 555-0192"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Website</label>
              <Input
                value={manualForm.website}
                onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Buyer Type</label>
              <Select
                value={manualForm.buyerType}
                onValueChange={(val: any) => setManualForm({ ...manualForm, buyerType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHOLESALER">Wholesaler</SelectItem>
                  <SelectItem value="IMPORTER">Importer</SelectItem>
                  <SelectItem value="SHOWROOM">Showroom</SelectItem>
                  <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                  <SelectItem value="RETAILER">Retailer</SelectItem>
                  <SelectItem value="WELLNESS_STORE">Wellness Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
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
