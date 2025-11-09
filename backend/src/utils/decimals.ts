// Compatibility shim: some codebases import from './utils/decimals'
// This file re-exports helpers from './decimal' to prevent TS2307 errors.

export { Decimal } from "@prisma/client/runtime/library";
export * from "./decimal";
