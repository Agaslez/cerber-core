/**
 * @file Input Validation
 * @rule Per PRODUCTION HARDENING - P1: Input Validation & Security
 * @description Zod schemas for runtime validation of all inputs
 */

import { z } from 'zod';

/**
 * File path validation
 * - Must be non-empty string
 * - No null bytes (security)
 * - Reasonable length limit
 */
export const FilePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .max(4096, 'File path too long (max 4096 chars)')
  .refine(
    (path: string) => !path.includes('\0'),
    'File path cannot contain null bytes'
  );

/**
 * Profile name validation
 * - Alphanumeric + hyphens/underscores only
 * - Prevents command injection via profile names
 */
export const ProfileNameSchema = z
  .string()
  .min(1, 'Profile name cannot be empty')
  .max(64, 'Profile name too long (max 64 chars)')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Profile name must be alphanumeric (with hyphens/underscores)'
  );

/**
 * Adapter/Tool name validation
 * - Same rules as profile name
 */
export const AdapterNameSchema = z
  .string()
  .min(1, 'Adapter name cannot be empty')
  .max(64, 'Adapter name too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Adapter name must be alphanumeric (with hyphens/underscores)'
  );

/**
 * Timeout validation
 * - Must be positive integer
 * - Reasonable max (10 minutes)
 */
export const TimeoutSchema = z
  .number()
  .int('Timeout must be an integer')
  .positive('Timeout must be positive')
  .max(600000, 'Timeout too large (max 10 minutes = 600000ms)');

/**
 * Orchestrator options validation
 */
export const OrchestratorOptionsSchema = z.object({
  files: z.array(FilePathSchema).min(1, 'At least one file required'),
  tools: z.array(AdapterNameSchema).optional(),
  profile: ProfileNameSchema.optional(),
  parallel: z.boolean().optional(),
  timeout: TimeoutSchema.optional(),
  config: z.string().optional() // config file path
});

export type ValidatedOrchestratorOptions = z.infer<typeof OrchestratorOptionsSchema>;

/**
 * CLI arguments validation
 */
export const CLIArgsSchema = z.object({
  files: z.array(z.string()).min(1, 'At least one file required'),
  tools: z.array(z.string()).optional(),
  profile: z.string().optional(),
  parallel: z.boolean().optional(),
  timeout: z.number().optional(),
  config: z.string().optional(),
  init: z.boolean().optional(),
  version: z.boolean().optional(),
  help: z.boolean().optional()
});

/**
 * Contract validation schema
 */
export const ContractRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['error', 'warning', 'info']),
  enabled: z.boolean().optional(),
  category: z.string().optional()
});

export const ContractProfileSchema = z.object({
  name: ProfileNameSchema,
  tools: z.array(AdapterNameSchema).min(1, 'Profile must have at least one tool'),
  rules: z.array(ContractRuleSchema).optional(),
  extends: z.string().optional()
});

export const ContractSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (use semver)'),
  profiles: z.array(ContractProfileSchema).min(1, 'Contract must have at least one profile'),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional()
  }).optional()
});

/**
 * Validate orchestrator options
 * @throws {z.ZodError} If validation fails
 */
export function validateOrchestratorOptions(options: unknown): ValidatedOrchestratorOptions {
  return OrchestratorOptionsSchema.parse(options);
}

/**
 * Validate CLI arguments
 * @throws {z.ZodError} If validation fails
 */
export function validateCLIArgs(args: unknown): z.infer<typeof CLIArgsSchema> {
  return CLIArgsSchema.parse(args);
}

/**
 * Validate contract
 * @throws {z.ZodError} If validation fails
 */
export function validateContract(contract: unknown): z.infer<typeof ContractSchema> {
  return ContractSchema.parse(contract);
}

/**
 * Safe validation wrapper that returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Format Zod validation errors for user-friendly display
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map((err: z.ZodIssue) => {
      const path = err.path.join('.');
      return `${path ? `${path}: ` : ''}${err.message}`;
    })
    .join('\n');
}
