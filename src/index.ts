/**
 * Guardian + Cerber - Main Entry Point
 * @package cerber-core
 * @version 2.0.0
 */

export { Cerber, makeIssue, runHealthChecks } from './cerber/index.js';
export { Guardian } from './guardian/index.js';
export * from './types.js';

// v2.0 exports
export { RuleManager } from './rules/index.js';
export type { Rule, RuleConfig } from './rules/index.js';
export { SemanticComparator } from './semantic/SemanticComparator.js';
export type {
    ComparisonResult, ContractAST, Fix, Violation, WorkflowAST
} from './semantic/SemanticComparator.js';



