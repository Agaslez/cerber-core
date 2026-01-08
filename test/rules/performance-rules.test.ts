/**
 * Performance Rules Unit Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description Tests for all 2 performance rules
 */

import { describe, expect, it } from '@jest/globals';
import { RuleManager } from '../../src/rules/index';
import type { WorkflowAST } from '../../src/semantic/SemanticComparator';

describe('Performance Rules', () => {
  describe('performance/avoid-unnecessary-checkout', () => {
    it('should detect multiple checkout steps in same job', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { run: 'npm test' },
              { uses: 'actions/checkout@v4' }, // Duplicate
              { run: 'npm build' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('performance/avoid-unnecessary-checkout', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('multiple checkout');
      expect(violations[0].severity).toBe('info');
    });

    it('should pass single checkout per job', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { run: 'npm test' },
              { run: 'npm build' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('performance/avoid-unnecessary-checkout', workflow);

      expect(violations.length).toBe(0);
    });

    it('should allow multiple checkouts if different repositories', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/checkout@v4', with: { repository: 'org/other-repo' } }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('performance/avoid-unnecessary-checkout', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('performance/use-composite-actions', () => {
    it('should suggest composite action for repeated step patterns', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          'build-frontend': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'npm' } },
              { run: 'npm ci' },
              { run: 'npm run build' }
            ]
          },
          'build-backend': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'npm' } },
              { run: 'npm ci' },
              { run: 'npm run build' }
            ]
          },
          'build-api': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'npm' } },
              { run: 'npm ci' },
              { run: 'npm run build' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('performance/use-composite-actions', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('composite action');
      expect(violations[0].severity).toBe('info');
    });

    it('should pass when using composite actions', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          'build-frontend': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: './.github/actions/setup-node-build' }
            ]
          },
          'build-backend': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: './.github/actions/setup-node-build' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('performance/use-composite-actions', workflow);

      expect(violations.length).toBe(0);
    });
  });
});
