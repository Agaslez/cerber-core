import type { OrchestratorRunOptions } from '../../src/core/types';

/**
 * Test helper: Create properly-typed OrchestratorRunOptions
 * Ensures all test runs have required 'cwd' property (defaults to process.cwd())
 * 
 * Usage:
 *   const options = makeRunOptions({ cwd: tempDir, files: [...], tools: [...] });
 *   await orchestrator.run(options);
 */
export function makeRunOptions(
  partial: Partial<OrchestratorRunOptions> = {}
): OrchestratorRunOptions {
  return {
    cwd: partial.cwd ?? process.cwd(),
    ...partial,
  } as OrchestratorRunOptions;
}
