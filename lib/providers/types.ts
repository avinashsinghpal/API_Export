import { RawLead, DiscoverySearchInput } from "../validations";

export interface DiscoveryProvider {
  name: string;
  id: string;
  search(input: DiscoverySearchInput): AsyncIterable<RawLead>;
}

export interface ProviderCostEstimate {
  providerId: string;
  name: string;
  estimatedCredits: number;
  costUSD: number;
}
