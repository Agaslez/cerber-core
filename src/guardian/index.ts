/**
 * Guardian - Pre-Commit Architecture Validator
 * Blocks commits that violate architecture rules
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ArchitectApproval, GuardianSchema, ValidationResult } from './types';

export class Guardian {
  private schema: GuardianSchema;
  private errors: string[] = [];
  private warnings: string[] = [];
  private approvals: ArchitectApproval[] = [];

  constructor(schema: GuardianSchema) {
    this.schema = schema;
  }

  /**
   * Main validation entry point
   */
  async validate(): Promise<ValidationResult> {
    console.log('═══════════════════════════════════════════════════');
    console.log('🛡️  GUARDIAN VALIDATOR');
    console.log('═══════════════════════════════════════════════════');

    this.checkRequiredFiles();
    await this.checkForbiddenPatterns();
    this.checkRequiredImports();
    this.checkPackageLockSync();

    return this.getResult();
  }

  /**
   * Check if required files exist
   */
  private checkRequiredFiles(): void {
    console.log('\n📁 Checking required files...');
    
    for (const file of this.schema.requiredFiles || []) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        this.addError(`MISSING REQUIRED FILE: ${file}`);
      }
    }
    
    if (this.errors.length === 0) {
      console.log('   ✅ All required files present');
    }
  }

  /**
   * Check for forbidden patterns with architect approval support
   */
  private async checkForbiddenPatterns(): Promise<void> {
    console.log('\n🔍 Checking for forbidden patterns...');
    
    const srcPath = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcPath)) {
      console.log('   ⚠️  No src/ directory found');
      return;
    }
    
    await this.scanDirectory(srcPath);
    
    if (this.errors.length === 0) {
      console.log('   ✅ No forbidden patterns found');
    }
  }

  /**
   * Recursively scan directory for violations
   */
  private async scanDirectory(dir: string): Promise<void> {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        if (!file.name.startsWith('.') && file.name !== 'node_modules') {
          await this.scanDirectory(fullPath);
        }
      } else if (file.isFile()) {
        const ext = path.extname(file.name);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          await this.scanFile(fullPath);
        }
      }
    }
  }

  /**
   * Scan single file for violations
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    for (const forbidden of this.schema.forbiddenPatterns || []) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(forbidden.pattern);
        
        if (matches) {
          // Check exceptions
          const isException = this.isException(relativePath, forbidden.exceptions);
          
          if (!isException) {
            // Check for architect approval
            const approval = this.checkArchitectApproval(lines, i);
            
            if (approval) {
              this.approvals.push({
                file: relativePath,
                line: i + 1,
                ...approval,
              });
              console.log(`   ✅ Approved deviation: ${relativePath}:${i + 1} (${approval.reason})`);
            } else {
              this.addError(
                `FORBIDDEN PATTERN '${forbidden.name}' found in ${relativePath}:${i + 1}\n` +
                `   Line: "${line.trim()}"`
              );
            }
          }
        }
      }
    }
  }

  /**
   * Check if file is in exception list
   */
  private isException(filePath: string, exceptions?: string[]): boolean {
    if (!exceptions) return false;
    
    return exceptions.some(exc => filePath.includes(exc));
  }

  /**
   * Check for architect approval comment
   * Format: // ARCHITECT_APPROVED: [reason] - [date] - [architect]
   */
  private checkArchitectApproval(lines: string[], lineIndex: number): ArchitectApproval | null {
    const approvalPattern = /\/\/\s*ARCHITECT_APPROVED:\s*(.+?)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*([A-Za-z\s]+)/;
    
    // Check same line
    const sameLine = lines[lineIndex];
    if (sameLine) {
      const match = sameLine.match(approvalPattern);
      if (match) {
        return {
          reason: match[1].trim(),
          date: match[2],
          architect: match[3].trim(),
        };
      }
    }
    
    // Check line above
    if (lineIndex > 0) {
      const lineAbove = lines[lineIndex - 1];
      if (lineAbove) {
        const match = lineAbove.match(approvalPattern);
        if (match) {
          return {
            reason: match[1].trim(),
            date: match[2],
            architect: match[3].trim(),
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Check required imports
   */
  private checkRequiredImports(): void {
    console.log('\n📦 Checking required imports...');
    
    for (const [filePath, imports] of Object.entries(this.schema.requiredImports || {})) {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        this.addWarning(`File ${filePath} not found (skipping import check)`);
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      for (const requiredImport of imports) {
        if (!content.includes(requiredImport)) {
          this.addError(`MISSING IMPORT in ${filePath}: ${requiredImport}`);
        }
      }
    }
    
    if (this.errors.length === 0) {
      console.log('   ✅ All required imports present');
    }
  }

  /**
   * Check package.json and package-lock.json sync
   */
  private checkPackageLockSync(): void {
    console.log('\n🔒 Checking package-lock.json sync...');
    
    const packageJson = path.join(process.cwd(), 'package.json');
    const packageLock = path.join(process.cwd(), 'package-lock.json');
    
    if (!fs.existsSync(packageJson) || !fs.existsSync(packageLock)) {
      this.addError('package.json or package-lock.json missing');
      return;
    }
    
    try {
      const pkgData = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      const lockData = JSON.parse(fs.readFileSync(packageLock, 'utf-8'));
      
      if (pkgData.name !== lockData.name) {
        this.addError('package.json and package-lock.json name mismatch');
        return;
      }
      
      console.log('   ✅ package-lock.json in sync');
    } catch (err) {
      this.addError(`Error checking package files: ${err.message}`);
    }
  }

  /**
   * Add error message
   */
  private addError(message: string): void {
    this.errors.push(message);
  }

  /**
   * Add warning message
   */
  private addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Get validation result
   */
  private getResult(): ValidationResult {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 VALIDATION RESULTS');
    console.log('═══════════════════════════════════════════════════');

    // Show approvals
    if (this.approvals.length > 0) {
      console.log('\n✅ ARCHITECT APPROVALS:');
      this.approvals.forEach(a => {
        console.log(`   📄 ${a.file}:${a.line}`);
        console.log(`      Reason: ${a.reason}`);
        console.log(`      Approved by: ${a.architect} on ${a.date}`);
      });
    }

    // Show warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(w => console.log(`   ${w}`));
    }

    // Show errors
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(e => console.log(`   ${e}`));
      console.log('\n❌ COMMIT BLOCKED - Fix errors above!');
      console.log('\n💡 TIP: Add architect approval to allow:');
      console.log('   // ARCHITECT_APPROVED: [reason] - YYYY-MM-DD - [name]');
      console.log('═══════════════════════════════════════════════════\n');
      
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        approvals: this.approvals,
      };
    }

    console.log('\n✅ ALL CHECKS PASSED');
    console.log('✅ Commit allowed');
    console.log('═══════════════════════════════════════════════════\n');

    return {
      success: true,
      errors: [],
      warnings: this.warnings,
      approvals: this.approvals,
    };
  }
}

/**
 * Main validation function for CLI
 */
export async function validateGuardian(options: { schema: string; verbose?: boolean }): Promise<ValidationResult> {
  // Load schema
  const schemaPath = path.resolve(process.cwd(), options.schema);
  const schema: GuardianSchema = await import(schemaPath).then(m => m.default || m.SCHEMA);
  
  // Run validation
  const guardian = new Guardian(schema);
  return guardian.validate();
}

export { ArchitectApproval, GuardianSchema, ValidationResult };

