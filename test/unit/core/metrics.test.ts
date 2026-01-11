/**
 * @file Metrics Tests
 * @rule Per PRODUCTION HARDENING - P0: Observability
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import {
    getMetrics,
    getMetricsJSON,
    metrics
} from '../../../src/core/metrics.js';

describe('Metrics', () => {
  beforeEach(() => {
    // Reset all metrics to zero (without clearing definitions)
    metrics.orchestratorRuns.reset();
    metrics.orchestratorDuration.reset();
    metrics.adapterErrors.reset();
    metrics.violations.reset();
    metrics.cacheHits.reset();
    metrics.cacheMisses.reset();
    metrics.cacheSize.reset();
    metrics.runningAdapters.reset();
    metrics.deduplicationRate.reset();
    metrics.filesProcessed.reset();
  });

  describe('orchestratorRuns counter', () => {
    it('should increment orchestrator runs', async () => {
      metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });
      metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });
      
      const metricsJson = await getMetricsJSON() as any[];
      const orchestratorRuns = metricsJson.find(m => m.name === 'cerber_orchestrator_runs_total');
      const devSuccessMetric = orchestratorRuns?.values.find((v: any) => 
        v.labels.profile === 'dev' && v.labels.status === 'success'
      );
      
      expect(devSuccessMetric?.value).toBe(2);
    });

    it('should track different profiles separately', async () => {
      metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });
      metrics.orchestratorRuns.inc({ profile: 'team', status: 'success' });
      
      const metricsJson = await getMetricsJSON() as any[];
      const orchestratorRuns = metricsJson.find(m => m.name === 'cerber_orchestrator_runs_total');
      
      const devMetric = orchestratorRuns?.values.find((v: any) => v.labels.profile === 'dev');
      const teamMetric = orchestratorRuns?.values.find((v: any) => v.labels.profile === 'team');
      
      expect(devMetric?.value).toBe(1);
      expect(teamMetric?.value).toBe(1);
    });
  });

  describe('orchestratorDuration histogram', () => {
    it('should record duration', async () => {
      const timer = metrics.orchestratorDuration.startTimer({ profile: 'dev' });
      timer();
      
      const metricsJson = await getMetricsJSON() as any[];
      const duration = metricsJson.find(m => m.name === 'cerber_orchestrator_duration_seconds');
      const devMetric = duration?.values.find((v: any) => v.labels.profile === 'dev' && v.metricName?.includes('_sum'));
      
      expect(devMetric?.value).toBeGreaterThan(0);
    });

    it('should use correct buckets', async () => {
      // Buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
      metrics.orchestratorDuration.observe({ profile: 'dev' }, 0.5);
      metrics.orchestratorDuration.observe({ profile: 'dev' }, 5);
      
      const metricsJson = await getMetricsJSON() as any[];
      const duration = metricsJson.find(m => m.name === 'cerber_orchestrator_duration_seconds');
      const countMetric = duration?.values.find((v: any) => v.labels.profile === 'dev' && v.metricName?.includes('_count'));
      
      expect(countMetric?.value).toBe(2);
    });
  });

  describe('adapterErrors counter', () => {
    it('should count adapter errors by type', async () => {
      metrics.adapterErrors.inc({ adapter: 'actionlint', error_type: 'timeout' });
      metrics.adapterErrors.inc({ adapter: 'actionlint', error_type: 'timeout' });
      metrics.adapterErrors.inc({ adapter: 'actionlint', error_type: 'crash' });
      
      const metricsJson = await getMetricsJSON() as any[];
      const errors = metricsJson.find(m => m.name === 'cerber_adapter_errors_total');
      
      const timeoutMetric = errors?.values.find((v: any) => 
        v.labels.adapter === 'actionlint' && v.labels.error_type === 'timeout'
      );
      const crashMetric = errors?.values.find((v: any) => 
        v.labels.adapter === 'actionlint' && v.labels.error_type === 'crash'
      );
      
      expect(timeoutMetric?.value).toBe(2);
      expect(crashMetric?.value).toBe(1);
    });
  });

  describe('violations counter', () => {
    it('should count violations by severity', async () => {
      metrics.violations.inc({ adapter: 'actionlint', severity: 'error' }, 5);
      metrics.violations.inc({ adapter: 'actionlint', severity: 'warning' }, 3);
      
      const metricsJson = await getMetricsJSON() as any[];
      const violations = metricsJson.find(m => m.name === 'cerber_violations_total');
      
      const errorMetric = violations?.values.find((v: any) => 
        v.labels.adapter === 'actionlint' && v.labels.severity === 'error'
      );
      const warningMetric = violations?.values.find((v: any) => 
        v.labels.adapter === 'actionlint' && v.labels.severity === 'warning'
      );
      
      expect(errorMetric?.value).toBe(5);
      expect(warningMetric?.value).toBe(3);
    });
  });

  describe('cache metrics', () => {
    it('should track cache hits and misses', async () => {
      metrics.cacheHits.inc({ adapter: 'actionlint' });
      metrics.cacheHits.inc({ adapter: 'actionlint' });
      metrics.cacheMisses.inc({ adapter: 'actionlint' });
      
      const metricsJson = await getMetricsJSON() as any[];
      const hits = metricsJson.find(m => m.name === 'cerber_adapter_cache_hits_total');
      const misses = metricsJson.find(m => m.name === 'cerber_adapter_cache_misses_total');
      
      const hitsMetric = hits?.values.find((v: any) => v.labels.adapter === 'actionlint');
      const missesMetric = misses?.values.find((v: any) => v.labels.adapter === 'actionlint');
      
      expect(hitsMetric?.value).toBe(2);
      expect(missesMetric?.value).toBe(1);
    });

    it('should track cache size', async () => {
      metrics.cacheSize.set(5);
      
      const metricsJson = await getMetricsJSON() as any[];
      const cacheSize = metricsJson.find(m => m.name === 'cerber_adapter_cache_size');
      
      expect(cacheSize?.values[0]?.value).toBe(5);
    });
  });

  describe('deduplicationRate histogram', () => {
    it('should record deduplication percentage', async () => {
      metrics.deduplicationRate.observe(25.5);
      metrics.deduplicationRate.observe(75.0);
      
      const metricsJson = await getMetricsJSON() as any[];
      const dedupRate = metricsJson.find(m => m.name === 'cerber_deduplication_rate');
      const countMetric = dedupRate?.values.find((v: any) => v.metricName?.includes('_count'));
      const sumMetric = dedupRate?.values.find((v: any) => v.metricName?.includes('_sum'));
      
      expect(countMetric?.value).toBe(2);
      expect(sumMetric?.value).toBeCloseTo(100.5);
    });
  });

  describe('filesProcessed counter', () => {
    it('should count files processed', async () => {
      metrics.filesProcessed.inc({ profile: 'dev' }, 10);
      metrics.filesProcessed.inc({ profile: 'dev' }, 5);
      
      const metricsJson = await getMetricsJSON() as any[];
      const filesProcessed = metricsJson.find(m => m.name === 'cerber_files_processed_total');
      const devMetric = filesProcessed?.values.find((v: any) => v.labels.profile === 'dev');
      
      expect(devMetric?.value).toBe(15);
    });
  });

  describe('runningAdapters gauge', () => {
    it('should track running adapters', async () => {
      metrics.runningAdapters.set(3);
      
      let metricsJson = await getMetricsJSON() as any[];
      let runningAdapters = metricsJson.find(m => m.name === 'cerber_running_adapters');
      expect(runningAdapters?.values[0]?.value).toBe(3);
      
      metrics.runningAdapters.inc();
      metricsJson = await getMetricsJSON() as any[];
      runningAdapters = metricsJson.find(m => m.name === 'cerber_running_adapters');
      expect(runningAdapters?.values[0]?.value).toBe(4);
      
      metrics.runningAdapters.dec();
      metricsJson = await getMetricsJSON() as any[];
      runningAdapters = metricsJson.find(m => m.name === 'cerber_running_adapters');
      expect(runningAdapters?.values[0]?.value).toBe(3);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });
      
      const output = await getMetrics();
      
      expect(output).toContain('cerber_orchestrator_runs_total');
      expect(output).toContain('profile="dev"');
      expect(output).toContain('status="success"');
    });

    it('should include default Node.js metrics', async () => {
      const output = await getMetrics();
      
      expect(output).toContain('process_cpu_user_seconds_total');
      expect(output).toContain('nodejs_heap_size_total_bytes');
    });
  });

  describe('getMetricsJSON', () => {
    it('should return metrics as JSON', async () => {
      metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });
      
      const json = await getMetricsJSON();
      
      expect(Array.isArray(json)).toBe(true);
      expect((json as any[]).length).toBeGreaterThan(0);
    });
  });
});
