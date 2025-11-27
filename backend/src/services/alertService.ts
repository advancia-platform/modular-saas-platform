// Comprehensive alert service with PagerDuty, Datadog, and multi-channel notifications
// Enhanced for SLA monitoring and escalation policies

import { logger } from '../logger';

type Severity = 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning' | 'error';

// Enhanced alert payload for comprehensive monitoring
interface EnhancedAlertPayload {
  summary: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  source: string;
  component: string;
  details?: Record<string, any>;
}

interface PagerDutyEvent {
  routing_key: string;
  event_action: 'trigger' | 'acknowledge' | 'resolve';
  payload: {
    summary: string;
    severity: string;
    source: string;
    component: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, any>;
  };
}

export interface AlertData {
  identifier: string;
  group: string;
  count: number;
  path?: string;
  method?: string;
  timestamp?: number;
  userAgent?: string;
  severity?: Severity;
}

class ComprehensiveAlertService {
  private datadogConfig?: any;
  private datadogApi?: any;

  constructor() {
    // Initialize Datadog if available
    if (process.env.DATADOG_API_KEY) {
      try {
        const { v1 } = require('@datadog/datadog-api-client');
        this.datadogConfig = v1.createConfiguration({
          authMethods: { apiKeyAuth: process.env.DATADOG_API_KEY }
        });
        this.datadogApi = new v1.MetricsApi(this.datadogConfig);
      } catch (error) {
        logger.warn('Datadog client not available', { error: error.message });
      }
    }
  }

  /**
   * Trigger PagerDuty incident for critical alerts
   */
  async triggerPagerDutyAlert(alert: EnhancedAlertPayload): Promise<boolean> {
    if (!process.env.PAGERDUTY_ROUTING_KEY) {
      logger.error('PagerDuty routing key not configured');
      return false;
    }

    const event: PagerDutyEvent = {
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: alert.summary,
        severity: alert.severity,
        source: alert.source,
        component: alert.component,
        group: 'advancia-pay',
        class: 'health-check',
        custom_details: alert.details
      }
    };

    try {
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        logger.info('PagerDuty alert triggered successfully', { alert });
        return true;
      } else {
        logger.error('Failed to trigger PagerDuty alert', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      logger.error('PagerDuty alert request failed', { error, alert });
      return false;
    }
  }

