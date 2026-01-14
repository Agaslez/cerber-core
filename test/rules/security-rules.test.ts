/**
 * Security Rules Unit Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description Tests for all 5 security rules
 */

import { describe, expect, it } from '@jest/globals';
import { RuleManager } from '../../src/rules/index';
import type { WorkflowAST } from '../../src/semantic/SemanticComparator';

describe('@fast Security Rules', () => {
  describe('security/no-hardcoded-secrets', () => {
    it('should detect Stripe API key (sk_live_)', async () => {
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

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-hardcoded-secrets', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('Hardcoded secret');
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].location).toContain('env.API_KEY');
    });

    it('should detect GitHub personal token (ghp_)', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'git push',
              env: { GITHUB_TOKEN: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz' }
            }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-hardcoded-secrets', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('GitHub personal token');
    });

    it('should detect AWS access key (AKIA)', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          deploy: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'aws deploy',
              env: { AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE' }
            }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-hardcoded-secrets', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('AWS');
    });

    it('should NOT flag ${{ secrets.API_KEY }}', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              run: 'deploy',
              env: { API_KEY: '${{ secrets.API_KEY }}' }
            }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-hardcoded-secrets', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('security/require-action-pinning', () => {
    it('should detect unpinned action (no version)', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/require-action-pinning', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('not pinned');
      expect(violations[0].severity).toBe('error');
    });

    it('should detect major-version-only pinning', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout@v4' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/require-action-pinning', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('major version only');
    });

    it('should pass full version pinning', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout@v4.1.0' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/require-action-pinning', workflow);

      expect(violations.length).toBe(0);
    });

    it('should pass SHA pinning', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout@abc123def456' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/require-action-pinning', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('security/limit-permissions', () => {
    it('should detect write permissions', async () => {
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

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/limit-permissions', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('permissions');
    });

    it('should pass read-only permissions', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: {
          contents: 'read',
          'pull-requests': 'read'
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo test' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/limit-permissions', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('security/no-wildcard-triggers', () => {
    it('should detect wildcard in branches', async () => {
      const workflow: WorkflowAST = {
        on: {
          push: { branches: ['*'] }
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo test' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-wildcard-triggers', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('Wildcard');
    });

    it('should pass specific branches', async () => {
      const workflow: WorkflowAST = {
        on: {
          push: { branches: ['main', 'develop'] }
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo test' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/no-wildcard-triggers', workflow);

      expect(violations.length).toBe(0);
    });
  });

  describe('security/checkout-without-persist-credentials', () => {
    it('should detect checkout without persist-credentials: false', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ uses: 'actions/checkout@v4' }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/checkout-without-persist-credentials', workflow);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('persist-credentials');
    });

    it('should pass checkout with persist-credentials: false', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{
              uses: 'actions/checkout@v4',
              with: { 'persist-credentials': false }
            }]
          }
        }
      };

      const ruleManager = new RuleManager();
      const violations = await ruleManager.runRule('security/checkout-without-persist-credentials', workflow);

      expect(violations.length).toBe(0);
    });
  });
});
