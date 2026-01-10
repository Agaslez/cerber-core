# Observability & Monitoring

**Production Hardening - Phase P0**

Cerber Core includes comprehensive observability features for production deployment:
- Structured logging (Pino)
- Prometheus metrics
- Request tracing
- Error context preservation

---

## 📊 Structured Logging

### Configuration

```typescript
import { createLogger, createChildLogger } from './core/logger';

// Default logger (auto-configured based on NODE_ENV)
import { logger } from './core/logger';

// Custom logger
const customLogger = createLogger({
  level: 'debug',        // trace | debug | info | warn | error | fatal
  pretty: true,          // Pretty print (auto in development)
  name: 'my-service'
});

// Child logger with context
const log = createChildLogger({ 
  operation: 'orchestrator.run',
  runId: '12345'
});
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `trace` | Very detailed debugging | Function entry/exit |
| `debug` | Debug information | Cache hit/miss, internal state |
| `info` | Normal operations | Orchestration start/end |
| `warn` | Warning conditions | Dedup limit reached |
| `error` | Error conditions | Adapter failed |
| `fatal` | Critical failures | System crash |

### Environment Variables

```bash
# Set log level
LOG_LEVEL=debug

# Production mode (JSON output)
NODE_ENV=production

# Development mode (pretty output)
NODE_ENV=development
```

### Log Output Examples

**Development (pretty):**
```
14:23:45 INFO - Starting orchestration
  operation: "orchestrator.run"
  runId: "1704902625-abc123"
  tools: ["actionlint", "zizmor"]
  filesCount: 5
```

**Production (JSON):**
```json
{
  "level": "info",
  "time": "2026-01-10T14:23:45.123Z",
  "pid": 12345,
  "hostname": "prod-server-01",
  "operation": "orchestrator.run",
  "runId": "1704902625-abc123",
  "tools": ["actionlint", "zizmor"],
  "filesCount": 5,
  "msg": "Starting orchestration"
}
```

### Error Logging

```typescript
import { logError } from './core/logger';

try {
  // ... operation ...
} catch (error) {
  logError('Operation failed', error, {
    adapter: 'actionlint',
    exitCode: 127,
    errorType: 'not_found'
  });
}
```

**Error Output:**
```json
{
  "level": "error",
  "error": {
    "name": "Error",
    "message": "Command not found: actionlint",
    "stack": "Error: Command not found...",
    "code": "ENOENT",
    "syscall": "spawn"
  },
  "adapter": "actionlint",
  "exitCode": 127,
  "errorType": "not_found",
  "msg": "Operation failed"
}
```

### Request Tracing

```typescript
import { generateRequestId, createChildLogger } from './core/logger';

// Generate unique request ID
const runId = generateRequestId();

// Create logger with runId for tracing
const log = createChildLogger({ runId });

// All subsequent logs will include runId
log.info('Step 1');
log.info('Step 2');
```

---

## 📈 Prometheus Metrics

### Metrics Endpoint

```typescript
import { getMetrics } from './core/metrics';

// In your HTTP server
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await getMetrics());
});
```

### Available Metrics

#### Orchestrator Metrics

**`cerber_orchestrator_runs_total`** (Counter)
- Total number of orchestrator runs
- Labels: `profile`, `status` (success/error)

**`cerber_orchestrator_duration_seconds`** (Histogram)
- Orchestrator execution duration
- Labels: `profile`
- Buckets: 0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s

**`cerber_files_processed_total`** (Counter)
- Total files processed
- Labels: `profile`

#### Adapter Metrics

**`cerber_adapter_errors_total`** (Counter)
- Total adapter errors
- Labels: `adapter`, `error_type` (timeout/not_found/crash/circuit_open)

**`cerber_adapter_duration_seconds`** (Histogram)
- Adapter execution duration
- Labels: `adapter`
- Buckets: 0.1s, 0.5s, 1s, 2s, 5s, 10s, 20s, 30s

**`cerber_adapter_cache_hits_total`** (Counter)
- Total cache hits
- Labels: `adapter`

**`cerber_adapter_cache_misses_total`** (Counter)
- Total cache misses
- Labels: `adapter`

**`cerber_adapter_cache_size`** (Gauge)
- Current number of cached adapters

**`cerber_running_adapters`** (Gauge)
- Current number of running adapters

#### Violation Metrics

**`cerber_violations_total`** (Counter)
- Total violations found
- Labels: `adapter`, `severity` (error/warning/info)

**`cerber_deduplication_rate`** (Histogram)
- Percentage of violations deduplicated
- Buckets: 0%, 10%, 25%, 50%, 75%, 90%, 100%

#### Node.js Metrics (Default)

- `process_cpu_user_seconds_total` - CPU usage
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_heap_size_used_bytes` - Heap used
- `nodejs_event_loop_lag_seconds` - Event loop lag
- And more...

### Usage Examples

```typescript
import { metrics } from './core/metrics';

// Increment counter
metrics.orchestratorRuns.inc({ 
  profile: 'dev', 
  status: 'success' 
});

// Record histogram
const timer = metrics.orchestratorDuration.startTimer({ profile: 'dev' });
// ... do work ...
timer(); // Records duration

// Set gauge
metrics.cacheSize.set(10);

// Increment gauge
metrics.runningAdapters.inc();
metrics.runningAdapters.dec();
```