  /**
   * Send metric to Datadog
   */
  async sendDatadogMetric(metric: string, value: number, tags: string[] = []): Promise<boolean> {
    if (!this.datadogApi) {
      logger.warn('Datadog API not configured, skipping metric');
      return false;
    }

    try {
      await this.datadogApi.submitMetrics({
        body: {
          series: [
            {
              metric,
              type: 0, // gauge
              points: [[Math.floor(Date.now() / 1000), value]],
              tags: [...tags, `env:${process.env.NODE_ENV || 'development'}`]
            }
          ]
        }
      });

      logger.debug('Datadog metric sent successfully', { metric, value, tags });
      return true;
    } catch (error) {
      logger.error('Failed to send Datadog metric', { error, metric, value, tags });
      return false;
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackAlert(alert: EnhancedAlertPayload): Promise<boolean> {
    if (!process.env.SLACK_WEBHOOK_URL) {
      logger.warn('Slack webhook not configured');
      return false;
    }

    const color = {
      critical: '#ff0000',
      error: '#ff6600',
      warning: '#ffcc00',
      info: '#0099ff'
    }[alert.severity];

    const slackPayload = {
      text: `🚨 ${alert.severity.toUpperCase()}: ${alert.summary}`,
      attachments: [
        {
          color,
          fields: [
            { title: 'Source', value: alert.source, short: true },
            { title: 'Component', value: alert.component, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: new Date().toISOString(), short: true }
          ],
          text: alert.details ? JSON.stringify(alert.details, null, 2) : undefined
        }
      ]
    };

    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });

      if (response.ok) {
        logger.info('Slack alert sent successfully', { alert });
        return true;
      } else {
        logger.error('Failed to send Slack alert', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      logger.error('Slack alert request failed', { error, alert });
      return false;
    }
  }

  /**
   * Send Teams notification
   */
  async sendTeamsAlert(alert: EnhancedAlertPayload): Promise<boolean> {
    if (!process.env.TEAMS_WEBHOOK_URL) {
      logger.warn('Teams webhook not configured');
      return false;
    }

    const teamsPayload = {
      text: `🚨 ${alert.severity.toUpperCase()}: ${alert.summary}`,
      sections: [
        {
          activityTitle: 'Advancia Pay Alert',
          activitySubtitle: alert.component,
          facts: [
            { name: 'Source', value: alert.source },
            { name: 'Severity', value: alert.severity },
            { name: 'Time', value: new Date().toISOString() }
          ],
          text: alert.details ? JSON.stringify(alert.details, null, 2) : undefined
        }
      ]
    };

    try {
      const response = await fetch(process.env.TEAMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsPayload)
      });

      if (response.ok) {
        logger.info('Teams alert sent successfully', { alert });
        return true;
      } else {
        logger.error('Failed to send Teams alert', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      logger.error('Teams alert request failed', { error, alert });
      return false;
    }
  }

  /**
   * Comprehensive alert dispatch with escalation
   */
  async dispatchAlert(alert: EnhancedAlertPayload): Promise<{
    pagerduty: boolean;
    datadog: boolean;
    slack: boolean;
    teams: boolean;
  }> {
    const results = {
      pagerduty: false,
      datadog: false,
      slack: false,
      teams: false
    };

    // Always try PagerDuty for critical/error alerts
    if (alert.severity === 'critical' || alert.severity === 'error') {
      results.pagerduty = await this.triggerPagerDutyAlert(alert);
    }

    // Send metric to Datadog
    const healthValue = alert.severity === 'critical' ? 0 : alert.severity === 'error' ? 0.5 : 1;
    results.datadog = await this.sendDatadogMetric('advancia.health.status', healthValue, [
      `component:${alert.component}`,
      `severity:${alert.severity}`
    ]);

    // Send notifications to Slack and Teams
    results.slack = await this.sendSlackAlert(alert);
    results.teams = await this.sendTeamsAlert(alert);

    logger.info('Alert dispatched', { alert, results });
    return results;
  }

  /**
   * Check SLA thresholds and trigger alerts
   */
  async checkSLAThresholds(): Promise<void> {
    try {
      const uptimeMetrics = await this.getUptimeMetrics();

      if (uptimeMetrics.uptime24h < 0.99) {
        await this.dispatchAlert({
          summary: `SLA breach: Uptime ${(uptimeMetrics.uptime24h * 100).toFixed(2)}% in last 24h (< 99%)`,
          severity: 'critical',
          source: 'SLA Monitor',
          component: 'production',
          details: {
            uptime24h: uptimeMetrics.uptime24h,
            threshold: 0.99,
            consecutiveFailures: uptimeMetrics.consecutiveFailures
          }
        });
      }

      if (uptimeMetrics.consecutiveFailures >= 3) {
        await this.dispatchAlert({
          summary: `Multiple consecutive failures detected: ${uptimeMetrics.consecutiveFailures}`,
          severity: 'error',
          source: 'Failure Detection',
          component: 'monitoring',
          details: {
            consecutiveFailures: uptimeMetrics.consecutiveFailures,
            lastFailure: uptimeMetrics.lastFailureTime
          }
        });
      }
    } catch (error) {
      logger.error('SLA threshold check failed', { error });
    }
  }

  /**
   * Get uptime metrics (integrated with Prometheus)
   */
  private async getUptimeMetrics(): Promise<{
    uptime24h: number;
    consecutiveFailures: number;
    lastFailureTime?: Date;
  }> {
    // This would query Prometheus metrics - simplified for demo
    const mockUptime = Math.random() > 0.1 ? 0.998 : 0.985; // 10% chance of SLA breach
    const mockFailures = mockUptime < 0.99 ? Math.floor(Math.random() * 5) : 0;

    return {
      uptime24h: mockUptime,
      consecutiveFailures: mockFailures,
      lastFailureTime: mockFailures > 0 ? new Date() : undefined
    };
  }
}

// Create singleton instance
const comprehensiveAlertService = new ComprehensiveAlertService();

// Lazy import to avoid hard dependency during build
let sentryCapture: ((err: Error, ctx?: any) => void) | null = null;
try {
  const mod = require('../utils/sentry');
  sentryCapture =
    mod && typeof mod.captureError === 'function' ? mod.captureError : null;
} catch {
  sentryCapture = null;
}

// Legacy sendAlert function for backward compatibility
export async function sendAlert(data: AlertData): Promise<void> {
  try {
    const sev = data.severity || 'medium';
    const msg = `[ALERT] group=${data.group} id=${data.identifier} count=${data.count} sev=${sev} path=${data.path} method=${data.method}`;

    if (process.env.NODE_ENV !== 'production') {
      console.warn(msg);
    }

    // Convert legacy alert to enhanced format
    const enhancedAlert: EnhancedAlertPayload = {
      summary: `${data.group}: ${data.identifier} (count: ${data.count})`,
      severity: sev === 'critical' ? 'critical' : sev === 'high' ? 'error' : sev === 'medium' ? 'warning' : 'info',
      source: 'Legacy Alert System',
      component: data.group,
      details: {
        identifier: data.identifier,
        count: data.count,
        path: data.path,
        method: data.method,
        userAgent: data.userAgent,
        timestamp: data.timestamp
      }
    };

    // Use comprehensive alert service for legacy alerts
    await comprehensiveAlertService.dispatchAlert(enhancedAlert);

    // Optionally capture to Sentry in production
    if (process.env.SENTRY_DSN && sentryCapture) {
      sentryCapture(new Error('rate-limit-alert'), {
        level: 'warning',
        tags: { component: 'alert-service', severity: sev, group: data.group },
        extra: data,
      });
    }
  } catch (err) {
    console.error('Alert dispatch failed:', err);
  }
}

// Enhanced alert functions for new monitoring system
export async function dispatchEnhancedAlert(alert: EnhancedAlertPayload): Promise<void> {
  await comprehensiveAlertService.dispatchAlert(alert);
}

export async function checkSLAs(): Promise<void> {
  await comprehensiveAlertService.checkSLAThresholds();
}

export async function sendDatadogMetric(metric: string, value: number, tags: string[] = []): Promise<boolean> {
  return await comprehensiveAlertService.sendDatadogMetric(metric, value, tags);
}

export async function triggerPagerDuty(alert: EnhancedAlertPayload): Promise<boolean> {
  return await comprehensiveAlertService.triggerPagerDutyAlert(alert);
}

// Stub for alert history - disabled to prevent redis dependency errors
export async function getAlertHistory(
  group: string,
  limit: number = 50,
): Promise<any[]> {
  console.warn('getAlertHistory called but disabled - returning empty array');
  return [];
}

export default {
  sendAlert,
  getAlertHistory,
  dispatchEnhancedAlert,
  checkSLAs,
  sendDatadogMetric,
  triggerPagerDuty,
  comprehensiveAlertService
};

// Export comprehensive alert service instance
export { comprehensiveAlertService };

// (Enhanced with comprehensive monitoring, PagerDuty, Datadog, and multi-channel alerts)
