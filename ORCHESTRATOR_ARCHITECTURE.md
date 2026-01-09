# 🎯 ORCHESTRATOR ARCHITECTURE - FUTURE-PROOF CORE

**Analiza architektury Orchestratora pod kątem przyszłych wymagań**

---

## 📊 STATUS: Obecna implementacja vs Przyszłość

### ✅ CO MAMY (Phase 1.6 - COMPLETE)

**Podstawowy Orchestrator:**
- ✅ Adapter registry (łatwa rozbudowa)
- ✅ Parallel/sequential execution
- ✅ Graceful degradation (adapter fails → continue)
- ✅ Deterministic output (sorted violations)
- ✅ Summary statistics (errors/warnings/info)
- ✅ Metadata tracking (version, exitCode, skipped)
- ✅ 20 tests passing (mock-based)

**Obecna struktura:**
```typescript
class Orchestrator {
  - register(adapter)           // ✅ Extensible
  - getAdapter(name)            // ✅ Simple
  - listAdapters()              // ✅ Discovery
  - run(options)                // ✅ Basic execution
  - runParallel()               // ✅ Performance
  - runSequential()             // ✅ Determinism
  - mergeResults()              // ✅ Unified output
  - sortViolations()            // ✅ Deterministic
}
```

---

## 🚨 CO NAM BRAKUJE (Critical Gaps)

### 1. ❌ HEALTH CHECK & MONITORING

**Problem:** Orchestrator nie wie czy tools są gotowe do działania

**Potrzebne:**
```typescript
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    adapters: AdapterHealth[];
    system: SystemHealth;
    performance: PerformanceMetrics;
  };
  timestamp: string;
}

interface AdapterHealth {
  name: string;
  installed: boolean;
  version: string | null;
  responsive: boolean;           // ❌ BRAK
  lastCheck: string;
  lastError?: string;
}

interface SystemHealth {
  diskSpace: number;             // ❌ BRAK
  memory: number;                // ❌ BRAK
  cpuLoad: number;               // ❌ BRAK
  gitAvailable: boolean;         // ❌ BRAK
}

class Orchestrator {
  // ❌ MISSING METHODS
  async healthCheck(): Promise<HealthCheck>
  async validateAdapter(name: string): Promise<AdapterHealth>
  async getSystemMetrics(): Promise<SystemHealth>
}
```

**Dlaczego to krytyczne:**
- `cerber doctor` - pokazuje status wszystkich tools
- `cerber validate --health-check` - sprawdza przed uruchomieniem
- CI monitoring - wykrywa problemy przed failem

---

### 2. ❌ WALIDACJA WEJŚCIOWA/WYJŚCIOWA

**Problem:** Orchestrator przyjmuje dane bez walidacji

**Potrzebne:**
```typescript
interface InputValidator {
  validateFiles(files: string[]): ValidationResult;
  validateOptions(options: OrchestratorRunOptions): ValidationResult;
  sanitizePaths(paths: string[]): string[];
}

interface OutputValidator {
  validateResult(result: OrchestratorResult): ValidationResult;
  validateViolations(violations: Violation[]): ValidationResult;
  checkSchema(data: unknown): boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

class Orchestrator {
  // ❌ MISSING VALIDATION
  private inputValidator: InputValidator;
  private outputValidator: OutputValidator;
  
  async run(options: OrchestratorRunOptions) {
    // ❌ Brak walidacji na wejściu
    const validation = this.inputValidator.validateOptions(options);
    if (!validation.valid) {
      throw new InvalidInputError(validation.errors);
    }
    
    // ... execution ...
    
    // ❌ Brak walidacji na wyjściu
    const resultValidation = this.outputValidator.validateResult(result);
    if (!resultValidation.valid) {
      // Self-healing: próba naprawy lub graceful fail
    }
    
    return result;
  }
}
```

**Przykłady walidacji:**
- Path traversal attack: `../../../etc/passwd` → BLOCK
- Empty files array → WARNING
- Invalid adapter names → ERROR
- Malformed violations → SANITIZE or SKIP
- Schema mismatch → LOG + CONTINUE

---

### 3. ❌ SELF-HEALING & AUTO-RECOVERY

**Problem:** Orchestrator nie próbuje naprawić problemów

