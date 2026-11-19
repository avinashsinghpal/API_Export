import dns from "dns/promises";

// Common disposable / temp email domains
const DISPOSABLE_DOMAINS = new Set([
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

// Generic role prefixes
const BLOCKED_ROLE_PREFIXES = new Set([
  "noreply",
  "no-reply",
  "postmaster",
  "abuse",
  "mailer-daemon",
  "spam",
]);

const FLAGGED_ROLE_PREFIXES = new Set([
  "info",
  "sales",
  "support",
  "contact",
  "admin",
  "orders",
  "purchasing",
  "buyer",
]);

export interface EmailHygieneResult {
  isValid: boolean;
  status: "VALID" | "INVALID" | "RISKY" | "CATCH_ALL";
  reason: string;
  isRole: boolean;
  isDisposable: boolean;
  hasMxRecord: boolean;
  mxHost?: string;
}

/**
 * Validates an email using RFC-822 syntax, disposable domain list,
 * role-address filter, and live DNS MX record lookup.
 */
export async function validateEmailHygiene(
  email: string,
  thirdPartyApiKey?: string
): Promise<EmailHygieneResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Syntax check
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(cleanEmail)) {
    return {
      isValid: false,
      status: "INVALID",
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
      status: "INVALID",
      reason: "disposable_domain",
      isRole: false,
      isDisposable: true,
      hasMxRecord: false,
    };
  }

  // 3. Role address check
  if (BLOCKED_ROLE_PREFIXES.has(localPart)) {
    return {
      isValid: false,
      status: "INVALID",
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
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      hasMx = true;
      mxRecords.sort((a, b) => a.priority - b.priority);
      mxHost = mxRecords[0].exchange;
    }
  } catch (err) {
    hasMx = false;
  }

  if (!hasMx) {
    return {
      isValid: false,
      status: "INVALID",
      reason: "no_mx_record",
      isRole: isFlaggedRole,
      isDisposable: false,
      hasMxRecord: false,
    };
  }

  // 5. Third-party verifier (ZeroBounce / Hunter Verifier stub if configured)
  if (thirdPartyApiKey) {
    // If user provided a ZeroBounce / Hunter API key, we can query it
    // Defaulting to valid with live MX
  }

  return {
    isValid: true,
    status: isFlaggedRole ? "RISKY" : "VALID",
    reason: isFlaggedRole ? "role_based_deliverable" : "passed_mx_and_syntax",
    isRole: isFlaggedRole,
    isDisposable: false,
    hasMxRecord: true,
    mxHost,
  };
}
