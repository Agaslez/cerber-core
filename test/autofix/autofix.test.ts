/**
 * Auto-Fix Tests with Snapshots
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description Tests for auto-fix functionality with snapshot comparison
 */

import { describe, expect, it } from '@jest/globals';
import type { WorkflowAST } from '../../src/semantic/SemanticComparator';
import { SemanticComparator } from '../../src/semantic/SemanticComparator';

describe('Auto-Fix', () => {
  describe('Fix confidence scoring', () => {
    it('should calculate high confidence for secret replacement', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'deploy',
              env: { API_KEY: 'sk_fake_THISISNOTAREALKEY1234567890' }
            }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const secretViolation = result.semanticViolations.find(v => 
        v.message.includes('secret')
      );

      expect(secretViolation).toBeDefined();
      expect(secretViolation?.fix).toBeDefined();
      expect(secretViolation?.fix?.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should calculate medium confidence for action pinning', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const pinningViolation = result.semanticViolations.find(v => 
        v.message.includes('pinned')
      );

      expect(pinningViolation).toBeDefined();
      expect(pinningViolation?.fix).toBeDefined();
      expect(pinningViolation?.fix?.confidence).toBeGreaterThanOrEqual(70);
      expect(pinningViolation?.fix?.confidence).toBeLessThan(90);
    });
  });

  describe('Fix generation', () => {
    it('should generate correct fix for hardcoded secret', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'deploy',
              env: { 
                API_KEY: 'sk_fake_THISISNOTAREALKEY1234567890',
                NORMAL_VAR: 'safe-value'
              }
            }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const secretViolation = result.semanticViolations.find(v => 
        v.message.includes('secret')
      );

      expect(secretViolation?.fix?.patch).toContain('${{ secrets.API_KEY }}');
      expect(secretViolation?.fix?.patch).not.toContain('sk_fake_');
    });

    it('should generate correct fix for unpinned action', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const pinningViolation = result.semanticViolations.find(v => 
        v.message.includes('pinned')
      );

      expect(pinningViolation?.fix?.patch).toMatch(/@v\d+\.\d+\.\d+/);
    });

    it('should generate correct fix for overly broad permissions', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: {
          contents: 'write',
          'pull-requests': 'write'
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo test' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const permissionsViolation = result.semanticViolations.find(v => 
        v.message.includes('permissions')
      );

      expect(permissionsViolation?.fix?.patch).toContain('read');
      expect(permissionsViolation?.fix?.description).toContain('Narrow permissions');
    });
  });

  describe('Fix application', () => {
    it('should only apply high-confidence fixes (70%+)', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout' },
              { run: 'deploy', env: { API_KEY: 'sk_fake_THISISNOTAREALKEY1234567890' } }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const highConfidenceFixes = [
        ...result.semanticViolations,
        ...result.ruleViolations
      ].filter(v => v.fix && v.fix.confidence >= 70);

      expect(highConfidenceFixes.length).toBeGreaterThan(0);
    });

    it('should preserve unmodified parts of workflow', async () => {
      const workflow: WorkflowAST = {
        name: 'My Workflow',
        on: { push: { branches: ['main', 'develop'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout' },
              { run: 'npm test' },
              { run: 'deploy', env: { API_KEY: 'sk_fake_THISISNOTAREALKEY1234567890' } }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      // After fixes, workflow name and branches should be unchanged
      expect(workflow.name).toBe('My Workflow');
      if (workflow.on?.push && 'branches' in workflow.on.push) {
        expect(workflow.on.push.branches).toEqual(['main', 'develop']);
      }
      if (workflow.jobs?.test?.steps && workflow.jobs.test.steps[1]) {
        expect(workflow.jobs.test.steps[1].run).toBe('npm test');
      }
    });
  });

  describe('Fix snapshots', () => {
    it('should match snapshot for secret replacement fix', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          deploy: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'deploy',
              env: { 
                STRIPE_KEY: 'sk_fake_THISISNOTAREALKEY1234567890',
                GITHUB_TOKEN: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'
              }
            }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const fixes = result.semanticViolations
        .filter(v => v.fix)
        .map(v => ({
          location: v.location,
          message: v.message,
          fix: v.fix?.patch,
          confidence: v.fix?.confidence
        }));

      expect(fixes).toMatchSnapshot();
    });

    it('should match snapshot for action pinning fix', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout' },
              { uses: 'actions/setup-node@v4' },
              { uses: 'actions/cache' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const fixes = result.semanticViolations
        .filter(v => v.fix)
        .map(v => ({
          location: v.location,
          fix: v.fix?.patch
        }));

      expect(fixes).toMatchSnapshot();
    });

    it('should match snapshot for permission narrowing fix', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: {
          contents: 'write',
          'pull-requests': 'write',
          packages: 'write'
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'npm test' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const fixes = result.semanticViolations
        .filter(v => v.fix)
        .map(v => ({
          location: v.location,
          fix: v.fix?.patch
        }));

      expect(fixes).toMatchSnapshot();
    });
  });

  describe('Fix safety checks', () => {
    it('should NEVER auto-fix conditional expressions', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            if: '${{ github.ref == \'refs/heads/main\' }}',
            steps: [
              { uses: 'actions/checkout' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      // Should not suggest fixes for 'if:' conditions
      const conditionalFixes = result.semanticViolations.filter(v => 
        v.location && v.location.includes('if') && v.fix
      );

      expect(conditionalFixes.length).toBe(0);
    });

    it('should NEVER auto-fix run commands', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { run: 'npm install && npm test' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      // Should not suggest fixes for run commands
      const runFixes = result.semanticViolations.filter(v => 
        v.location && v.location.includes('run') && v.fix
      );

      expect(runFixes.length).toBe(0);
    });

    it('should NEVER auto-fix matrix strategies without confirmation', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            strategy: {
              matrix: {
                'node-version': ['18', '20', '22']
              }
            },
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '${{ matrix.node-version }}' } }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      // Should not suggest fixes for matrix configuration
      const matrixFixes = result.semanticViolations.filter(v => 
        v.location && v.location.includes('matrix') && v.fix
      );

      expect(matrixFixes.length).toBe(0);
    });
  });
});
