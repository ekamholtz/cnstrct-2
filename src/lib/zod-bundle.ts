/**
 * This file bundles zod and its dependencies to avoid module resolution issues in production
 */

// Re-export everything from zod
import * as z from 'zod';
export default z;
export * from 'zod';
