export type BandwidthState = "strong" | "degraded" | "critical";

export class BandwidthService {
  async readConnectionState(): Promise<BandwidthState> {
    const connection = (navigator as Navigator & {
      connection?: { downlink?: number; effectiveType?: string };
    }).connection as
      | { downlink?: number; effectiveType?: string }
      | undefined;

    if (!connection) return "strong";
    if (connection.effectiveType === "2g" || (connection.downlink ?? 10) < 0.5) return "critical";
    if (connection.effectiveType === "3g" || (connection.downlink ?? 10) < 1.5) return "degraded";
    return "strong";
  }
}

export const bandwidthService = new BandwidthService();
