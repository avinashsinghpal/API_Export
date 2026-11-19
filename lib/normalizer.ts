import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normalizes a website or URL string down to its canonical root domain.
 * e.g. "https://www.serenitysoundwholesale.com/catalog?page=1" -> "serenitysoundwholesale.com"
 */
export function normalizeDomain(urlOrDomain: string): string {
  if (!urlOrDomain) return "";
  let clean = urlOrDomain.trim().toLowerCase();

  // Strip protocol
  clean = clean.replace(/^https?:\/\//, "");

  // Strip www.
  clean = clean.replace(/^www\./, "");

  // Strip path, query params, hash
  clean = clean.split("/")[0].split("?")[0].split("#")[0];

  // Strip port
  clean = clean.split(":")[0];

  return clean;
}

/**
 * Normalizes company name by trimming, removing excessive punctuation,
 * and normalizing spacing.
 */
export function normalizeCompanyName(company: string): string {
  if (!company) return "";
  return company
    .trim()
    .replace(/\s+/g, " ")
    .replace(/["']/g, "");
}

/**
 * Normalizes an email address to lowercase and trimmed.
 */
export function normalizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Normalizes phone numbers into international E.164 format.
 * Defaults to "US" if no country prefix is detected.
 */
export function normalizePhone(phone: string, defaultCountry: "US" | "IN" = "US"): string {
  if (!phone) return "";
  try {
    const parsed = parsePhoneNumberFromString(phone, defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.format("E.164");
    }
  } catch (err) {
    // Fall back to clean digits
  }
  return phone.trim();
}

const US_STATES_MAP: Record<string, string> = {
  alabama: "Alabama", al: "Alabama",
  alaska: "Alaska", ak: "Alaska",
  arizona: "Arizona", az: "Arizona",
  arkansas: "Arkansas", ar: "Arkansas",
  california: "California", ca: "California",
  colorado: "Colorado", co: "Colorado",
  connecticut: "Connecticut", ct: "Connecticut",
  delaware: "Delaware", de: "Delaware",
  florida: "Florida", fl: "Florida",
  georgia: "Georgia", ga: "Georgia",
  hawaii: "Hawaii", hi: "Hawaii",
  idaho: "Idaho", id: "Idaho",
  illinois: "Illinois", il: "Illinois",
  indiana: "Indiana", in: "Indiana",
  iowa: "Iowa", ia: "Iowa",
  kansas: "Kansas", ks: "Kansas",
  kentucky: "Kentucky", ky: "Kentucky",
  louisiana: "Louisiana", la: "Louisiana",
  maine: "Maine", me: "Maine",
  maryland: "Maryland", md: "Maryland",
  massachusetts: "Massachusetts", ma: "Massachusetts",
  michigan: "Michigan", mi: "Michigan",
  minnesota: "Minnesota", mn: "Minnesota",
  mississippi: "Mississippi", ms: "Mississippi",
  missouri: "Missouri", mo: "Missouri",
  montana: "Montana", mt: "Montana",
  nebraska: "Nebraska", ne: "Nebraska",
  nevada: "Nevada", nv: "Nevada",
  "new hampshire": "New Hampshire", nh: "New Hampshire",
  "new jersey": "New Jersey", nj: "New Jersey",
  "new mexico": "New Mexico", nm: "New Mexico",
  "new york": "New York", ny: "New York",
  "north carolina": "North Carolina", nc: "North Carolina",
  "north dakota": "North Dakota", nd: "North Dakota",
  ohio: "Ohio", oh: "Ohio",
  oklahoma: "Oklahoma", ok: "Oklahoma",
  oregon: "Oregon", or: "Oregon",
  pennsylvania: "Pennsylvania", pa: "Pennsylvania",
  "rhode island": "Rhode Island", ri: "Rhode Island",
  "south carolina": "South Carolina", sc: "South Carolina",
  "south dakota": "South Dakota", sd: "South Dakota",
  tennessee: "Tennessee", tn: "Tennessee",
  texas: "Texas", tx: "Texas",
  utah: "Utah", ut: "Utah",
  vermont: "Vermont", vt: "Vermont",
  virginia: "Virginia", va: "Virginia",
  washington: "Washington", wa: "Washington",
  "west virginia": "West Virginia", wv: "West Virginia",
  wisconsin: "Wisconsin", wi: "Wisconsin",
  wyoming: "Wyoming", wy: "Wyoming",
};

export function normalizeState(stateOrCode: string): string {
  if (!stateOrCode) return "";
  const key = stateOrCode.trim().toLowerCase();
  return US_STATES_MAP[key] || stateOrCode.trim();
}

export function normalizeCountry(country: string): string {
  if (!country) return "United States";
  const clean = country.trim().toUpperCase();
  if (clean === "US" || clean === "USA" || clean === "UNITED STATES OF AMERICA") {
    return "United States";
  }
  if (clean === "IN" || clean === "IND" || clean === "BHARAT") {
    return "India";
  }
  return country.trim();
}
