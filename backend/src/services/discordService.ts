import {
  Client,
  ColorResolvable,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";

/**
 * Discord Service for sending notifications to Discord channels
 */
class DiscordService {
  private client: Client | null = null;
  private isReady = false;
  private webhookUrl: string | null = null;

  /**
   * Initialize Discord bot client
   */
  async initialize(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;

    if (!token && !this.webhookUrl) {
      console.log(
        "[Discord] No bot token or webhook URL configured, skipping initialization",
      );
      return;
    }

    if (token) {
      try {
        this.client = new Client({
          intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        });

        this.client.on("ready", () => {
          this.isReady = true;
          console.log(`[Discord] Bot logged in as ${this.client?.user?.tag}`);
        });

        this.client.on("error", (error) => {
          console.error("[Discord] Client error:", error);
        });

        await this.client.login(token);
      } catch (error) {
        console.error("[Discord] Failed to initialize bot:", error);
      }
    }
  }

  /**
   * Send a message to a Discord channel via bot
   */
  async sendToChannel(
    channelId: string,
    message: string | EmbedBuilder,
  ): Promise<boolean> {
    if (!this.client || !this.isReady) {
      console.warn("[Discord] Bot not ready, cannot send message");
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        if (typeof message === "string") {
          await (channel as TextChannel).send(message);
        } else {
          await (channel as TextChannel).send({ embeds: [message] });
        }
        return true;
      }
      console.warn(
        `[Discord] Channel ${channelId} not found or not text-based`,
      );
      return false;
    } catch (error) {
      console.error("[Discord] Failed to send message:", error);
      return false;
    }
  }

  /**
   * Send a message via Discord webhook (no bot required)
   */
  async sendWebhook(content: string | object): Promise<boolean> {
    const webhookUrl = this.webhookUrl || process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("[Discord] No webhook URL configured");
      return false;
    }

    try {
      const body = typeof content === "string" ? { content } : content;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(
          "[Discord] Webhook failed:",
          response.status,
          await response.text(),
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("[Discord] Webhook error:", error);
      return false;
    }
  }

  /**
   * Send an alert notification (error, warning, etc.)
   */
  async sendAlert(options: {
    title: string;
    description: string;
    type: "error" | "warning" | "info" | "success";
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    channelId?: string;
  }): Promise<boolean> {
    const colors: Record<string, ColorResolvable> = {
      error: 0xff0000, // Red
      warning: 0xffa500, // Orange
      info: 0x0099ff, // Blue
      success: 0x00ff00, // Green
    };

    const emojis: Record<string, string> = {
      error: "🚨",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅",
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emojis[options.type]} ${options.title}`)
      .setDescription(options.description)
      .setColor(colors[options.type])
      .setTimestamp();

    if (options.fields) {
      options.fields.forEach((field) => {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline ?? false,
        });
      });
    }

    // Add environment info
    embed.setFooter({
      text: `Environment: ${process.env.NODE_ENV || "development"}`,
    });

    // If channel ID provided, use bot
    if (options.channelId && this.client && this.isReady) {
      return this.sendToChannel(options.channelId, embed);
    }

    // Otherwise use webhook
    return this.sendWebhook({
      embeds: [embed.toJSON()],
    });
  }

  /**
   * Send transaction notification
   */
  async sendTransactionAlert(transaction: {
    type: "deposit" | "withdrawal" | "transfer" | "payment";
    amount: string;
    currency: string;
    userId: string;
    status: "pending" | "completed" | "failed";
    transactionId?: string;
  }): Promise<boolean> {
    const typeEmojis: Record<string, string> = {
      deposit: "💰",
      withdrawal: "💸",
      transfer: "🔄",
      payment: "💳",
    };

    const statusColors: Record<string, ColorResolvable> = {
      pending: 0xffa500,
      completed: 0x00ff00,
      failed: 0xff0000,
    };

    const embed = new EmbedBuilder()
      .setTitle(
        `${typeEmojis[transaction.type]} Transaction ${transaction.status.toUpperCase()}`,
      )
      .setColor(statusColors[transaction.status])
      .addFields([
        { name: "Type", value: transaction.type.toUpperCase(), inline: true },
        {
          name: "Amount",
          value: `${transaction.amount} ${transaction.currency}`,
          inline: true,
        },
        {
          name: "Status",
          value: transaction.status.toUpperCase(),
          inline: true,
        },
        { name: "User ID", value: transaction.userId, inline: true },
      ])
      .setTimestamp();

    if (transaction.transactionId) {
      embed.addFields({
        name: "Transaction ID",
        value: transaction.transactionId,
        inline: false,
      });
    }

    return this.sendWebhook({ embeds: [embed.toJSON()] });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(alert: {
    event: string;
    severity: "low" | "medium" | "high" | "critical";
    details: string;
    ipAddress?: string;
    userId?: string;
  }): Promise<boolean> {
    const severityColors: Record<string, ColorResolvable> = {
      low: 0x00ff00,
      medium: 0xffa500,
      high: 0xff6600,
      critical: 0xff0000,
    };

    const severityEmojis: Record<string, string> = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      critical: "🔴",
    };

    const embed = new EmbedBuilder()
      .setTitle(
        `${severityEmojis[alert.severity]} Security Alert: ${alert.event}`,
      )
      .setDescription(alert.details)
      .setColor(severityColors[alert.severity])
      .addFields([
        { name: "Severity", value: alert.severity.toUpperCase(), inline: true },
      ])
      .setTimestamp();

    if (alert.ipAddress) {
      embed.addFields({
        name: "IP Address",
        value: alert.ipAddress,
        inline: true,
      });
    }

    if (alert.userId) {
      embed.addFields({ name: "User ID", value: alert.userId, inline: true });
    }

    return this.sendWebhook({ embeds: [embed.toJSON()] });
  }

  /**
   * Send system health notification
   */
  async sendHealthCheck(health: {
    status: "healthy" | "degraded" | "unhealthy";
    uptime: number;
    services: Array<{ name: string; status: "up" | "down" }>;
  }): Promise<boolean> {
    const statusColors: Record<string, ColorResolvable> = {
      healthy: 0x00ff00,
      degraded: 0xffa500,
      unhealthy: 0xff0000,
    };

    const statusEmojis: Record<string, string> = {
      healthy: "💚",
      degraded: "💛",
      unhealthy: "❤️",
    };

    const uptimeHours = Math.floor(health.uptime / 3600);
    const uptimeMinutes = Math.floor((health.uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setTitle(`${statusEmojis[health.status]} System Health Check`)
      .setColor(statusColors[health.status])
      .addFields([
        { name: "Status", value: health.status.toUpperCase(), inline: true },
        {
          name: "Uptime",
          value: `${uptimeHours}h ${uptimeMinutes}m`,
          inline: true,
        },
      ])
      .setTimestamp();

    // Add service statuses
    const servicesStatus = health.services
      .map((s) => `${s.status === "up" ? "✅" : "❌"} ${s.name}`)
      .join("\n");

    if (servicesStatus) {
      embed.addFields({
        name: "Services",
        value: servicesStatus,
        inline: false,
      });
    }

    return this.sendWebhook({ embeds: [embed.toJSON()] });
  }

  /**
   * Disconnect the bot
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.isReady = false;
      console.log("[Discord] Bot disconnected");
    }
  }

  /**
   * Check if Discord service is available
   */
  isAvailable(): boolean {
    return this.isReady || !!this.webhookUrl;
  }
}

// Export singleton instance
export const discordService = new DiscordService();

// Export class for testing
export { DiscordService };
