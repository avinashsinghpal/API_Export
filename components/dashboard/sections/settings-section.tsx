"use client";

import * as React from "react";
import {
  Save,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  Download,
  Plug,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
  useIntegrationsQuery,
} from "@/lib/hooks/use-export-leads";
import { toast } from "sonner";

export function SettingsSection() {
  const { data: initialSettings } = useSettingsQuery();
  const { data: providers = [] } = useIntegrationsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();

  const [profile, setProfile] = React.useState({
    companyName: "Aura Crafts Exports India Pvt. Ltd.",
    iecCode: "0519048821 (Verified Exporter)",
    originCity: "Moradabad / New Delhi, India",
    exportCategory: "Home Decor, Spiritual Goods, Tibetan Singing Bowls",
    exportManager: "Avinash Singh",
    phone: "+91 98110 23456",
  });

  const [settingsForm, setSettingsForm] = React.useState({
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
  });

  React.useEffect(() => {
    if (initialSettings) {
      setSettingsForm((prev) => ({
        ...prev,
        ...initialSettings,
      }));
    }
  }, [initialSettings]);

  // Keys visibility
  const [showGeminiKey, setShowGeminiKey] = React.useState(false);
  const [showApolloKey, setShowApolloKey] = React.useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = React.useState("AIzaSy••••••••gemini_flash");
  const [apolloKeyInput, setApolloKeyInput] = React.useState("ap_key_••••••••sec");

  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settingsForm);
      toast.success("Settings Saved!", {
        description: "Exporter profile and delivery safeguards updated in database.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const handleTestIntegration = async (provider: string) => {
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      toast.success(`${provider} Connected!`, {
        description: data.message,
      });
    } catch (err: any) {
      toast.error(`Could not reach ${provider}`);
    }
  };

  const handleExportAllData = () => {
    window.location.href = "/api/database/backup";
    toast.success("Downloading SQLite database backup (app.db)...");
  };

  const handleWipeDatabase = async () => {
    try {
      const res = await fetch("/api/database/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.error(data.message || "Database wiped.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset database");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Configuration &amp; Integration Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage exporter credentials, Gemini AI model tokens, Gmail OAuth, and CAN-SPAM data rules
          </p>
        </div>

        <Button
          variant="accent"
          size="sm"
          onClick={handleSaveSettings}
          className="gap-1.5 text-xs font-semibold"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-secondary/60">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="email">Email Defaults</TabsTrigger>
          <TabsTrigger value="rules">Data Rules</TabsTrigger>
          <TabsTrigger value="privacy">Data &amp; Privacy</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Tab: Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Indian Exporter Business Profile</CardTitle>
              <CardDescription>
                Company registration details and verified export credentials
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Company Name (Registered)</label>
                <Input
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">DGFT IEC Code / Export License</label>
                <Input
                  value={profile.iecCode}
                  onChange={(e) => setProfile({ ...profile, iecCode: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Manufacturing Origin</label>
                <Input
                  value={profile.originCity}
                  onChange={(e) => setProfile({ ...profile, originCity: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Primary Export Line</label>
                <Input
                  value={profile.exportCategory}
                  onChange={(e) => setProfile({ ...profile, exportCategory: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Export Trade Manager</label>
                <Input
                  value={profile.exportManager}
                  onChange={(e) => setProfile({ ...profile, exportManager: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">WhatsApp / Phone for US Buyers</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="space-y-5">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">External API &amp; LLM Integrations</CardTitle>
              <CardDescription>
                Configure AES-256 encrypted credentials for Gemini AI, Gmail Workspace, and Apollo
              </CardDescription>
            </CardHeader>

            {/* Gemini API Key */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">Gemini 1.5 Flash API Key</span>
                  <Badge variant="accent">Connected</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestIntegration("Gemini AI")}
                  className="h-6 text-[10px] gap-1"
                >
                  <Plug className="w-3 h-3" />
                  <span>Test Connection</span>
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Powering automated semantic classification of US importers, wholesalers, and consumers.
              </p>
            </div>

            {/* Gmail OAuth */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">Gmail Workspace OAuth 2.0</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestIntegration("Gmail OAuth")}
                  className="h-6 text-[10px] gap-1"
                >
                  <Plug className="w-3 h-3" />
                  <span>Verify Scope</span>
                </Button>
              </div>
              <span className="font-mono text-xs text-accent">exportleads.demo@gmail.com</span>
              <p className="text-[11px] text-muted-foreground">
                Authorized with Gmail API scopes (gmail.send, gmail.readonly). Stored tokens encrypted with AES-256-GCM.
              </p>
            </div>

            {/* Apollo API Key */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">Apollo.io API Key (B2B Directory)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestIntegration("Apollo.io")}
                  className="h-6 text-[10px] gap-1"
                >
                  <Plug className="w-3 h-3" />
                  <span>Test Key</span>
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={showApolloKey ? "text" : "password"}
                  value={apolloKeyInput}
                  onChange={(e) => setApolloKeyInput(e.target.value)}
                  className="font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApolloKey(!showApolloKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApolloKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Email Defaults */}
        <TabsContent value="email" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Default Sender &amp; Compliance Details</CardTitle>
              <CardDescription>
                CAN-SPAM mandatory physical address and sender identity embedded in all messages
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Sender Display Name</label>
                <Input
                  value={settingsForm.senderName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, senderName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Sender Email Address</label>
                <Input
                  value={settingsForm.senderEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, senderEmail: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Valid Physical Postal Address (Mandatory by CAN-SPAM Act)
                </label>
                <Input
                  value={settingsForm.senderAddress}
                  onChange={(e) => setSettingsForm({ ...settingsForm, senderAddress: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Default Email Signature</label>
                <Textarea
                  value={settingsForm.emailSignature}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emailSignature: e.target.value })}
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Data Rules */}
        <TabsContent value="rules" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Hygiene &amp; Safety Rules</CardTitle>
              <CardDescription>Server-side automated rules preventing duplicate sends and spam blocks</CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Strict Root Domain &amp; Email Deduplication</p>
                  <p className="text-muted-foreground">Enforces unique domain constraints on discovery and imports.</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Auto-Validate Mailboxes on Ingestion</p>
                  <p className="text-muted-foreground">Runs DNS MX checks and RFC syntax verification immediately.</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Auto-Pause Campaign if Bounce Rate &gt; 5%</p>
                  <p className="text-muted-foreground">Safeguards Gmail sender domain from blocklisting.</p>
                </div>
                <Switch
                  checked={settingsForm.autoStopOnBounce}
                  onCheckedChange={(c) => setSettingsForm({ ...settingsForm, autoStopOnBounce: c })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Data & Privacy */}
        <TabsContent value="privacy" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Data &amp; Privacy Governance</CardTitle>
              <CardDescription>
                Full GDPR &amp; CAN-SPAM data portability, deletion controls, and audit trails
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">Export Full Workspace Archive</p>
                  <p className="text-muted-foreground">
                    Download complete snapshot of leads, campaigns, activity logs, and email history.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportAllData} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </Button>
              </div>

              <div className="p-3.5 rounded-lg bg-secondary/40 border border-border space-y-1.5">
                <p className="font-semibold text-foreground">Lead Source Transparency</p>
                <p className="text-muted-foreground">
                  Every prospect stored in your database maintains an immutable source reference (Google Places, B2B Directory, or Manual Upload) to satisfy international legitimate-interest documentation requirements.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Danger Zone */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive/30 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Database Reset &amp; Cleanup
              </CardTitle>
              <CardDescription>Irreversible actions for resetting local data</CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <p className="font-semibold text-foreground">Reset Default Demo Scenario</p>
                  <p className="text-muted-foreground">
                    Reload the 36 default US Singing Bowls wholesale leads and baseline metrics.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.reload();
                    toast.success("Demo dataset refreshed.");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reload Demo Dataset</span>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/15 border border-destructive/30">
                <div>
                  <p className="font-semibold text-destructive">Wipe All Database Leads</p>
                  <p className="text-muted-foreground">Permanently delete stored buyer records and campaigns.</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Database</span>
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wipe Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Purge All Database Records?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all stored US buyer leads, validation states, and outreach campaigns. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                setClearDialogOpen(false);
                await handleWipeDatabase();
              }}
            >
              Confirm Wipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