**Potrzebne:**
```typescript
interface SelfHealing {
  strategy: 'retry' | 'fallback' | 'skip' | 'abort';
  maxRetries: number;
  backoff: 'linear' | 'exponential';
  timeout: number;
}

interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  recover: () => Promise<void>;
}

class Orchestrator {
  private healingStrategies: RecoveryStrategy[] = [];
  
  // ❌ MISSING RECOVERY
  async runWithHealing(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    try {
      return await this.run(options);
    } catch (error) {
      // Try self-healing
      for (const strategy of this.healingStrategies) {
        if (strategy.condition(error)) {
          await strategy.recover();
          return await this.run(options); // Retry
        }
      }
      throw error; // Can't recover
    }
  }
  
  registerHealingStrategy(strategy: RecoveryStrategy): void {
    this.healingStrategies.push(strategy);
  }
}
```

**Przykładowe strategie:**
- **Tool not found** → Auto-install (if `--auto-install`)
- **Tool crashed** → Retry with timeout
- **Network error** (download) → Exponential backoff
- **Out of memory** → Run adapters sequentially
- **Version mismatch** → Downgrade to compatible
- **Corrupted cache** → Clear & re-download

---

### 4. ❌ MONITORING & TELEMETRY

**Problem:** Nie wiemy co się dzieje w Orchestratorze

**Potrzebne:**
```typescript
interface TelemetryEvent {
  type: 'adapter_start' | 'adapter_end' | 'error' | 'warning';
  adapter?: string;
  duration?: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetrics {
  totalDuration: number;
  adapterDurations: Record<string, number>;
  parallelism: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
}

class Orchestrator {
  private telemetry: TelemetryCollector;
  
  // ❌ MISSING TELEMETRY
  async run(options: OrchestratorRunOptions) {
    this.telemetry.start('orchestrator.run');
    this.telemetry.event('run.started', { adapters: adapterNames });
    
    try {
      // ... execution ...
      this.telemetry.event('adapter.started', { name: adapter.name });
      const result = await adapter.run(opts);
      this.telemetry.event('adapter.completed', { 
        name: adapter.name, 
        duration: result.executionTime,
        violations: result.violations.length
      });
    } catch (error) {
      this.telemetry.error('adapter.failed', error);
    }
    
    this.telemetry.end('orchestrator.run');
    return result;
  }
  
  getMetrics(): PerformanceMetrics {
    return this.telemetry.getMetrics();
  }
}
```

**Use cases:**
- **Performance profiling:** Który adapter jest najwolniejszy?
- **Error tracking:** Które błędy się powtarzają?
- **Usage analytics:** Ile razy każdy adapter jest używany?
- **CI dashboards:** Wykresy czasu wykonania w czasie

---

### 5. ❌ SELF-TESTING & VERIFICATION

**Problem:** Orchestrator nie sprawdza sam siebie

**Potrzebne:**
```typescript
interface SelfTest {
  name: string;
  run(): Promise<SelfTestResult>;
}

interface SelfTestResult {
  passed: boolean;
  duration: number;
  message: string;
  details?: unknown;
}

class Orchestrator {
  // ❌ MISSING SELF-TESTS
  async selfTest(): Promise<SelfTestResult[]> {
    const tests: SelfTest[] = [
      {
        name: 'adapters_registered',
        run: async () => {
          const adapters = this.listAdapters();
          return {
            passed: adapters.length > 0,
            message: `${adapters.length} adapters registered`,
            duration: 0
          };
        }
      },
      {
        name: 'adapters_responsive',
        run: async () => {
          const results = await Promise.all(
            this.listAdapters().map(name => 
              this.getAdapter(name)?.detect()
            )
          );
          const responsive = results.filter(r => r !== undefined);
          return {
            passed: responsive.length === results.length,
            message: `${responsive.length}/${results.length} responsive`,
            duration: 0
          };
        }
      },
      {
        name: 'system_ready',
        run: async () => {
          // Check disk space, memory, git available
          return { passed: true, message: 'System OK', duration: 0 };
        }
      }
    ];
    
    return Promise.all(tests.map(t => t.run()));
  }
  
  async verify(): Promise<boolean> {
    const results = await this.selfTest();
    return results.every(r => r.passed);
  }
}
```

**Use cases:**
- `cerber self-test` - sprawdza czy Cerber działa poprawnie
- `cerber doctor --verify` - głęboka diagnostyka
- CI healthcheck - `docker exec cerber cerber self-test`

---

### 6. ❌ SUPPORT FOR SOLO/DEV/TEAMS MODES

**Problem:** Orchestrator nie wie w jakim trybie działa

