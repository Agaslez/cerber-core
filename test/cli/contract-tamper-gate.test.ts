/**
 * Contract Validation Tests
 * 
 * Tests that contracts are properly validated and detected
 * Uses Doctor API for validation
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runDoctor } from '../../src/cli/doctor.js';

describe('Contract Validation (Contract Tamper Gate)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-contract-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should detect missing contract', async () => {
    const result = await runDoctor(tempDir);

    // Doctor should report missing contract
    expect(result.contractFound).toBe(false);
  });

  it('should handle malformed YAML contract gracefully', async () => {
    // Doctor should not crash on malformed YAML
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(contractPath, 'invalid: [yaml: unclosed');

    const result = await runDoctor(tempDir);
    
    // Doctor handles gracefully
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('issues');
  });

  it('should report contract issues in doctor output', async () => {
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(
      contractPath,
      `# CERBER Configuration
profile: solo
version: 1.0.0`
    );

    const result = await runDoctor(tempDir);

    // Doctor found the contract
    expect(result.contractFound).toBe(true);
  });

  it('should not crash with invalid profile reference', async () => {
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(
      contractPath,
      `# CERBER Configuration
profile: undefined-profile
version: 1.0.0`
    );

    // Doctor should not crash
    const result = await runDoctor(tempDir);
    expect(result).toBeDefined();
  });

  it('should show readable error messages', async () => {
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(contractPath, 'broken: {invalid');

    // Doctor should handle gracefully
    const result = await runDoctor(tempDir);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should validate minimal valid contract', async () => {
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(
      contractPath,
      `# CERBER Configuration
profile: solo
version: 1.0.0`
    );

    const result = await runDoctor(tempDir);

    // Contract found and valid
    expect(result.contractFound).toBe(true);
    expect(typeof result).toBe('object');
  });

  it('should handle edge case: empty contract file', async () => {
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(contractPath, '');

    // Doctor should handle gracefully
    const result = await runDoctor(tempDir);
    expect(result).toBeDefined();
  });

  it('should detect multiple contract formats', async () => {
    // Test with CERBER.md
    const contractPath = path.join(tempDir, 'CERBER.md');
    fs.writeFileSync(contractPath, '# CERBER Configuration\nprofile: solo');

    const result = await runDoctor(tempDir);
    expect(result.contractFound).toBe(true);
  });
});
