import dns from "dns/promises";

// Common disposable / temp email domains
export const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "trashmail.com",
  "sharklasers.com",
  "dispostable.com",
  "yopmail.com",
  "fakeinbox.com",
  "throwawaymail.com",
  "temp-trash-lead-2026.biz",
]);

// Generic non-inbound role prefixes (strictly rejected)
export const BLOCKED_ROLE_PREFIXES = new Set([
  "noreply",
  "no-reply",
  "postmaster",
  "abuse",
  "mailer-daemon",
  "spam",
]);

// Allowed business shared role prefixes (allowed with "risky" flag)
export const FLAGGED_ROLE_PREFIXES = new Set([
  "info",
  "sales",
  "support",
  "contact",
  "admin",
  "orders",
  "purchasing",
  "buyer",
]);

export type EmailValidationStatus = "valid" | "risky" | "invalid" | "unknown";

export interface EmailHygieneResult {
  isValid: boolean;
  status: EmailValidationStatus;
  reason: string;
  isRole: boolean;
  isDisposable: boolean;
  hasMxRecord: boolean;
  mxHost?: string;
}

export interface EmailVerifierPlugin {
  id: string;
  name: string;
  verify(email: string, apiKey: string): Promise<{ status: EmailValidationStatus; reason: string }>;
}

// Optional ZeroBounce / Hunter verifiers (pluggable, disabled unless API key provided)
export const PLUGGABLE_VERIFIERS: Record<string, EmailVerifierPlugin> = {
  zerobounce: {
    id: "zerobounce",
    name: "ZeroBounce API",
    async verify(email: string, apiKey: string) {
      if (!apiKey) return { status: "unknown", reason: "ZeroBounce API key not configured" };
      try {
        const res = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "valid") return { status: "valid", reason: "ZeroBounce verified deliverable" };
          if (data.status === "invalid") return { status: "invalid", reason: `ZeroBounce flagged: ${data.sub_status}` };
          return { status: "risky", reason: `ZeroBounce flagged as catch-all / risky` };
        }
      } catch {}
      return { status: "unknown", reason: "ZeroBounce check timed out" };
    },
  },
  hunter: {
    id: "hunter",
    name: "Hunter.io Email Verifier",
    async verify(email: string, apiKey: string) {
      if (!apiKey) return { status: "unknown", reason: "Hunter.io API key not configured" };
      try {
        const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const result = data.data?.result;
          if (result === "deliverable") return { status: "valid", reason: "Hunter.io verified deliverable" };
          if (result === "undeliverable") return { status: "invalid", reason: "Hunter.io marked undeliverable" };
          return { status: "risky", reason: `Hunter.io result: ${result}` };
        }
      } catch {}
      return { status: "unknown", reason: "Hunter.io verification timed out" };
    },
  },
};

/**
 * Validates an email using RFC-822 syntax, disposable domain list,
 * role-address filter, and live DNS MX record lookup.
 */
export async function validateEmailHygiene(
  email: string,
  thirdPartyConfig?: { provider: "zerobounce" | "hunter"; apiKey: string }
): Promise<EmailHygieneResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Syntax check
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(cleanEmail)) {
    return {
      isValid: false,
      status: "invalid",
      reason: "syntax_invalid",
      isRole: false,
      isDisposable: false,
      hasMxRecord: false,
    };
  }

  const [localPart, domain] = cleanEmail.split("@");

  // 2. Disposable domain check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      status: "invalid",
      reason: "disposable_domain",
      isRole: false,
      isDisposable: true,
      hasMxRecord: false,
    };
  }

  // 3. Blocked role address check (noreply@ etc.)
  if (BLOCKED_ROLE_PREFIXES.has(localPart)) {
    return {
      isValid: false,
      status: "invalid",
      reason: "role_based_rejected",
      isRole: true,
      isDisposable: false,
      hasMxRecord: false,
    };
  }

  const isFlaggedRole = FLAGGED_ROLE_PREFIXES.has(localPart);

  // 4. DNS MX Lookup
  let hasMx = false;
  let mxHost: string | undefined;
  let dnsTimedOut = false;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 5000)
    );
    const mxRecords = await Promise.race([dns.resolveMx(domain), timeoutPromise]);

    if (mxRecords && mxRecords.length > 0) {
      hasMx = true;
      mxRecords.sort((a, b) => a.priority - b.priority);
      mxHost = mxRecords[0].exchange;
    }
  } catch (err: any) {
    if (err.message === "DNS_TIMEOUT") {
      dnsTimedOut = true;
    }
    hasMx = false;
  }

  if (dnsTimedOut) {
    return {
      isValid: false,
      status: "unknown",
      reason: "dns_timeout",
      isRole: isFlaggedRole,
      isDisposable: false,
      hasMxRecord: false,
    };
  }

  if (!hasMx) {
    return {
      isValid: false,
      status: "invalid",
      reason: "no_mx_record",
      isRole: isFlaggedRole,
      isDisposable: false,
      hasMxRecord: false,
    };
  }

  // 5. Optional Pluggable 3rd-Party Verifier (if user supplied credentials)
  if (thirdPartyConfig?.apiKey && PLUGGABLE_VERIFIERS[thirdPartyConfig.provider]) {
    const plugin = PLUGGABLE_VERIFIERS[thirdPartyConfig.provider];
    const pluginResult = await plugin.verify(cleanEmail, thirdPartyConfig.apiKey);
    return {
      isValid: pluginResult.status === "valid" || pluginResult.status === "risky",
      status: pluginResult.status,
      reason: pluginResult.reason,
      isRole: isFlaggedRole,
      isDisposable: false,
      hasMxRecord: true,
      mxHost,
    };
  }

  return {
    isValid: true,
    status: isFlaggedRole ? "risky" : "valid",
    reason: isFlaggedRole ? "role_based_deliverable" : "passed_mx_and_syntax",
    isRole: isFlaggedRole,
    isDisposable: false,
    hasMxRecord: true,
    mxHost,
  };
}
