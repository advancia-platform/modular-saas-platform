import https from "https";
import { performance } from "perf_hooks";

/**
 * Interface for Scam Adviser API response
 */
interface ScamAdviserResponse {
  score: number;
  risks?: string[];
  verdict?: string;
  details?: {
    sslValid?: boolean;
    domainAge?: number;
    countryCode?: string;
    ipReputation?: number;
  };
}

/**
 * Interface for our standardized trust report
 */
export interface TrustReport {
  scamAdviserScore: number;
  sslValid: boolean;
  verifiedBusiness: boolean;
  status: "pending" | "verified" | "suspicious" | "high-risk";
  domainAgeMonths: number;
  lastChecked: string;
  trancoRank?: number; // Tranco traffic rank (lower = more traffic)
  trafficLevel?: "very-high" | "high" | "medium" | "low" | "minimal";
}

/**
 * Scam Adviser Service for domain trust verification
 * Note: This is a simplified implementation - in production you would use actual Scam Adviser API
 */
export class ScamAdviserService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private cache = new Map<string, { data: TrustReport; timestamp: number }>();
  // In-flight promise dedup to avoid duplicate work on same domain
  private inflight = new Map<string, Promise<TrustReport>>();
  // Simple rolling metrics (not persisted)
  private metrics: { total: number; cacheHits: number; avgMs: number } = {
    total: 0,
    cacheHits: 0,
    avgMs: 0,
  };

  /**
   * Get trust report for a domain
   */
  async getTrustReport(domain: string): Promise<TrustReport> {
    try {
      const start = performance.now();
      // Check cache first
      const cached = this.cache.get(domain);
      if (
        cached &&
        Date.now() - cached.timestamp < ScamAdviserService.CACHE_DURATION
      ) {
        this.recordMetrics(performance.now() - start, true);
        return cached.data;
      }

      // Concurrency dedup: return existing in-flight promise if present
      const existing = this.inflight.get(domain);
      if (existing) {
        const result = await existing;
        this.recordMetrics(performance.now() - start, false);
        return result;
      }

      const p = this.generateTrustReport(domain)
        .then((report) => {
          // Cache fresh result
          this.cache.set(domain, { data: report, timestamp: Date.now() });
          return report;
        })
        .finally(() => {
          this.inflight.delete(domain);
        });
      this.inflight.set(domain, p);
      const report = await p;
      this.recordMetrics(performance.now() - start, false);
      // Generate trust report (simplified for demo purposes)
      return report;
    } catch (error) {
      console.error(`Error getting trust report for ${domain}:`, error);
      throw new Error("Failed to retrieve trust report");
    }
  }

  /**
   * Generate trust report based on domain analysis
   * Note: This is a simplified implementation for demo purposes
   */
  private async generateTrustReport(domain: string): Promise<TrustReport> {
    // Wrap SSL check with timeout + fallback
    // Basic SSL check
    const sslValid = await this.withTimeout<boolean>(
      this.checkSSL(domain),
      5000,
      false,
    );

    // Get Tranco rank for traffic analysis
    const trancoRank = await this.withTimeout<number | null>(
      this.getTrancoRank(domain),
      5000,
      null,
    );

    // Simulate domain age calculation
    const domainAgeMonths = this.estimateDomainAge(domain);

    // Calculate base score
    let scamAdviserScore = 50; // Base score

    // SSL Certificate (20 points)
    if (sslValid) {
      scamAdviserScore += 20;
    }

    // Domain Age (30 points max, 1 per month)
    scamAdviserScore += Math.min(domainAgeMonths, 30);

    // Tranco rank bonus (up to 15 points for high-traffic sites)
    if (trancoRank !== null) {
      if (trancoRank <= 1000)
        scamAdviserScore += 15; // Top 1K sites
      else if (trancoRank <= 10000)
        scamAdviserScore += 12; // Top 10K
      else if (trancoRank <= 100000)
        scamAdviserScore += 8; // Top 100K
      else if (trancoRank <= 1000000) scamAdviserScore += 4; // Top 1M
    }

    // Known safe domains get bonus points
    if (this.isKnownSafeDomain(domain)) {
      scamAdviserScore = Math.min(scamAdviserScore + 25, 100);
    }

    // Determine status and business verification
    const status = this.determineStatus(scamAdviserScore);
    const verifiedBusiness = scamAdviserScore >= 80 && domainAgeMonths >= 12;

    // Determine traffic level based on Tranco rank
    const trafficLevel = this.getTrafficLevel(trancoRank);

    const result: TrustReport = {
      scamAdviserScore: Math.max(0, Math.min(100, scamAdviserScore)),
      sslValid,
      verifiedBusiness,
      status,
      domainAgeMonths,
      lastChecked: new Date().toISOString(),
      trancoRank: trancoRank ?? undefined,
      trafficLevel,
    };
    this.logReport(domain, result);
    return result;
  }

  /**
   * Get Tranco rank for a domain (traffic ranking)
   * Tranco is a research-oriented top sites ranking
   * @see https://tranco-list.eu/
   */
  private async getTrancoRank(domain: string): Promise<number | null> {
    try {
      return new Promise((resolve) => {
        const options = {
          hostname: "tranco-list.eu",
          path: `/api/ranks/domain/${encodeURIComponent(domain)}`,
          method: "GET",
          timeout: 5000,
          headers: {
            Accept: "application/json",
            "User-Agent": "AdvanciaPayLedger/1.0",
          },
        };

        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              if (res.statusCode === 200) {
                const json = JSON.parse(data);
                // Tranco API returns { ranks: [{ date: "...", rank: 123 }] }
                if (json.ranks && json.ranks.length > 0) {
                  resolve(json.ranks[0].rank);
                } else {
                  resolve(null); // Domain not in Tranco list
                }
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });
        });

        req.on("error", () => resolve(null));
        req.on("timeout", () => {
          req.destroy();
          resolve(null);
        });

        req.end();
      });
    } catch {
      return null;
    }
  }

  /**
   * Determine traffic level based on Tranco rank
   */
  private getTrafficLevel(rank: number | null): TrustReport["trafficLevel"] {
    if (rank === null) return "minimal";
    if (rank <= 1000) return "very-high";
    if (rank <= 10000) return "high";
    if (rank <= 100000) return "medium";
    if (rank <= 1000000) return "low";
    return "minimal";
  }

  /**
   * Check if domain has valid SSL certificate
   */
  private async checkSSL(domain: string): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const options = {
          hostname: domain,
          port: 443,
          method: "HEAD",
          timeout: 5000,
          rejectUnauthorized: true, // This will fail if SSL is invalid
        };

        const req = https.request(options, (res) => {
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        });

        req.on("error", () => resolve(false));
        req.on("timeout", () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    } catch {
      return false;
    }
  }

  /**
   * Estimate domain age in months (simplified)
   */
  private estimateDomainAge(domain: string): number {
    // This is a simplified estimation - in production you'd use WHOIS data
    const domainHashes = {
      "google.com": 300,
      "microsoft.com": 360,
      "github.com": 200,
      "stackoverflow.com": 180,
      "example.com": 240,
    };

    // Check if it's a known domain
    if (domainHashes[domain]) {
      return domainHashes[domain];
    }

    // Generate pseudo-random but consistent age based on domain
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      const char = domain.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to age between 1-36 months
    return Math.abs(hash % 36) + 1;
  }

  /**
   * Check if domain is in known safe list
   */
  private isKnownSafeDomain(domain: string): boolean {
    const safeDomains = [
      "google.com",
      "microsoft.com",
      "github.com",
      "stackoverflow.com",
      "mozilla.org",
      "w3.org",
      "example.com",
    ];

    return safeDomains.some(
      (safeDomain) =>
        domain === safeDomain || domain.endsWith(`.${safeDomain}`),
    );
  }

  /**
   * Determine status based on score
   */
  private determineStatus(score: number): TrustReport["status"] {
    if (score >= 85) return "verified";
    if (score >= 70) return "pending";
    if (score >= 50) return "suspicious";
    return "high-risk";
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  /** Utility: timeout wrapper */
  private withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return new Promise((resolve) => {
      const t = setTimeout(() => resolve(fallback), ms);
      p.then((v) => {
        clearTimeout(t);
        resolve(v);
      }).catch(() => {
        clearTimeout(t);
        resolve(fallback);
      });
    });
  }

  /** Metrics recorder */
  private recordMetrics(durationMs: number, cacheHit: boolean) {
    this.metrics.total += 1;
    if (cacheHit) this.metrics.cacheHits += 1;
    // exponential moving average for simplicity
    const alpha = 0.2;
    this.metrics.avgMs =
      this.metrics.avgMs === 0
        ? durationMs
        : this.metrics.avgMs * (1 - alpha) + durationMs * alpha;
  }

  /** Simple structured log for debugging performance */
  private logReport(domain: string, report: TrustReport) {
    try {
      const cacheHit = this.cache.has(domain);
      console.log(
        `[trust] domain=${domain} score=${report.scamAdviserScore} status=${report.status} ageMonths=${report.domainAgeMonths} ssl=${report.sslValid} verified=${report.verifiedBusiness} trancoRank=${report.trancoRank ?? "N/A"} traffic=${report.trafficLevel} cacheHit=${cacheHit}`,
      );
    } catch {}
  }

  /** Expose metrics summary (could be used in /status later) */
  getMetrics() {
    return {
      totalRequests: this.metrics.total,
      cacheHitRate:
        this.metrics.total === 0
          ? 0
          : +(this.metrics.cacheHits / this.metrics.total).toFixed(3),
      avgDurationMs: Math.round(this.metrics.avgMs),
      cacheSize: this.cache.size,
    };
  }
}

// Export singleton instance
export const scamAdviserService = new ScamAdviserService();
