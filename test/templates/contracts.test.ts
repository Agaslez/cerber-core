/**
 * Template Contract Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description Tests for all 5 contract templates
 */

import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { ContractAST } from '../../src/semantic/SemanticComparator';

describe.skip('Contract Templates', () => {
  const templatesDir = path.join(process.cwd(), 'templates');

  describe('Template Structure', () => {
    const templates = ['nodejs', 'docker', 'react', 'python', 'terraform'];

    templates.forEach(template => {
      it(`should have complete structure for ${template} template`, () => {
        const templateDir = path.join(templatesDir, template);
        
        expect(fs.existsSync(templateDir)).toBe(true);
        expect(fs.existsSync(path.join(templateDir, 'contract.yml'))).toBe(true);
        expect(fs.existsSync(path.join(templateDir, 'README.md'))).toBe(true);
        expect(fs.existsSync(path.join(templateDir, 'example-workflow.yml'))).toBe(true);
      });
    });
  });

  describe('nodejs template', () => {
    it('should have valid contract configuration', () => {
      const contractPath = path.join(templatesDir, 'nodejs', 'contract.yml');
      const content = fs.readFileSync(contractPath, 'utf-8');
      const contract: ContractAST = yaml.parse(content);

      expect(contract.name).toBeDefined();
      expect(contract.version).toBeDefined();
      expect(contract.rules).toBeDefined();
      
      // Security rules should be enabled
      expect(contract.rules?.['security/no-hardcoded-secrets']).toBe('error');
      expect(contract.rules?.['security/require-action-pinning']).toBe('error');
      
      // Best practices for Node.js
      expect(contract.rules?.['best-practices/cache-dependencies']).toBeDefined();
      expect(contract.rules?.['best-practices/setup-node-with-version']).toBe('error');
    });

    it('should have example workflow that passes validation', () => {
      const workflowPath = path.join(templatesDir, 'nodejs', 'example-workflow.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = yaml.parse(content);

      expect(workflow.name).toBeDefined();
      expect(workflow.on).toBeDefined();
      expect(workflow.jobs).toBeDefined();
      
      // Should use Node.js actions
      const hasSetupNode = Object.values(workflow.jobs).some((job: any) =>
        job.steps?.some((step: any) => step.uses?.includes('actions/setup-node'))
      );
      expect(hasSetupNode).toBe(true);
    });

    it('should have comprehensive README', () => {
      const readmePath = path.join(templatesDir, 'nodejs', 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      expect(content).toContain('Node.js');
      expect(content).toContain('npm');
      expect(content).toContain('setup');
    });
  });

  describe('docker template', () => {
    it('should have valid contract with Docker-specific rules', () => {
      const contractPath = path.join(templatesDir, 'docker', 'contract.yml');
      const content = fs.readFileSync(contractPath, 'utf-8');
      const contract: ContractAST = yaml.parse(content);

      expect(contract.name).toContain('docker');
      expect(contract.rules?.['security/no-hardcoded-secrets']).toBe('error');
      
      // Should mention Docker actions
      expect(contract.requiredActions).toBeDefined();
    });

    it('should have example with Docker build steps', () => {
      const workflowPath = path.join(templatesDir, 'docker', 'example-workflow.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = yaml.parse(content);

      const hasDockerBuild = Object.values(workflow.jobs).some((job: any) =>
        job.steps?.some((step: any) => 
          step.uses?.includes('docker/') || step.run?.includes('docker')
        )
      );
      expect(hasDockerBuild).toBe(true);
    });
  });

  describe('react template', () => {
    it('should have valid contract for React projects', () => {
      const contractPath = path.join(templatesDir, 'react', 'contract.yml');
      const content = fs.readFileSync(contractPath, 'utf-8');
      const contract: ContractAST = yaml.parse(content);

      expect(contract.name).toContain('react');
      expect(contract.rules?.['best-practices/cache-dependencies']).toBeDefined();
    });

    it('should have example with build and test steps', () => {
      const workflowPath = path.join(templatesDir, 'react', 'example-workflow.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = yaml.parse(content);

      const hasBuildStep = Object.values(workflow.jobs).some((job: any) =>
        job.steps?.some((step: any) => 
          step.run?.includes('build') || step.run?.includes('npm')
        )
      );
      expect(hasBuildStep).toBe(true);
    });
  });

  describe('python template', () => {
    it('should have valid contract for Python projects', () => {
      const contractPath = path.join(templatesDir, 'python', 'contract.yml');
      const content = fs.readFileSync(contractPath, 'utf-8');
      const contract: ContractAST = yaml.parse(content);

      expect(contract.name).toContain('python');
      expect(contract.rules?.['security/no-hardcoded-secrets']).toBe('error');
    });

    it('should have example with Python setup', () => {
      const workflowPath = path.join(templatesDir, 'python', 'example-workflow.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = yaml.parse(content);

      const hasSetupPython = Object.values(workflow.jobs).some((job: any) =>
        job.steps?.some((step: any) => step.uses?.includes('actions/setup-python'))
      );
      expect(hasSetupPython).toBe(true);
    });
  });

  describe('terraform template', () => {
    it('should have valid contract for IaC projects', () => {
      const contractPath = path.join(templatesDir, 'terraform', 'contract.yml');
      const content = fs.readFileSync(contractPath, 'utf-8');
      const contract: ContractAST = yaml.parse(content);

      expect(contract.name).toContain('terraform');
      expect(contract.rules?.['security/no-hardcoded-secrets']).toBe('error');
    });

    it('should have example with Terraform steps', () => {
      const workflowPath = path.join(templatesDir, 'terraform', 'example-workflow.yml');
      const content = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = yaml.parse(content);

      const hasTerraform = Object.values(workflow.jobs).some((job: any) =>
        job.steps?.some((step: any) => 
          step.uses?.includes('terraform') || step.run?.includes('terraform')
        )
      );
      expect(hasTerraform).toBe(true);
    });
  });

  describe('Cross-template validation', () => {
    it('all templates should have consistent security rules', () => {
      const templates = ['nodejs', 'docker', 'react', 'python', 'terraform'];
      const securityRules = [
        'security/no-hardcoded-secrets',
        'security/require-action-pinning',
        'security/limit-permissions'
      ];

      templates.forEach(template => {
        const contractPath = path.join(templatesDir, template, 'contract.yml');
        const content = fs.readFileSync(contractPath, 'utf-8');
        const contract: ContractAST = yaml.parse(content);

        securityRules.forEach(rule => {
          expect(contract.rules?.[rule]).toBeDefined();
          expect(['error', 'warning']).toContain(contract.rules?.[rule]);
        });
      });
    });

    it('all example workflows should pass basic structure validation', () => {
      const templates = ['nodejs', 'docker', 'react', 'python', 'terraform'];

      templates.forEach(template => {
        const workflowPath = path.join(templatesDir, template, 'example-workflow.yml');
        const content = fs.readFileSync(workflowPath, 'utf-8');
        const workflow = yaml.parse(content);

        expect(workflow.name).toBeDefined();
        expect(workflow.on).toBeDefined();
        expect(workflow.jobs).toBeDefined();
        expect(Object.keys(workflow.jobs).length).toBeGreaterThan(0);

        // Each job should have required fields
        Object.values(workflow.jobs).forEach((job: any) => {
          expect(job['runs-on']).toBeDefined();
          expect(job.steps).toBeDefined();
          expect(job.steps.length).toBeGreaterThan(0);
        });
      });
    });

    it('all READMEs should have quick start section', () => {
      const templates = ['nodejs', 'docker', 'react', 'python', 'terraform'];

      templates.forEach(template => {
        const readmePath = path.join(templatesDir, template, 'README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');

        expect(content).toContain('Quick Start');
        expect(content).toContain('cerber init');
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });
});
