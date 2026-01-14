/**
 * Best Practices Rules Unit Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description Tests for all 3 best-practices rules
 */

import { describe, expect, it } from '@jest/globals';
import { RuleManager } from '../../src/rules/index';
import type { WorkflowAST } from '../../src/semantic/SemanticComparator';

describe('@fast Best Practices Rules', () => {
  describe('best-practices/cache-dependencies', () => {
    it('should detect missing cache after setup-node', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
              { run: 'npm ci' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/cache-dependencies', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('caching');
      expect(violations[0].severity).toBe('warning');
    });

    it('should pass when cache is used', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20', cache: 'npm' } },
              { run: 'npm ci' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/cache-dependencies', workflow);

      expect(violations.length).toBe(0);
    });

    it('should pass when actions/cache is used', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
              { uses: 'actions/cache@v4', with: { path: '~/.npm', key: 'node-modules-${{ hashFiles }}' } },
              { run: 'npm ci' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/cache-dependencies', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('best-practices/setup-node-with-version', () => {
    it('should detect missing node-version', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4' },
              { run: 'npm test' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/setup-node-with-version', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('node-version');
      expect(violations[0].severity).toBe('error');
    });

    it('should pass with explicit node-version', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
              { run: 'npm test' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/setup-node-with-version', workflow);

      expect(violations.length).toBe(0);
    });

    it('should pass with node-version-file', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version-file': '.nvmrc' } },
              { run: 'npm test' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/setup-node-with-version', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('best-practices/parallelize-matrix-jobs', () => {
    it('should suggest matrix for multiple similar jobs', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          'test-node-18': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '18' } },
              { run: 'npm test' }
            ]
          },
          'test-node-20': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
              { run: 'npm test' }
            ]
          },
          'test-node-22': {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { uses: 'actions/setup-node@v4', with: { 'node-version': '22' } },
              { run: 'npm test' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/parallelize-matrix-jobs', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('matrix');
      expect(violations[0].severity).toBe('info');
    });

    it('should pass when matrix is used', async () => {
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
              { uses: 'actions/setup-node@v4', with: { 'node-version': '${{ matrix.node-version }}' } },
              { run: 'npm test' }
            ]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('best-practices/parallelize-matrix-jobs', workflow);

      expect(violations.length).toBe(0);
    });
  });
});
