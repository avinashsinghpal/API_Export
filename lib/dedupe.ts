/**
 * Calculates the Jaro-Winkler similarity between two strings (0.0 to 1.0).
 * Used for detecting duplicate company names in the same geographic region.
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();

  const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / a.length +
      matches / b.length +
      (matches - transpositions / 2) / matches) /
    3;

  // Winkler prefix scale
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Checks if a candidate company name is a probable duplicate (threshold >= 0.92)
 * among existing companies in the same city or state.
 */
export function isFuzzyDuplicate(
  candidateCompany: string,
  existingCompanies: string[],
  threshold = 0.92
): { isDuplicate: boolean; matchedWith?: string; similarity?: number } {
  const normCandidate = candidateCompany.toLowerCase().trim();

  for (const existing of existingCompanies) {
    const normExisting = existing.toLowerCase().trim();
    if (normCandidate === normExisting) {
      return { isDuplicate: true, matchedWith: existing, similarity: 1.0 };
    }

    const similarity = jaroWinklerSimilarity(normCandidate, normExisting);
    if (similarity >= threshold) {
      return { isDuplicate: true, matchedWith: existing, similarity };
    }
  }

  return { isDuplicate: false };
}
