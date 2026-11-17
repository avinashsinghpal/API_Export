"use client";

import * as React from "react";
import {
  Building2,
  Key,
  Mail,
  Shield,
  Bell,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Save,
  Trash2,
  RotateCcw,
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
import { toast } from "sonner";

interface SettingsSectionProps {
  onClearDatabase: () => void;
  onResetDemoData: () => void;
}

export function SettingsSection({
  onClearDatabase,
  onResetDemoData,
}: SettingsSectionProps) {
  // Exporter Profile state
  const [profile, setProfile] = React.useState({
    companyName: "Aura Crafts Exports India Pvt. Ltd.",
    iecCode: "0519048821 (Verified Exporter)",
    originCity: "Moradabad / New Delhi, India",
    exportCategory: "Home Decor, Spiritual Goods, Tibetan Singing Bowls",
    website: "https://auracraftsexports.com",
    exportManager: "Avinash Singh",
    phone: "+91 98110 23456",
  });

  // Integrations state (masked API keys with toggle)
  const [geminiKey, setGeminiKey] = React.useState("AIzaSyDk99_mock_gemini_pro_export_key_88");
  const [showGeminiKey, setShowGeminiKey] = React.useState(false);

  const [apolloKey, setApolloKey] = React.useState("ap_key_994238_sec_mock_491");
  const [showApolloKey, setShowApolloKey] = React.useState(false);

  // Email Defaults
  const [emailDefaults, setEmailDefaults] = React.useState({
    senderName: "Avinash Singh | Aura Crafts Exports",
    senderEmail: "exportleads.demo@gmail.com",
    signature: `Avinash Singh\nHead of Global Trade | Aura Crafts Exports, India\nDirect / WhatsApp: +91 98110 23456\nWeb: https://auracraftsexports.com\nSpecialized in Handcrafted 7-Chakra Singing Bowls & Artisan Metal Decor`,
  });

  // Data Rules
  const [dataRules, setDataRules] = React.useState({
    dedupeEmail: true,
    dedupeDomain: true,
    autoValidateOnImport: true,
    strictB2BThreshold: true,
  });

  // Notifications
  const [notifications, setNotifications] = React.useState({
    emailOnReply: true,
    dailySummary: true,
    bounceAlert: true,
    exportReportsWeekly: false,
  });

  // Danger zone dialog
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

  const handleSaveSettings = () => {
    toast.success("Settings Saved Successfully!", {
      description: "Preferences and integration configurations updated.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Configuration &amp; Integration Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage exporter credentials, Gemini AI model tokens, and data hygiene rules
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
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Tab: Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Indian Exporter Business Profile</CardTitle>
              <CardDescription>
                Company registration details embedded in overseas buyer presentations
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Company Name (Registered)
                </label>
                <Input
                  value={profile.companyName}
                  onChange={(e) =>
                    setProfile({ ...profile, companyName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  DGFT IEC Code / Export License
                </label>
                <Input
                  value={profile.iecCode}
                  onChange={(e) =>
                    setProfile({ ...profile, iecCode: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Manufacturing Hub &amp; Origin
                </label>
                <Input
                  value={profile.originCity}
                  onChange={(e) =>
                    setProfile({ ...profile, originCity: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Primary Export Product Line
                </label>
                <Input
                  value={profile.exportCategory}
                  onChange={(e) =>
                    setProfile({ ...profile, exportCategory: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Export Trade Manager
                </label>
                <Input
                  value={profile.exportManager}
                  onChange={(e) =>
                    setProfile({ ...profile, exportManager: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  WhatsApp / Phone for US Buyers
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
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
                Configure credentials for Gemini AI, Gmail Workspace, and intelligence providers
              </CardDescription>
            </CardHeader>

            {/* Gemini API Key */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">
                    Gemini AI API Key
                  </span>
                  <Badge variant="accent">Connected</Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Model: Gemini Flash
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeminiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Used for automated semantic classification of US importers, wholesalers, and consumers.
              </p>
            </div>

            {/* Gmail OAuth */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">
                    Gmail Workspace OAuth
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                <span className="font-mono text-xs text-accent">
                  exportleads.demo@gmail.com
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Connected with Google API scopes: https://www.googleapis.com/auth/gmail.send. Automatic token refresh enabled.
              </p>
            </div>

            {/* Optional Apollo / Lusha */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">
                  Apollo / Lusha API Key (Optional Enrichment)
                </span>
                <span className="text-[11px] text-muted-foreground">Optional</span>
              </div>
              <div className="relative">
                <Input
                  type={showApolloKey ? "text" : "password"}
                  value={apolloKey}
                  onChange={(e) => setApolloKey(e.target.value)}
                  className="font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApolloKey(!showApolloKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApolloKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Email Defaults */}
        <TabsContent value="email" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Default Sender &amp; Signature</CardTitle>
              <CardDescription>
                Applied to all new cold outreach campaigns and follow-up emails
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Sender Display Name
                </label>
                <Input
                  value={emailDefaults.senderName}
                  onChange={(e) =>
                    setEmailDefaults({
                      ...emailDefaults,
                      senderName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Sender Email Address
                </label>
                <Input
                  value={emailDefaults.senderEmail}
                  onChange={(e) =>
                    setEmailDefaults({
                      ...emailDefaults,
                      senderEmail: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Email Signature Template
                </label>
                <Textarea
                  value={emailDefaults.signature}
                  onChange={(e) =>
                    setEmailDefaults({
                      ...emailDefaults,
                      signature: e.target.value,
                    })
                  }
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
              <CardTitle className="text-sm">Deduplication &amp; Hygiene Rules</CardTitle>
              <CardDescription>
                Automated protections triggered on every crawl and CSV import
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">
                    Strict Email Deduplication
                  </p>
                  <p className="text-muted-foreground">
                    Block importing any contact whose email already exists in the central repository.
                  </p>
                </div>
                <Switch
                  checked={dataRules.dedupeEmail}
                  onCheckedChange={(c) =>
                    setDataRules({ ...dataRules, dedupeEmail: c })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">
                    Domain Normalization &amp; Collisions
                  </p>
                  <p className="text-muted-foreground">
                    Flag companies with identical root domains (e.g. branch vs headquarters).
                  </p>
                </div>
                <Switch
                  checked={dataRules.dedupeDomain}
                  onCheckedChange={(c) =>
                    setDataRules({ ...dataRules, dedupeDomain: c })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">
                    Auto-Validate Mailbox on Ingestion
                  </p>
                  <p className="text-muted-foreground">
                    Run syntax and MX lookups immediately when new leads are discovered.
                  </p>
                </div>
                <Switch
                  checked={dataRules.autoValidateOnImport}
                  onCheckedChange={(c) =>
                    setDataRules({ ...dataRules, autoValidateOnImport: c })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm">Alerts &amp; Notifications</CardTitle>
              <CardDescription>
                Desktop and in-app alerts for high-priority buyer actions
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">
                    Real-Time Wholesale Reply Alert
                  </p>
                  <p className="text-muted-foreground">
                    Notify immediately when an overseas buyer replies with pricing requests.
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOnReply}
                  onCheckedChange={(c) =>
                    setNotifications({ ...notifications, emailOnReply: c })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">
                    High Bounce Rate Safeguard Alert
                  </p>
                  <p className="text-muted-foreground">
                    Alert if hard bounce rate exceeds 4% in any single dispatch.
                  </p>
                </div>
                <Switch
                  checked={notifications.bounceAlert}
                  onCheckedChange={(c) =>
                    setNotifications({ ...notifications, bounceAlert: c })
                  }
                />
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
              <CardDescription>
                Irreversible actions for testing or clearing local workspace data
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <p className="font-semibold text-foreground">
                    Reset Demo State (Singing Bowls Scenario)
                  </p>
                  <p className="text-muted-foreground">
                    Restore the 36 default US Singing Bowls wholesale leads and initial metrics.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onResetDemoData();
                    toast.success("Restored default demo scenario leads!");
                  }}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/15 border border-destructive/30">
                <div>
                  <p className="font-semibold text-destructive">
                    Purge All Leads in Central Database
                  </p>
                  <p className="text-muted-foreground">
                    Permanently delete all contacts, audit logs, and discovery runs.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  className="gap-1.5 text-xs shrink-0"
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
            <AlertDialogTitle className="text-destructive">
              Purge All Database Records?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all stored US buyer leads, validation states, and outreach logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onClearDatabase();
                setClearDialogOpen(false);
                toast.error("Database completely cleared.");
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
