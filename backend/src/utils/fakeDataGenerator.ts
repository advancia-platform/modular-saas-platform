import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { envInspector } from "./envInspector";

/**
 * Fake data generator for development environments
 * Generates realistic test data while maintaining referential integrity
 */

export class FakeDataGenerator {
  private isDevelopment = envInspector.isDevelopment();

  constructor() {
    if (!this.isDevelopment) {
      throw new Error("FakeDataGenerator should only be used in development");
    }
  }

  /**
   * Generate fake user data
   */
  async generateUser(overrides: Partial<any> = {}): Promise<any> {
    const password = overrides.password || faker.internet.password(12);
    const passwordHash = await bcrypt.hash(password, 10);

    return {
      email: overrides.email || faker.internet.email(),
      username: overrides.username || faker.internet.userName(),
      passwordHash,
      firstName: overrides.firstName || faker.person.firstName(),
      lastName: overrides.lastName || faker.person.lastName(),
      usdBalance:
        overrides.usdBalance ||
        faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
      role: overrides.role || "user",
      emailVerified: overrides.emailVerified || faker.datatype.boolean(),
      twoFactorEnabled: overrides.twoFactorEnabled || faker.datatype.boolean(),
      createdAt: overrides.createdAt || faker.date.past(),
      updatedAt: overrides.updatedAt || new Date(),
      // Plain password for reference (only in dev)
      _plainPassword: password,
    };
  }

  /**
   * Generate fake admin user
   */
  async generateAdmin(overrides: Partial<any> = {}): Promise<any> {
    return this.generateUser({
      role: "admin",
      usdBalance: 0,
      emailVerified: true,
      twoFactorEnabled: true,
      ...overrides,
    });
  }

