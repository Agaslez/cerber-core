/**
 * @file Prometheus Metrics - Production monitoring
 * @rule Per PRODUCTION HARDENING PLAN - P0: Observability
 */

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics registry
 */
export const register = new Registry();

/**
 * Collect default Node.js metrics (memory, CPU, event loop)
 */
collectDefaultMetrics({ register });

/**
 * Orchestrator metrics
 */
export const metrics = {
  /**
   * Total orchestrator runs
   * Labels: profile, status (success/error)
   */
  orchestratorRuns: new Counter({
    name: 'cerber_orchestrator_runs_total',
    help: 'Total number of orchestrator runs',
    labelNames: ['profile', 'status'],
    registers: [register],
  }),

  /**
   * Orchestrator execution duration
   * Labels: profile
   * Buckets: 0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s
   */
  orchestratorDuration: new Histogram({
    name: 'cerber_orchestrator_duration_seconds',
    help: 'Orchestrator execution duration in seconds',
    labelNames: ['profile'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register],
  }),

  /**
   * Adapter errors
   * Labels: adapter, error_type (timeout/not_found/crash/circuit_open)
   */
  adapterErrors: new Counter({
    name: 'cerber_adapter_errors_total',
    help: 'Total number of adapter errors',
    labelNames: ['adapter', 'error_type'],
    registers: [register],
  }),

  /**
   * Adapter execution duration
   * Labels: adapter
   */
  adapterDuration: new Histogram({
    name: 'cerber_adapter_duration_seconds',
    help: 'Adapter execution duration in seconds',
    labelNames: ['adapter'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
    registers: [register],
  }),

  /**
   * Violations found
   * Labels: adapter, severity (error/warning/info)
   */
  violations: new Counter({
    name: 'cerber_violations_total',
    help: 'Total number of violations found',
    labelNames: ['adapter', 'severity'],
    registers: [register],
  }),

  /**
   * Adapter cache hit rate
   * Labels: adapter
   */
  cacheHits: new Counter({
    name: 'cerber_adapter_cache_hits_total',
    help: 'Total number of adapter cache hits',
    labelNames: ['adapter'],
    registers: [register],
  }),

  /**
   * Adapter cache misses
   * Labels: adapter
   */
  cacheMisses: new Counter({
    name: 'cerber_adapter_cache_misses_total',
    help: 'Total number of adapter cache misses',
    labelNames: ['adapter'],
    registers: [register],
  }),

  /**
   * Deduplication efficiency
   * Histogram: percentage of violations deduplicated (0-100)
   */
  deduplicationRate: new Histogram({
    name: 'cerber_deduplication_rate',
    help: 'Percentage of violations deduplicated',
    buckets: [0, 10, 25, 50, 75, 90, 100],
    registers: [register],
  }),

  /**
   * Files processed
   * Labels: profile
   */
  filesProcessed: new Counter({
    name: 'cerber_files_processed_total',
    help: 'Total number of files processed',
    labelNames: ['profile'],
    registers: [register],
  }),

  /**
   * Current running adapters
   * Gauge: current number of running adapters
   */
  runningAdapters: new Gauge({
    name: 'cerber_running_adapters',
    help: 'Current number of running adapters',
    registers: [register],
  }),

  /**
   * Adapter cache size
   * Gauge: current number of cached adapters
   */
  cacheSize: new Gauge({
    name: 'cerber_adapter_cache_size',
    help: 'Current number of cached adapters',
    registers: [register],
  }),
};

/**
 * Get metrics in Prometheus format
 * @returns Metrics text (for /metrics endpoint)
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics as JSON (for debugging)
 */
export async function getMetricsJSON(): Promise<unknown> {
  return register.getMetricsAsJSON();
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  register.clear();
}

/**
 * Timer helper for histograms
 * @example
 * const timer = metrics.orchestratorDuration.startTimer({ profile: 'dev' });
 * // ... do work ...
 * timer(); // Records duration
 */
export function startTimer(histogram: Histogram<string>) {
  return histogram.startTimer();
}

/**
 * Increment counter helper
 */
export function incrementCounter(
  counter: Counter<string>,
  labels: Record<string, string | number>,
  value = 1
): void {
  counter.inc(labels, value);
}

/**
 * Record histogram value helper
 */
export function recordHistogram(
  histogram: Histogram<string>,
  labels: Record<string, string | number>,
  value: number
): void {
  histogram.observe(labels, value);
}

/**
 * Set gauge value helper
 */
export function setGauge(
  gauge: Gauge<string>,
  labels: Record<string, string | number> | undefined,
  value: number
): void {
  if (labels) {
    gauge.set(labels, value);
  } else {
    gauge.set(value);
  }
}
