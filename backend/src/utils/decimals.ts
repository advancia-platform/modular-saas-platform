// Compatibility shim: some codebases import from './utils/decimals'
// This file re-exports helpers from './decimal' to prevent TS2307 errors.

import { Prisma } from "@prisma/client";
export type Decimal = Prisma.Decimal;
export * from "./decimal";