**Potrzebne:**
```typescript
type ExecutionMode = 'solo' | 'dev' | 'team';

interface ModeConfig {
  mode: ExecutionMode;
  features: {
    autoInstall: boolean;        // solo: true, team: false
    parallel: boolean;            // solo: true, team: true
    strictValidation: boolean;    // solo: false, team: true
    telemetry: boolean;           // solo: false, team: true
    caching: boolean;             // solo: true, team: true
  };
  limits: {
    timeout: number;              // solo: 60s, team: 300s
    maxAdapters: number;          // solo: unlimited, team: unlimited
    maxFiles: number;             // solo: unlimited, team: 10000
  };
}

class Orchestrator {
  private mode: ExecutionMode = 'solo';
  private config: ModeConfig;
  
  // ❌ MISSING MODE SUPPORT
  setMode(mode: ExecutionMode): void {
    this.mode = mode;
    this.config = this.loadModeConfig(mode);
  }
  
  async run(options: OrchestratorRunOptions) {
    // Apply mode-specific configuration
    const effectiveOptions = {
      ...options,
      parallel: this.config.features.parallel,
      timeout: options.timeout ?? this.config.limits.timeout
    };
    
    // Mode-specific behavior
    if (this.mode === 'team' && this.config.features.strictValidation) {
      // Enforce stricter rules
    }
    
    return this.runWithConfig(effectiveOptions);
  }
}
```

**Mode differences:**

| Feature | Solo | Dev | Team |
|---------|------|-----|------|
| Auto-install | ✅ Yes | ⚠️ Warn | ❌ No |
| Strict validation | ❌ No | ⚠️ Warn | ✅ Yes |
| Telemetry | ❌ No | ⚠️ Opt-in | ✅ Yes |
| Caching | ✅ Local | ✅ Local | ✅ Shared |
| Timeout | 60s | 120s | 300s |
| Error handling | Graceful | Graceful | Strict |

---

### 7. ❌ JEDNA PRAWDA (ONE TRUTH) - CONTRACT INTEGRATION

**Problem:** Orchestrator ignoruje kontrakt

**Potrzebne:**
```typescript
interface Contract {
  contractVersion: number;
  target: 'github-actions' | 'gitlab-ci' | 'generic-yaml';
  tools: {
    [name: string]: {
      enabled: boolean;
      version?: string;
      config?: Record<string, unknown>;
    };
  };
  rules: {
    severity: 'error' | 'warning' | 'info';
    enabled: boolean;
  }[];
}

class Orchestrator {
  private contract: Contract | null = null;
  
  // ❌ MISSING CONTRACT SUPPORT
  async loadContract(path: string): Promise<void> {
    this.contract = await ContractLoader.load(path);
  }
  
  async run(options: OrchestratorRunOptions) {
    // Apply contract overrides
    if (this.contract) {
      const enabledAdapters = Object.entries(this.contract.tools)
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name);
      
      options.adapters = options.adapters?.filter(
        name => enabledAdapters.includes(name)
      ) ?? enabledAdapters;
    }
    
    return this.runWithContract(options);
  }
  
  async validateContract(): Promise<ValidationResult> {
    // Sprawdź czy contract jest zgodny z dostępnymi adapters
    // ❌ BRAK
  }
}
```

---

## 🎯 ARCHITEKTURA DOCELOWA (Target Architecture)

### Warstwy Orchestratora:

```
┌─────────────────────────────────────────────────┐
│              PUBLIC API                         │
│  run() | healthCheck() | selfTest() | doctor()  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│           VALIDATION LAYER                      │
│  Input Validator | Output Validator | Sanitizer │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│           ORCHESTRATION CORE                    │
│  Adapter Registry | Execution Engine | Merger   │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│        RELIABILITY LAYER                        │
│  Self-Healing | Retry | Fallback | Circuit Break│
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│        OBSERVABILITY LAYER                      │
│  Telemetry | Metrics | Logging | Health Checks  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│           ADAPTER LAYER                         │
│  actionlint | zizmor | gitleaks | ratchet | ... │
└─────────────────────────────────────────────────┘
```

---

## 🔧 PLAN ROZBUDOWY (Roadmap)

### Phase 1.7: Validation Layer (Day 7) - 6h
**Priority: HIGH** - Security & stability

- ✅ InputValidator
- ✅ OutputValidator
- ✅ Path sanitization (prevent `../../../`)
- ✅ Schema validation (zod)
- ✅ Tests (20+)

### Phase 1.8: Health Check System (Day 7) - 4h
**Priority: HIGH** - `cerber doctor` dependency

- ✅ AdapterHealth interface
- ✅ SystemHealth metrics
- ✅ healthCheck() method
- ✅ validateAdapter() method
- ✅ Tests (15+)

