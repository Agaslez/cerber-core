#!/usr/bin/env node

/**
 * cerber validate - Professional Workflow Validator (V2.0)
 * 
 * @package cerber-core
 * @version 2.0.0
 * 
 * Usage:
 *   cerber validate                              # Use defaults
 *   cerber validate --profile dev                # Use dev profile
 *   cerber validate --staged                     # Only staged files
 *   cerber validate --format json                # JSON output
 *   cerber validate --contract .cerber/contract.yml
 */

import chalk from 'chalk';
import { program } from 'commander';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Orchestrator } from '../dist/core/Orchestrator.js';
import { FileDiscovery } from '../dist/discovery/FileDiscovery.js';
import { ReportFormatter } from '../dist/reporting/ReportFormatter.js';

// Exit codes per V2 spec
const EXIT = {
  SUCCESS: 0,
  VALIDATION_FAILED: 1,
  CONFIG_ERROR: 2,
  RUNTIME_ERROR: 3,
};

// CLI Setup
program
  .name('cerber')
  .description('Cerber Core - Contract-based workflow validator (V2.0)')
  .version('2.0.0')
  .command('validate [pattern]')
  .description('Validate workflows against contract')
  .option('-c, --contract <file>', 'Path to contract file', '.cerber/contract.yml')
  .option('-p, --profile <name>', 'Profile name (solo/dev/team)', 'solo')
  .option('-s, --staged', 'Only validate staged files', false)
  .option('--changed', 'Only validate changed files', false)
  .option('-f, --format <format>', 'Output format', 'text')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--json', 'JSON output (shorthand for --format json)', false)
  .action(async (pattern, options) => {
    try {
      const exitCode = await validate({
        pattern: pattern || '.github/workflows/**/*.{yml,yaml}',
        contract: options.contract,
        profile: options.profile,
        staged: options.staged,
        changed: options.changed,
        format: options.json ? 'json' : options.format,
        verbose: options.verbose,
      });
      process.exit(exitCode);
    } catch (error) {
      console.error(chalk.red('✖ ') + (error instanceof Error ? error.message : String(error)));
      process.exit(EXIT.RUNTIME_ERROR);
    }
  });

// Parse arguments
program.parse(process.argv);

/**
 * Main validation logic
 */
async function validate(options) {
  // Step 1: Load contract
  if (!fs.existsSync(options.contract)) {
    console.error(chalk.red('✖ ') + `Contract not found: ${options.contract}`);
    console.log(chalk.cyan('ℹ ') + 'Run: cerber init');
    return EXIT.CONFIG_ERROR;
  }

  let contract;
  try {
    const data = fs.readFileSync(options.contract, 'utf-8');
    contract = yaml.parse(data);
  } catch (error) {
    console.error(chalk.red('✖ ') + `Failed to parse contract: ${error.message}`);
    return EXIT.CONFIG_ERROR;
  }

  // Step 2: Resolve profile
  const profile = contract.profiles?.[options.profile];
  if (!profile) {
    console.error(chalk.red('✖ ') + `Unknown profile: ${options.profile}`);
    const profiles = Object.keys(contract.profiles || {}).join(', ');
    console.log(chalk.cyan('ℹ ') + `Available: ${profiles}`);
    return EXIT.CONFIG_ERROR;
  }

  // Step 3: Discover files
  const discovery = new FileDiscovery();
  let files;

  try {
    if (options.staged) {
      files = await discovery.getStagedFiles(options.pattern);
    } else if (options.changed) {
      files = await discovery.getChangedFiles(options.pattern);
    } else {
      files = await discovery.getFiles(options.pattern);
    }
  } catch (error) {
    console.error(chalk.red('✖ ') + `File discovery failed: ${error.message}`);
    return EXIT.RUNTIME_ERROR;
  }

  if (options.verbose) {
    console.log(chalk.cyan('ℹ ') + `Found ${files.length} files`);
  }

  if (files.length === 0) {
    const output = {
      schemaVersion: 1,
      contractVersion: 1,
      deterministic: true,
      summary: { total: 0, errors: 0, warnings: 0 },
      violations: [],
    };
    console.log(formatOutput(output, options.format));
    return EXIT.SUCCESS;
  }

  // Step 4: Run Orchestrator
  let result;
  try {
    const orchestrator = new Orchestrator();
    result = await orchestrator.run({
      files,
      profile: profile.name,
      tools: profile.tools || [],
      timeout: profile.timeout || 30000,
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error(chalk.red('✖ ') + `Orchestration failed: ${error.message}`);
    return EXIT.RUNTIME_ERROR;
  }

  // Step 5: Format and output
  const formatted = formatOutput(result, options.format);
  console.log(formatted);

  // Step 6: Determine exit code
  if (result.summary.total === 0) {
    return EXIT.SUCCESS;
  }
  if (result.summary.errors > 0) {
    return EXIT.VALIDATION_FAILED;
  }
  return EXIT.SUCCESS;
}

/**
 * Format output based on requested format
 */
function formatOutput(output, format) {
  const formatter = new ReportFormatter();
  
  try {
    return formatter.format(output, format);
  } catch (error) {
    // Fallback to JSON if format fails
    return JSON.stringify(output, null, 2);
  }
}
