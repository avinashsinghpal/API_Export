export interface SpamRiskEvaluation {
  score: number; // 0 to 100
  level: "Low" | "Medium" | "High";
  flags: string[];
}

/**
 * Calculates spam-risk score based on link count, attachment size,
 * trigger words, missing unsubscribe link, and plain-text alternatives.
 */
export function calculateSpamRisk(input: {
  subject: string;
  body: string;
  hasAttachment: boolean;
  attachmentSizeMB?: number;
  hasUnsubscribe: boolean;
}): SpamRiskEvaluation {
  let score = 5;
  const flags: string[] = [];

  const spamTriggers = [
    "100% free", "risk-free", "act now", "urgent", "make money",
    "wire transfer", "guarantee", "congratulations", "winner",
    "no obligation", "as seen on", "cheap", "bonus",
  ];

  const fullText = `${input.subject} ${input.body}`.toLowerCase();
  for (const word of spamTriggers) {
    if (fullText.includes(word)) {
      score += 15;
      flags.push(`Spam trigger keyword: "${word}"`);
    }
  }

  // Link count
  const linkMatches = fullText.match(/https?:\/\//g) || [];
  if (linkMatches.length > 3) {
    score += 15;
    flags.push(`Too many external links (${linkMatches.length})`);
  }

  // Attachment size
  if (input.hasAttachment) {
    score += 10;
    if ((input.attachmentSizeMB || 0) > 4) {
      score += 25;
      flags.push(`Large PDF attachment (${input.attachmentSizeMB}MB) may trigger spam filters; recommend hosted catalog link instead.`);
    }
  }

  // ALL CAPS words in subject
  const allCapsWords = (input.subject.match(/\b[A-Z]{4,}\b/g) || []).filter(
    (w) => w !== "HTTP" && w !== "HTML" && w !== "LLC"
  );
  if (allCapsWords.length > 0) {
    score += 20;
    flags.push(`ALL CAPS words in subject line (${allCapsWords.join(", ")})`);
  }

  // Missing unsubscribe
  if (!input.hasUnsubscribe) {
    score += 30;
    flags.push("Missing CAN-SPAM compliant unsubscribe link");
  }

  const boundedScore = Math.min(100, Math.max(0, score));
  const level = boundedScore < 30 ? "Low" : boundedScore < 60 ? "Medium" : "High";

  return {
    score: boundedScore,
    level,
    flags,
  };
}

/**
 * Replaces personalization tokens with safe fallbacks and validates unresolved tags.
 */
export function mergePersonalizationTokens(
  template: string,
  data: {
    company_name: string;
    contact_name?: string;
    product: string;
    country: string;
    state?: string;
    sender_name: string;
  }
): { merged: string; unresolved: string[] } {
  let text = template;
  text = text.replace(/{{company_name}}/g, data.company_name || "Valued Partner");
  text = text.replace(/{{contact_name}}/g, data.contact_name || "Purchasing Team");
  text = text.replace(/{{product}}/g, data.product || "Handcrafted Goods");
  text = text.replace(/{{country}}/g, data.country || "United States");
  text = text.replace(/{{state}}/g, data.state || "");
  text = text.replace(/{{sender_name}}/g, data.sender_name || "Trade Representative");

  // Check remaining {{token}} patterns
  const remainingMatches = text.match(/{{([a-zA-Z0-9_-]+)}}/g) || [];
  return {
    merged: text,
    unresolved: remainingMatches,
  };
}
