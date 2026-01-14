/**
 * SemanticComparator Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import { describe, expect, it } from '@jest/globals';
import type { ContractAST, WorkflowAST } from '../src/semantic/SemanticComparator';
import { SemanticComparator } from '../src/semantic/SemanticComparator';

describe('@integration SemanticComparator', () => {
  describe('Structure Validation (Level 1)', () => {
    it('should detect missing "on" trigger', async () => {
      const workflow: WorkflowAST = {
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo hello' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      expect(result.valid).toBe(false);
      expect(result.structureViolations.length).toBeGreaterThan(0);
      expect(result.structureViolations[0].message).toContain('Missing required key: "on"');
    });

    it('should detect missing jobs', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {}
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      expect(result.valid).toBe(false);
      const violation = result.structureViolations.find(v => v.message.includes('jobs'));
      expect(violation).toBeDefined();
    });

    it('should detect missing runs-on in job', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            steps: [{ run: 'echo hello' }]
          } as any
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      expect(result.valid).toBe(false);
      const violation = result.structureViolations.find(v => v.message.includes('runs-on'));
      expect(violation).toBeDefined();
    });

    it('should pass valid workflow structure', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo hello' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      expect(result.structureViolations.length).toBe(0);
    });
  });

  describe('Semantic Validation (Level 2)', () => {
    it('should detect hardcoded Stripe API key', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                run: 'deploy',
                env: {
                  API_KEY: 'sk_fake_THISISNOTAREALKEY1234567890'
                }
              }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.semanticViolations.find(v => 
        v.message.includes('Hardcoded secret')
      );
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('critical');
    });

    it('should detect unpinned action', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.semanticViolations.find(v => 
        v.message.includes('pinned')
      );
      expect(violation).toBeDefined();
    });

    it('should warn about major version pinning', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.semanticViolations.find(v => 
        v.message.includes('major version only')
      );
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('warning');
    });

    it('should detect overly broad permissions', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: {
          all: 'write'
        } as any,
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo hello' }]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.semanticViolations.find(v => 
        v.message.includes('Overly broad permissions')
      );
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('critical');
    });
  });

  describe('Custom Rules Validation (Level 3)', () => {
    it('should enforce required actions from contract', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { run: 'npm test' }
            ]
          }
        }
      };

      const contract: ContractAST = {
        requiredActions: ['actions/checkout']
      };

      const comparator = new SemanticComparator(contract);
      const result = await comparator.compare(workflow);

      const violation = result.ruleViolations.find(v => 
        v.message.includes('Required action missing')
      );
      expect(violation).toBeDefined();
    });

    it('should detect forbidden actions from contract', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'dangerous/action@v1' }
            ]
          }
        }
      };

      const contract: ContractAST = {
        forbiddenActions: ['dangerous/action']
      };

      const comparator = new SemanticComparator(contract);
      const result = await comparator.compare(workflow);

      const violation = result.ruleViolations.find(v => 
        v.message.includes('Forbidden action used')
      );
      expect(violation).toBeDefined();
    });

    it('should validate permissions policy', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: {
          contents: 'write'
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [{ run: 'echo hello' }]
          }
        }
      };

      const contract: ContractAST = {
        permissionsPolicy: {
          maxLevel: 'read',
          allowedScopes: ['contents', 'pull-requests']
        }
      };

      const comparator = new SemanticComparator(contract);
      const result = await comparator.compare(workflow);

      const violation = result.ruleViolations.find(v => 
        v.message.includes('exceeds policy max level')
      );
      expect(violation).toBeDefined();
    });
  });

  describe('Auto-Fix Suggestions', () => {
    it('should suggest fix for hardcoded secret', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              {
                run: 'deploy',
                env: {
                  SECRET_KEY: 'sk_fake_THISISNOTAREALKEY1234567890'
                }
              }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.violations.find(v => 
        v.fix && v.fix.confidence >= 90
      );
      expect(violation).toBeDefined();
      expect(violation?.fix?.type).toBe('replace');
      expect(violation?.fix?.after).toContain('secrets.SECRET_KEY');
    });

    it('should suggest fix for unpinned action', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout' }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      const violation = result.violations.find(v => v.fix);
      expect(violation).toBeDefined();
      expect(violation?.fix?.type).toBe('replace');
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate correct summary', async () => {
      const workflow: WorkflowAST = {
        on: { push: { branches: ['main'] } },
        permissions: { all: 'write' } as any,
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { 
                uses: 'actions/checkout',
                env: { SECRET: 'sk_fake_THISISNOTAREALKEY1234567890' }
              }
            ]
          }
        }
      };

      const comparator = new SemanticComparator();
      const result = await comparator.compare(workflow);

      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThan(0);  // actions/checkout bez wersji = error
      expect(result.valid).toBe(false);
    });
  });
});
