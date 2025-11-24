export { withDefaults } from "./prismaHelpers";

// Optional: curated delegates can be exported here via withDefaults.
// Only export delegates that exist in the Prisma schema to avoid type errors.
// Example usage elsewhere:
// import { withDefaults } from "../utils/prisma";

// If you want standardized delegates, uncomment and ensure models exist:
// export const token_wallets = withDefaults(prisma.token_wallets);
// export const transactions = withDefaults(prisma.transactions);
