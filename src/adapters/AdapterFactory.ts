/**
 * @file Adapter Factory and Registry
 * @rule ONE adapter factory per tool name (AGENTS.md §1)
 * Centralized management of adapter lifecycle
 */

import type { Adapter, AdapterResult, AdapterRunOptions } from './types.js';

/**
 * Adapter registration configuration
 */
export interface AdapterRegistration {
  /** Unique adapter name (lowercase) */
  name: string;
  
  /** Display name for output */
  displayName: string;
  
  /** Whether adapter is enabled */
  enabled: boolean;
  
  /** Factory function to create adapter instance */
  factory: () => Adapter;
}

/**
 * Adapter instance with metadata
 */
interface AdapterInstance {
  registration: AdapterRegistration;
  instance: Adapter | null;
  cached: boolean;
}

/**
 * Adapter Factory and Registry
 * Manages adapter lifecycle, caching, and execution
 * 
 * @rule Per AGENTS.md §3 - Deterministic execution, cached instances
 */
export class AdapterFactory {
  private registry: Map<string, AdapterInstance> = new Map();
  private enableCache: boolean = true;

  /**
   * Register an adapter
   */
  register(config: AdapterRegistration): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Adapter name must be a non-empty string');
    }

    if (config.name !== config.name.toLowerCase()) {
      throw new Error(`Adapter name must be lowercase: ${config.name}`);
    }

    this.registry.set(config.name, {
      registration: config,
      instance: null,
      cached: false
    });
  }

  /**
   * Get or create adapter instance
   * @rule Per AGENTS.md §3 - Cache instances for performance
   */
  getAdapter(name: string): Adapter | null {
    const entry = this.registry.get(name);
    
    if (!entry) {
      return null;
    }

    if (!entry.registration.enabled) {
      return null;
    }

    // Return cached instance if available
    if (this.enableCache && entry.cached && entry.instance) {
      return entry.instance;
    }

    // Create new instance
    try {
      const instance = entry.registration.factory();
      
      if (this.enableCache) {
        entry.instance = instance;
        entry.cached = true;
      }

      return instance;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all registered adapters
   */
  getRegistrations(): AdapterRegistration[] {
    return Array.from(this.registry.values())
      .map(entry => entry.registration);
  }

  /**
   * Get all enabled adapters
   */
  getEnabledAdapters(): string[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.registration.enabled)
      .map(entry => entry.registration.name);
  }

  /**
   * Check if adapter is registered
   */
  isRegistered(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(name: string): boolean {
    const entry = this.registry.get(name);
    return entry?.registration.enabled ?? false;
  }

  /**
   * Disable caching (useful for testing)
   */
  disableCache(): void {
    this.enableCache = false;
    this.clearCache();
  }

  /**
   * Enable caching
   */
  enableCaching(): void {
    this.enableCache = true;
  }

  /**
   * Clear all cached instances
   */
  clearCache(): void {
    for (const entry of this.registry.values()) {
      entry.instance = null;
      entry.cached = false;
    }
  }

  /**
   * Execute multiple adapters in parallel
   * @rule Per AGENTS.md §3 - Parallel execution for performance
   */
  async executeAdapters(
    toolNames: string[],
    options: AdapterRunOptions
  ): Promise<AdapterResult[]> {
    const promises = toolNames.map(async name => {
      const adapter = this.getAdapter(name);
      
      if (!adapter) {
        return {
          tool: name,
          version: 'unknown',
          exitCode: 126, // Tool not found
          violations: [],
          executionTime: 0,
          skipped: true,
          skipReason: 'Adapter not available'
        } as AdapterResult;
      }

      try {
        const result = await adapter.run(options);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          tool: name,
          version: 'unknown',
          exitCode: 127, // Execution error
          violations: [],
          executionTime: 0,
          skipped: true,
          skipReason: `Execution failed: ${message}`
        } as AdapterResult;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get adapter count
   */
  getCount(): number {
    return this.registry.size;
  }

  /**
   * Get adapter metadata for output
   */
  getMetadata(name: string): { name: string; displayName: string; enabled: boolean } | null {
    const entry = this.registry.get(name);
    
    if (!entry) {
      return null;
    }

    return {
      name: entry.registration.name,
      displayName: entry.registration.displayName,
      enabled: entry.registration.enabled
    };
  }

  /**
   * Reset factory (clear all registrations)
   */
  reset(): void {
    this.registry.clear();
    this.clearCache();
  }
}

/**
 * Singleton instance for global adapter management
 */
export const defaultAdapterFactory = new AdapterFactory();