### Phase 2.4: Self-Healing (Day 10) - 6h
**Priority: MEDIUM** - Auto-recovery

- ✅ RecoveryStrategy interface
- ✅ runWithHealing() method
- ✅ Built-in strategies (retry, fallback, skip)
- ✅ Tests (20+)

### Phase 2.5: Monitoring & Telemetry (Day 10) - 4h
**Priority: MEDIUM** - Observability

- ✅ TelemetryCollector
- ✅ PerformanceMetrics
- ✅ Event tracking
- ✅ getMetrics() method
- ✅ Tests (15+)

### Phase 2.6: Self-Testing (Day 10) - 2h
**Priority: MEDIUM** - `cerber self-test`

- ✅ SelfTest interface
- ✅ selfTest() method
- ✅ verify() method
- ✅ Tests (10+)

### Phase 3.3: Mode Support (Day 12) - 4h
**Priority: HIGH** - Business model

- ✅ ExecutionMode type
- ✅ ModeConfig
- ✅ setMode() method
- ✅ Mode-specific behavior
- ✅ Tests (15+)

### Phase 3.4: Contract Integration (Day 12) - 4h
**Priority: HIGH** - "One Truth"

- ✅ loadContract() method
- ✅ Contract-driven execution
- ✅ validateContract() method
- ✅ Override rules from contract
- ✅ Tests (20+)

---

## 📊 DECISION MATRIX (Co implementować teraz?)

### MUST HAVE (Phase 2 - Next 3 days):
1. ✅ **Validation Layer** - Security + stability
2. ✅ **Health Check** - Needed for `cerber doctor`
3. ✅ **Mode Support** - Business requirement (solo/dev/team)
4. ✅ **Contract Integration** - "One Truth" principle

### SHOULD HAVE (Phase 3-4):
5. ⚠️ **Self-Healing** - Nice to have, not critical
6. ⚠️ **Monitoring** - Useful for teams, optional for solo
7. ⚠️ **Self-Testing** - Great for debugging, not MVP

### COULD HAVE (Phase 5+):
8. 💡 **Advanced telemetry** - Analytics, dashboards
9. 💡 **Distributed caching** - Team performance
10. 💡 **Plugin marketplace** - Community adapters

---

## ✅ OBECNY ORCHESTRATOR - OCENA

### Co jest SOLID:
- ✅ **Single Responsibility** - Orchestrates, doesn't implement
- ✅ **Open/Closed** - Easy to add adapters
- ✅ **Liskov Substitution** - Adapter interface
- ✅ **Interface Segregation** - Clean contracts
- ✅ **Dependency Inversion** - Abstractions over concrete

### Co wymaga wzmocnienia:
- ⚠️ **Brak walidacji** - Przyjmuje dane "na ślepo"
- ⚠️ **Brak health checks** - Nie wie czy tools działają
- ⚠️ **Brak monitoringu** - Black box
- ⚠️ **Brak recovery** - Fail fast bez prób naprawy
- ⚠️ **Brak mode awareness** - Traktuje solo i team tak samo

---

## 🎯 REKOMENDACJA

**Obecny Orchestrator (Phase 1.6) jest SOLID foundation, ale wymaga:**

### Krytyczne (Do Phase 2):
1. **Validation Layer** (6h) - Bezpieczeństwo + stabilność
2. **Health Check System** (4h) - Dla `cerber doctor`
3. **Mode Support** (4h) - Solo/dev/team różnice
4. **Contract Integration** (4h) - "Jedna prawda"

### Opcjonalne (Phase 3+):
5. **Self-Healing** (6h) - Auto-recovery
6. **Monitoring** (4h) - Telemetria
7. **Self-Testing** (2h) - Diagnostyka

**Total:** 18h krytycznych + 12h opcjonalnych = **30h rozbudowy**

**Wniosek:** Obecny core jest **dobry, ale niepełny**. Potrzebuje warstw walidacji, health check i contract integration aby być production-ready. Self-healing i monitoring to "nice to have" dla zespołów.

---

## 📝 NEXT STEPS

1. ✅ **Review this document** - Czy zgadzasz się z analizą?
2. ⏭️ **Implement Phase 1.7-1.8** - Validation + Health Check (10h)
3. ⏭️ **Continue Phase 2** - CLI commands (integrate with new layers)
4. ⏭️ **Phase 3** - Mode support + Contract integration

**Pytanie do użytkownika:** Czy zaczynam implementację Validation Layer + Health Check (Phase 1.7-1.8)?