---

## 📊 Grafana Dashboard

### Recommended Panels

#### 1. Throughput
```promql
# Requests per second
rate(cerber_orchestrator_runs_total[5m])
```

#### 2. Latency (P50, P95, P99)
```promql
# P50
histogram_quantile(0.5, rate(cerber_orchestrator_duration_seconds_bucket[5m]))

# P95
histogram_quantile(0.95, rate(cerber_orchestrator_duration_seconds_bucket[5m]))

# P99
histogram_quantile(0.99, rate(cerber_orchestrator_duration_seconds_bucket[5m]))
```

#### 3. Error Rate
```promql
# Error rate by adapter
rate(cerber_adapter_errors_total[5m])

# Overall error rate
sum(rate(cerber_orchestrator_runs_total{status="error"}[5m])) 
/ 
sum(rate(cerber_orchestrator_runs_total[5m]))
```

#### 4. Violations
```promql
# Violations per second by severity
rate(cerber_violations_total[5m])
```

#### 5. Cache Performance
```promql
# Cache hit rate
sum(rate(cerber_adapter_cache_hits_total[5m])) 
/ 
(
  sum(rate(cerber_adapter_cache_hits_total[5m])) + 
  sum(rate(cerber_adapter_cache_misses_total[5m]))
)
```

#### 6. Deduplication Efficiency
```promql
# Average deduplication rate
rate(cerber_deduplication_rate_sum[5m]) / rate(cerber_deduplication_rate_count[5m])
```

### Alerts

**High Error Rate:**
```yaml
alert: CerberHighErrorRate
expr: |
  sum(rate(cerber_adapter_errors_total[5m])) / sum(rate(cerber_orchestrator_runs_total[5m])) > 0.05
for: 5m
annotations:
  summary: "Cerber error rate > 5%"
```

**High Latency:**
```yaml
alert: CerberHighLatency
expr: |
  histogram_quantile(0.95, rate(cerber_orchestrator_duration_seconds_bucket[5m])) > 30
for: 5m
annotations:
  summary: "Cerber P95 latency > 30s"
```

**Circuit Breaker Open:**
```yaml
alert: CerberCircuitBreakerOpen
expr: |
  sum(rate(cerber_adapter_errors_total{error_type="circuit_open"}[5m])) > 0
for: 10m
annotations:
  summary: "Cerber circuit breaker open"
```

---

## 🔍 Debugging

### Enable Debug Logging

```bash
# Run with debug logs
LOG_LEVEL=debug npm run cerber validate

# Trace level (very verbose)
LOG_LEVEL=trace npm run cerber validate
```

### View Metrics Locally

```bash
# Start server with metrics endpoint
npm start

# View metrics
curl http://localhost:3000/metrics

# View as JSON
curl http://localhost:3000/metrics/json
```

### Common Issues

#### 1. No Logs Appearing

**Problem:** Logs not visible in output

**Solution:**
```bash
# Check log level
echo $LOG_LEVEL

# Set to debug
export LOG_LEVEL=debug

# Check NODE_ENV (production = JSON, development = pretty)
echo $NODE_ENV
```

#### 2. Metrics Not Updating

**Problem:** Metrics show 0 or outdated values

**Solution:**
```typescript
// Ensure metrics are incremented
metrics.orchestratorRuns.inc({ profile: 'dev', status: 'success' });

// Check metrics
console.log(await getMetricsJSON());
```

#### 3. Large Log Files

**Problem:** Log files growing too large

**Solution:**
- Use log rotation (logrotate, pm2, etc.)
- Adjust log level in production (info or warn)
- Stream logs to centralized system (ELK, Datadog)

---

## 🏭 Production Deployment

### Docker

```dockerfile
FROM node:20-alpine

ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Install app
WORKDIR /app
COPY . .
RUN npm ci --production

# Expose metrics port
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cerber-core
  labels:
    app: cerber-core
spec:
  ports:
  - name: metrics
    port: 3000
  selector:
    app: cerber-core
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: cerber-core
spec:
  selector:
    matchLabels:
      app: cerber-core
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### Environment Variables

```bash
# Production
NODE_ENV=production
LOG_LEVEL=info

# Development
NODE_ENV=development
LOG_LEVEL=debug

# CI
NODE_ENV=test
LOG_LEVEL=warn
```

---

## 📚 Best Practices

1. **Use Child Loggers** - Add context to every operation
2. **Set Appropriate Log Levels** - info in production, debug in development
3. **Monitor Key Metrics** - P95 latency, error rate, cache hit rate
4. **Set Up Alerts** - Error rate > 5%, P95 > 30s, circuit breaker open
5. **Log Errors with Full Context** - Stack trace, error code, operation details
6. **Use Request IDs** - Trace operations across logs
7. **Dashboard Everything** - Throughput, latency, errors, violations

---

**Next Steps:**
- Set up Grafana dashboard (see queries above)
- Configure alerts in Prometheus
- Integrate with your logging aggregation system
- Test in staging before production