  /**
   * Generate fake transaction
   */
  generateTransaction(userId: string, overrides: Partial<any> = {}): any {
    const types = ["credit", "debit"];
    const type = overrides.type || faker.helpers.arrayElement(types);
    const amount =
      overrides.amount ||
      faker.number.float({ min: 1, max: 1000, precision: 0.01 });

    return {
      userId,
      amount,
      type,
      description:
        overrides.description || faker.finance.transactionDescription(),
      status: overrides.status || "completed",
      createdAt: overrides.createdAt || faker.date.recent(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  /**
   * Generate fake crypto order
   */
  generateCryptoOrder(userId: string, overrides: Partial<any> = {}): any {
    const cryptoTypes = ["BTC", "ETH", "USDT"];
    const cryptoType =
      overrides.cryptoType || faker.helpers.arrayElement(cryptoTypes);
    const usdAmount =
      overrides.usdAmount ||
      faker.number.float({ min: 10, max: 5000, precision: 0.01 });

    // Mock exchange rates
    const rates = { BTC: 45000, ETH: 2800, USDT: 1 };
    const exchangeRate = rates[cryptoType as keyof typeof rates];
    const cryptoAmount = usdAmount / exchangeRate;
    const processingFee = usdAmount * 0.025; // 2.5% fee

    return {
      userId,
      cryptoType,
      usdAmount,
      cryptoAmount: parseFloat(cryptoAmount.toFixed(8)),
      exchangeRate,
      processingFee: parseFloat(processingFee.toFixed(2)),
      totalUsd: usdAmount + processingFee,
      status:
        overrides.status ||
        faker.helpers.arrayElement([
          "pending",
          "processing",
          "completed",
          "failed",
        ]),
      adminAddress: this.generateWalletAddress(cryptoType),
      userWalletAddress: this.generateWalletAddress(cryptoType),
      transactionHash:
        overrides.transactionHash ||
        (faker.datatype.boolean()
          ? faker.string.hexadecimal({ length: 64 })
          : null),
      createdAt: overrides.createdAt || faker.date.recent(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  /**
   * Generate fake wallet address
   */
  private generateWalletAddress(cryptoType: string): string {
    switch (cryptoType) {
      case "BTC":
        return faker.string.hexadecimal({ length: 40, prefix: "1" });
      case "ETH":
        return faker.string.hexadecimal({ length: 40, prefix: "0x" });
      case "USDT":
        return faker.string.hexadecimal({ length: 40, prefix: "0x" });
      default:
        return faker.string.alphanumeric(42);
    }
  }

  /**
   * Generate fake payment data
   */
  generatePayment(userId: string, overrides: Partial<any> = {}): any {
    return {
      userId,
      amount:
        overrides.amount ||
        faker.number.float({ min: 1, max: 500, precision: 0.01 }),
      currency: overrides.currency || "USD",
      status:
        overrides.status ||
        faker.helpers.arrayElement([
          "pending",
          "completed",
          "failed",
          "refunded",
        ]),
      paymentMethod:
        overrides.paymentMethod ||
        faker.helpers.arrayElement(["card", "bank_transfer", "crypto"]),
      stripePaymentIntentId:
        overrides.stripePaymentIntentId ||
        `pi_${faker.string.alphanumeric(24)}`,
      description: overrides.description || faker.commerce.productDescription(),
      createdAt: overrides.createdAt || faker.date.recent(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  /**
   * Generate fake support ticket
   */
  generateSupportTicket(userId: string, overrides: Partial<any> = {}): any {
    const priorities = ["low", "medium", "high", "urgent"];
    const statuses = ["open", "in_progress", "resolved", "closed"];

    return {
      userId,
      subject: overrides.subject || faker.lorem.sentence(),
      message: overrides.message || faker.lorem.paragraphs(2),
      priority: overrides.priority || faker.helpers.arrayElement(priorities),
      status: overrides.status || faker.helpers.arrayElement(statuses),
      category:
        overrides.category ||
        faker.helpers.arrayElement([
          "technical",
          "billing",
          "account",
          "feature_request",
          "bug",
        ]),
      createdAt: overrides.createdAt || faker.date.recent(),
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  /**
   * Generate multiple fake users
   */
  async generateUsers(count: number = 5): Promise<any[]> {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.generateUser();
      users.push(user);
    }
    return users;
  }

  /**
   * Generate multiple fake transactions
   */
  generateTransactions(userIds: string[], countPerUser: number = 3): any[] {
    const transactions = [];
    for (const userId of userIds) {
      for (let i = 0; i < countPerUser; i++) {
        transactions.push(this.generateTransaction(userId));
      }
    }
    return transactions;
  }

  /**
   * Generate fake admin settings
   */
  generateAdminSettings(overrides: Partial<any> = {}): any {
    return {
      btcAddress: overrides.btcAddress || this.generateWalletAddress("BTC"),
      ethAddress: overrides.ethAddress || this.generateWalletAddress("ETH"),
      exchangeRateBtc:
        overrides.exchangeRateBtc ||
        faker.number.float({ min: 30000, max: 60000, precision: 0.01 }),
      exchangeRateEth:
        overrides.exchangeRateEth ||
        faker.number.float({ min: 2000, max: 4000, precision: 0.01 }),
      processingFeePercent:
        overrides.processingFeePercent ||
        faker.number.float({ min: 1, max: 5, precision: 0.1 }),
      maintenanceMode: overrides.maintenanceMode || false,
      allowRegistrations: overrides.allowRegistrations || true,
      allowCryptoOrders: overrides.allowCryptoOrders || true,
      updatedAt: overrides.updatedAt || new Date(),
    };
  }

  /**
   * Generate a complete fake dataset
   */
  async generateDataset(
    options: {
      users?: number;
      admins?: number;
      transactionsPerUser?: number;
      cryptoOrdersPerUser?: number;
      paymentsPerUser?: number;
      supportTicketsPerUser?: number;
    } = {},
  ): Promise<{
    users: any[];
    admins: any[];
    transactions: any[];
    cryptoOrders: any[];
    payments: any[];
    supportTickets: any[];
    adminSettings: any;
  }> {
    const {
      users: userCount = 10,
      admins: adminCount = 2,
      transactionsPerUser = 3,
      cryptoOrdersPerUser = 2,
      paymentsPerUser = 1,
      supportTicketsPerUser = 1,
    } = options;

    // Generate admin settings first
    const adminSettings = this.generateAdminSettings();

    // Generate admins
    const admins = [];
    for (let i = 0; i < adminCount; i++) {
      const admin = await this.generateAdmin({
        email: `admin${i + 1}@example.com`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });
      admins.push(admin);
    }

    // Generate regular users
    const users = [];
    for (let i = 0; i < userCount; i++) {
      const user = await this.generateUser();
      users.push(user);
    }

    // Generate related data
    const transactions = [];
    const cryptoOrders = [];
    const payments = [];
    const supportTickets = [];

    const allUsers = [...users, ...admins];

    for (const user of allUsers) {
      // Transactions
      for (let i = 0; i < transactionsPerUser; i++) {
        transactions.push(this.generateTransaction(user.id || user.email));
      }

      // Crypto orders
      for (let i = 0; i < cryptoOrdersPerUser; i++) {
        cryptoOrders.push(this.generateCryptoOrder(user.id || user.email));
      }

      // Payments
      for (let i = 0; i < paymentsPerUser; i++) {
        payments.push(this.generatePayment(user.id || user.email));
      }

      // Support tickets
      for (let i = 0; i < supportTicketsPerUser; i++) {
        supportTickets.push(this.generateSupportTicket(user.id || user.email));
      }
    }

    return {
      users,
      admins,
      transactions,
      cryptoOrders,
      payments,
      supportTickets,
      adminSettings,
    };
  }

  /**
   * Seed database with fake data
   */
  async seedDatabase(
    prisma: any,
    options?: Parameters<FakeDataGenerator["generateDataset"]>[0],
  ): Promise<void> {
    console.log("🌱 Seeding database with fake data...");

    const data = await this.generateDataset(options);

    // Insert admin settings
    await prisma.adminSettings.upsert({
      where: { id: 1 },
      update: data.adminSettings,
      create: { id: 1, ...data.adminSettings },
    });

    // Insert admins
    for (const admin of data.admins) {
      const { _plainPassword, ...adminData } = admin;
      await prisma.user.upsert({
        where: { email: adminData.email },
        update: adminData,
        create: adminData,
      });
      console.log(
        `✅ Created admin: ${adminData.email} (password: ${_plainPassword})`,
      );
    }

    // Insert users
    for (const user of data.users) {
      const { _plainPassword, ...userData } = user;
      await prisma.user.create({ data: userData });
    }

    // Insert transactions
    for (const transaction of data.transactions) {
      await prisma.transaction.create({ data: transaction });
    }

    // Insert crypto orders
    for (const order of data.cryptoOrders) {
      await prisma.cryptoOrder.create({ data: order });
    }

    // Insert payments
    for (const payment of data.payments) {
      await prisma.payment.create({ data: payment });
    }

    // Insert support tickets
    for (const ticket of data.supportTickets) {
      await prisma.supportTicket.create({ data: ticket });
    }

    console.log(
      `✅ Database seeded with ${data.users.length} users, ${data.admins.length} admins, and related data`,
    );
  }
}

// Export singleton instance for development
export const fakeDataGenerator = envInspector.isDevelopment()
  ? new FakeDataGenerator()
  : null;
