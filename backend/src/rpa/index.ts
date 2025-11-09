// RPA Module - Main Export
// Central export point for all RPA automation modules

export { default as transactionProcessor } from "./transactionProcessor";
export { default as kycVerifier } from "./kycVerifier";
export { default as reportGenerator } from "./reportGenerator";
export { default as notificationAutomation } from "./notificationAutomation";
export { default as dataBackupSync } from "./dataBackupSync";
export { default as rpaScheduler } from "./scheduler";
export { default as chatbotSupport } from "./chatbot";
export { rpaConfig } from "./config";
export { default as rpaRoutes } from "./routes";

// Note: For scheduler control functions, import rpaScheduler directly:
// import { rpaScheduler } from './rpa';
// await rpaScheduler.start();
// rpaScheduler.stop();
// const status = rpaScheduler.getStatus();

