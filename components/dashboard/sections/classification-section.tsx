"use client";

import * as React from "react";
import {
  Sparkles,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassificationChart } from "@/components/dashboard/charts/classification-chart";
import { useLeadsQuery, useClassifyLeadsMutation, useUpdateLeadMutation } from "@/lib/hooks/use-export-leads";
import { toast } from "sonner";

export function ClassificationSection() {
  const { data, isLoading } = useLeadsQuery({ limit: 100 });
  const classifyMutation = useClassifyLeadsMutation();
  const updateLeadMutation = useUpdateLeadMutation();

  const [confidenceThreshold, setConfidenceThreshold] = React.useState(0.75);
  const [isClassifying, setIsClassifying] = React.useState(false);
  const [classifyProgress, setClassifyProgress] = React.useState(0);

  const leads = data?.leads || [];
  const unclassified = leads.filter((l) => l.aiClass === null);
  const b2bCount = leads.filter((l) => l.aiClass === "b2b").length;
  const consumerCount = leads.filter((l) => l.aiClass === "consumer").length;

  const handleClassifyAll = async () => {
    setIsClassifying(true);
    setClassifyProgress(20);

    const timer = setInterval(() => {
      setClassifyProgress((prev) => (prev < 90 ? prev + 20 : prev));
    }, 300);

    try {
      const res = await classifyMutation.mutateAsync({
        threshold: confidenceThreshold,
      });
      clearInterval(timer);
      setClassifyProgress(100);
      setIsClassifying(false);
      toast.success("Gemini Classification Completed!", {
        description: res.message,
      });
    } catch (err: any) {
      clearInterval(timer);
      setIsClassifying(false);
      toast.error(err.message || "Failed to classify leads");
    }
  };

  const handleManualClassOverride = (lead: any, newClass: "b2b" | "consumer") => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    updateLeadMutation.mutate({
      id: lead.id,
      aiClass: newClass,
      aiConfidence: 1.0,
      aiReasoning: `Manual override by Exporter [${timestamp}] to ${newClass.toUpperCase()}.`,
    });
    toast.info(`Updated ${lead.company} classification to ${newClass.toUpperCase()}`);
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Model Connection Header Card */}
      <Card className="bg-gradient-to-r from-card via-card to-accent/5 border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Gemini Flash Classification Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluates business taxonomy, wholesale keywords, resale licensing requirements, and order volume signals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="accent"
              size="sm"
              disabled={isClassifying}
              onClick={handleClassifyAll}
              className="gap-1.5 text-xs font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isClassifying ? "Processing..." : `Classify All (${unclassified.length} pending)`}</span>
            </Button>
          </div>
        </div>

        {isClassifying && (
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-accent">
              <span>Running Gemini Flash semantic evaluation on website content...</span>
              <span>{classifyProgress}%</span>
            </div>
            <Progress value={classifyProgress} />
          </div>
        )}
      </Card>

      {/* Row: Confidence Filter & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-5">
          <CardHeader className="p-0">
            <CardTitle className="text-sm">Classification Controls</CardTitle>
            <CardDescription>
              Set minimum confidence required to qualify contacts as commercial buyers
            </CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence Threshold</span>
              <span className="font-mono text-accent font-bold">
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <Slider
              value={[confidenceThreshold * 100]}
              onValueChange={([val]) => setConfidenceThreshold(val / 100)}
              max={100}
              min={50}
              step={1}
            />
            <p className="text-[11px] text-muted-foreground">
              Leads below {Math.round(confidenceThreshold * 100)}% will be held for manual exporter review before outreach.
            </p>
          </div>

          <div className="pt-3 border-t border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Verified Commercial B2B:</span>
              <span className="font-mono font-bold text-accent">{b2bCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retail Consumers Filtered:</span>
              <span className="font-mono font-bold text-warning">{consumerCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending AI Review:</span>
              <span className="font-mono font-bold text-muted-foreground">{unclassified.length}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>AI Verification Distribution</CardTitle>
            <CardDescription>
              Gemini confidence spectrum across your Singing Bowls buyer pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassificationChart leads={leads as any} />
          </CardContent>
        </Card>
      </div>

      {/* Classification Results Table with Manual Overrides */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Classified Buyer Profiles</CardTitle>
            <CardDescription>
              Live reasoning and classification audit. You can manually override any AI decision.
            </CardDescription>
          </div>
          <Badge variant="outline">{leads.length} Records Evaluated</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Company &amp; Website</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Detected Profile</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Confidence</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Gemini AI Reasoning</th>
                  <th className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-muted-foreground">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.slice(0, 10).map((lead) => {
                  const pct = Math.round((lead.aiConfidence || 0.9) * 100);
                  return (
                    <tr key={lead.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{lead.company}</p>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-accent flex items-center gap-1"
                        >
                          <span>{lead.website.replace("https://", "")}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{lead.buyerType}</span>
                        <p className="text-[11px] text-muted-foreground">{lead.city}, {lead.state}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="text-muted-foreground">Score</span>
                            <span className="font-bold text-accent">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                          {lead.aiReasoning || "Awaiting Gemini semantic analysis."}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Select
                          value={lead.aiClass || "unclassified"}
                          onValueChange={(val: any) =>
                            handleManualClassOverride(lead, val === "consumer" ? "consumer" : "b2b")
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-32 ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="b2b">
                              <span className="text-accent font-semibold">B2B Buyer</span>
                            </SelectItem>
                            <SelectItem value="consumer">
                              <span className="text-warning font-semibold">Consumer</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
