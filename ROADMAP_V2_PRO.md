# 🛡️ CERBER CORE V2.0 - PROFESSIONAL ROADMAP

**"Contract-Driven DevOps Orchestrator"**

---

## 📋 EXECUTIVE SUMMARY

**Obecny stan (v1.1.12):**
- ✅ 102/126 tests passing
- ✅ 5 templates (nodejs, docker, react, python, terraform)
- ✅ cerber-init command working
- ✅ Contract validation (semantic)
- ⚠️ Custom rule implementation (nie skaluje się)
- ⚠️ No tool orchestration

**Cel V2.0:**
- 🎯 **Orchestrator** - run proven tools (actionlint, zizmor, ratchet)
- 🎯 **One Truth** - .cerber/contract.yml + deterministic output
- 🎯 **Profiles** - solo/dev/team (business model)
- 🎯 **Guardian** - pre-commit (fast) + CI (complete)
- 🎯 **Doctor** - auto-detect + generate contract
- 🎯 **Universal** - not just GitHub Actions

**Timeline:** 4 tygodnie (20 dni roboczych)

---

## 📁 TARGET ARCHITECTURE - FOLDER STRUCTURE

**Cel:** Universal orchestrator with targets (GitHub Actions, GitLab CI, generic YAML)

```
cerber-core/
├─ CERBER.md                          # "Księga" – jedna prawda: zasady, kontrakty, format wyników
├─ AGENTS.md                          # Rules for AI agents (Phase 0)
├─ README.md
├─ LICENSE
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts                        # Public API (validate/run)
│  ├─ cli/
│  │  ├─ main.ts                      # Entry CLI
│  │  ├─ args.ts                      # Parse args
│  │  ├─ exit-codes.ts                # 0/1/2/3
│  │  └─ commands/
│  │     ├─ validate.ts               # cerber validate ...
│  │     ├─ guard.ts                  # cerber guard --staged (pre-commit)
│  │     ├─ doctor.ts                 # cerber doctor
│  │     └─ init.ts                   # cerber init
│  ├─ contract/
│  │  ├─ schema.ts                    # Walidacja kontraktu (zod/ajv)
│  │  ├─ loader.ts                    # Load .cerber/contract.yml
│  │  ├─ types.ts                     # Contract types
│  │  └─ resolver.ts                  # Extends/merge/defaults
│  ├─ core/
│  │  ├─ orchestrator.ts              # Runs: target -> tools -> merge results
│  │  ├─ tool-manager.ts              # Wykrycie, instalacja/cache binarek, wersje
│  │  ├─ target-manager.ts            # Wybór targetu: github-actions/gitlab-ci/...
│  │  └─ file-discovery.ts            # Znajdź pliki wg targetu (staged/changed/all)
│  ├─ targets/
│  │  ├─ github-actions/
│  │  │  ├─ discover.ts               # .github/workflows/**/*.yml
│  │  │  ├─ toolpacks.ts              # Domyślne narzędzia dla GHA
│  │  │  └─ normalize.ts              # Mapowanie ścieżek, node->line
│  │  ├─ gitlab-ci/
│  │  │  ├─ discover.ts               # .gitlab-ci.yml + includes
│  │  │  └─ toolpacks.ts              # gitlab-ci-lint / custom checks
│  │  └─ generic-yaml/
│  │     ├─ discover.ts               # Dowolne *.yml wg globów z kontraktu
│  │     └─ toolpacks.ts              # yamllint / schema checks
│  ├─ adapters/                       # "Wtyczki" do realnych tooli
│  │  ├─ actionlint/
│  │  │  ├─ run.ts                    # Uruchom actionlint
│  │  │  └─ parse.ts                  # Parsuj output -> Violation[]
│  │  ├─ zizmor/
│  │  │  ├─ run.ts
│  │  │  └─ parse.ts
│  │  ├─ gitleaks/
│  │  │  ├─ run.ts
│  │  │  └─ parse.ts
│  │  └─ _shared/
│  │     ├─ exec.ts                   # Spawn, timeouts, stdout/stderr
│  │     └─ versions.ts               # Pinned versions, download urls, checksums
│  ├─ reporting/
│  │  ├─ violation.ts                 # Unified Violation model (jeden format)
│  │  ├─ merge.ts                     # Łączenie wyników z wielu tooli
│  │  ├─ format-text.ts               # Czytelny output
│  │  ├─ format-json.ts               # Deterministyczny JSON
│  │  ├─ format-github.ts             # ::error file= line= ...
│  │  └─ format-sarif.ts              # SARIF (security standard)
│  ├─ scm/
│  │  ├─ git.ts                       # Staged files, changed files, base branch diff
│  │  └─ paths.ts                     # Normalizacja ścieżek Windows/Linux
│  └─ security/
│     ├─ path-safety.ts               # Blokada ../../../etc/passwd
│     └─ redaction.ts                 # Redakcja sekretów w logach
├─ bin/
│  └─ cerber                          # Node shebang -> dist/cli/main.js
├─ .cerber/
│  ├─ contract.example.yml            # Przykład kontraktu
│  └─ contracts/
│     ├─ github-actions.base.yml      # Bazowy kontrakt dla GHA
│     └─ nodejs.base.yml
├─ .github/
│  ├─ workflows/
│  │  └─ ci.yml                       # Testy, lint, typecheck, snapshot
│  └─ copilot-instructions.md         # Zasady dla agenta
├─ test/
│  ├─ fixtures/
│  │  ├─ github-actions/              # Real workflow fixtures
│  │  ├─ gitlab-ci/
│  │  └─ secrets/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
└─ docs/
   ├─ targets.md                      # Jak działa "target" i jak dodać nowy
   ├─ adapters.md                     # Jak dodać adapter do toola
   └─ contract.md                     # Spec kontraktu
```

**Kluczowe decyzje architektoniczne:**

1. **Targets (uniwersalność merytoryczna)**
   - `github-actions` - actionlint + zizmor + gitleaks (Phase 1)
   - `gitlab-ci` - gitlab-ci lint + custom rules (Phase 2+)
   - `generic-yaml` - yamllint/schema (Phase 2+)

2. **Adapters (wtyczki do tooli)**
   - Interfejs: `run()` + `parse()` → `Violation[]`
   - Każdy adapter niezależny (łatwo dodać nowe)

3. **Reporting (wiele formatów)**
   - `text` - human-readable (domyślny)
   - `json` - deterministyczny (CI/integracje)
   - `github` - ::error file=... (GitHub Actions annotations)
   - `sarif` - standard security (GitHub Code Scanning)

4. **SCM (staged/changed/all)**
   - Pre-commit: tylko staged files
   - PR: changed files vs base branch
   - CI: all files lub changed

5. **Tool Manager**
   - Auto-detect installed tools
   - Cache binaries (jeśli potrzebne)
   - Version pinning

**Filozofia:**
> Cerber = dyrygent (orchestrator), nie orkiestra (nie reimplementujemy tooli).
> Target = zakres merytoryczny (GHA, GitLab, YAML).
> Adapter = wykonawca (actionlint, zizmor, gitleaks).
> Contract = partytura (jedna prawda).

---

## 🎯 PHASE 0: FOUNDATION (Dni 1-2) - 12h

**Cel:** Establish "One Truth" + Agent Rules

**⚠️ CRITICAL: Read AGENTS.md and .github/copilot-instructions.md FIRST**

### 0.0 Architecture Rules (READ FIRST)

**5 MINY NAPRAWIONE:**

1. **MINA #1:** ~~timestamp required~~ → Timestamp opcjonalny w `runMetadata`, nie w deterministycznym rdzeniu
2. **MINA #2:** ~~actionlint JSON mode~~ → Template `{{json .}}` + fallback text parser
3. **MINA #3:** ~~brew na ubuntu~~ → Download release binaries (curl + tar)
4. **MINA #4:** ~~testy wymagają toola~~ → Fixtures w `fixtures/tool-outputs/<tool>/`
5. **MINA #5:** ~~tools = rules~~ → Separacja: `tools.*` (config), `rules.*` (gating)

**Golden Rules (from AGENTS.md):**

1. **ONE TRUTH:** Contract = source of truth
2. **NO REINVENTING:** Orchestrate, don't reimplement
3. **DETERMINISTIC:** Same input → same output (sorted, no required timestamps)
4. **TESTS FIRST:** No behavior without tests
5. **FIXTURES:** Adapters test on fixtures, not real tools
6. **GRACEFUL:** Tool missing → warn and continue
7. **CROSS-PLATFORM:** Windows is first-class citizen
8. **EXIT CODES:** 0 (success) / 1 (violations) / 2 (config error) / 3 (tool error)

**Read before coding:**
- [`AGENTS.md`](./AGENTS.md) - Full rules
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) - Copilot instructions

---

### 0.1 Create Agent Instructions (2h)

**✅ DONE - Files created:**
1. ✅ `AGENTS.md` (root) - Complete rules (11 sections, 400+ lines)
2. ✅ `.github/copilot-instructions.md` (GitHub Copilot specific)

**Content:** See files above.

**Deliverables:**
   - Use zizmor (workflow security)
   - Use ratchet/gha-fix (pinning/autofix)
   - Cerber adds: orchestration + contracts + profiles + deterministic output

3) Tests-first gate:
   - Any behavior change requires: unit test OR integration fixture OR e2e snapshot
   - CI must stay green

4) Deterministic output:
   - Same input => byte-identical JSON output
   - Sorted keys, stable ordering
   - No random timestamps

5) Backward compatibility:
   - v1 CLI remains working until documented migration path
   - Breaking changes require: MIGRATION.md + major version bump

6) Scope control:
   - Each PR = one atomic improvement
   - No drive-by refactors
   - No renaming spree

## Implementation constraints
- Node >= 20
- CLI uses execa (Windows support)
- Adapters must have:
  - detect installed tool
  - auto-install hint
  - version capture
  - parse output → CerberViolation[]

## Definition of Done (per PR)
- [ ] Tests added/updated
- [ ] Docs updated (CERBER.md if behavior changes)
- [ ] cerber doctor works on sample fixtures
- [ ] Output schema unchanged OR versioned
- [ ] No new lint/type errors
```

**Deliverables:**
- ✅ AGENTS.md in root
- ✅ Git committed

**Tests:** N/A (documentation)

---

### 0.2 Define Output Schema (3h)
```bash
# Create: .cerber/output.schema.json
```

**⚠️ MINA #1 FIX: Determinism → timestamp opcjonalny (w runMetadata, nie required)**

**Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CerberOutput",
  "type": "object",
  "required": ["contractVersion", "deterministic", "summary", "violations", "metadata"],
  "properties": {
    "contractVersion": {
      "type": "integer",
      "description": "Contract version",
      "example": 1
    },
    "deterministic": {
      "type": "boolean",
      "description": "Whether output is deterministic (same input → same output)"
    },
    "summary": {
      "type": "object",
      "required": ["total", "errors", "warnings", "info"],
      "properties": {
        "total": { "type": "integer" },
        "errors": { "type": "integer" },
        "warnings": { "type": "integer" },
        "info": { "type": "integer" }
      }
    },
    "violations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "severity", "message", "source"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Stable rule ID",
            "example": "security/no-hardcoded-secrets"
          },
          "severity": {
            "type": "string",
            "enum": ["error", "warning", "info"]
          },
          "message": {
            "type": "string",
            "description": "Human-readable message"
          },
          "path": {
            "type": "string",
            "description": "File path (relative to repo root)"
          },
          "line": {
            "type": "integer",
            "description": "Line number (1-indexed)"
          },
          "column": {
            "type": "integer",
            "description": "Column number (1-indexed)"
          },
          "hint": {
            "type": "string",
            "description": "Fix suggestion"
          },
          "source": {
            "type": "string",
            "description": "Tool that generated violation",
            "example": "cerber-semantic | actionlint | zizmor"
          },
          "toolOutput": {
            "type": "object",
            "description": "Original tool output (for debugging)"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["tools"],
      "properties": {
        "tools": {
          "type": "object",
          "description": "Tool execution metadata (sorted by key)",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "version": { "type": "string" },
              "exitCode": { "type": "integer" },
              "skipped": { "type": "boolean" },
              "reason": { "type": "string" }
            }
          }
        }
      }
    },
    "runMetadata": {
      "type": "object",
      "description": "Optional runtime metadata (NOT part of deterministic core)",
      "properties": {
        "profile": { "type": "string" },
        "executionTime": { "type": "integer", "description": "Milliseconds" },
        "cwd": { "type": "string" },
        "generatedAt": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 timestamp (optional)"
        }
      }
    }
  }
}
```

**Determinism Rule:**
- Core fields (summary, violations, metadata.tools) → deterministic (sorted)
- runMetadata → optional, not part of deterministic comparison
- Test: `deepEqual(run1, run2)` excludes runMetadata

**Deliverables:**
- ✅ .cerber/output.schema.json
- ✅ TypeScript types generated (src/types/output.ts)
- ✅ Git committed

**Tests:**
- Unit test: validate sample outputs against schema

---

### 0.3 Define Contract Schema (3h)
```bash
# Create: .cerber/contract.schema.json
```

**⚠️ MINA #5 FIX: tools vs rules separation**

**Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CerberContract",
  "type": "object",
  "required": ["contractVersion", "profiles"],
  "properties": {
    "contractVersion": {
      "type": "integer",
      "description": "Contract version",
      "example": 1
    },
    "activeProfile": {
      "type": "string",
      "description": "Default profile to use",
      "enum": ["solo", "dev", "team"]
    },
    "extends": {
      "type": "string",
      "description": "Base template",
      "example": "nodejs-base"
    },
    "tools": {
      "type": "object",
      "description": "Tool execution configuration",
      "properties": {
        "actionlint": {
          "$ref": "#/definitions/toolConfig"
        },
        "zizmor": {
          "$ref": "#/definitions/toolConfig"
        },
        "gitleaks": {
          "$ref": "#/definitions/toolConfig"
        }
      }
    },
    "rules": {
      "type": "object",
      "description": "Cerber rules (severity mapping, gating)",
      "additionalProperties": {
        "$ref": "#/definitions/ruleConfig"
      }
    },
    "profiles": {
      "type": "object",
      "properties": {
        "solo": {
          "$ref": "#/definitions/profile"
        },
        "dev": {
          "$ref": "#/definitions/profile"
        },
        "team": {
          "$ref": "#/definitions/profile"
        }
      }
    }
  },
  "definitions": {
    "profile": {
      "type": "object",
      "required": ["tools", "failOn"],
      "properties": {
        "tools": {
          "type": "array",
          "description": "Which tools to run",
          "items": { "type": "string" }
        },
        "failOn": {
          "type": "array",
          "description": "Which severities fail CI",
          "items": {
            "type": "string",
            "enum": ["error", "warning", "info"]
          }
        },
        "timeout": {
          "type": "integer",
          "description": "Max execution time per tool (ms)"
        },
        "continueOnError": {
          "type": "boolean",
          "description": "Continue if tool crashes"
        }
      }
    },
    "toolConfig": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "version": { "type": "string", "description": "Pin version (optional)" },
        "args": {
          "type": "array",
          "description": "Tool-specific arguments",
          "items": { "type": "string" }
        },
        "format": { "type": "string", "description": "Output format (if tool supports)" }
      }
    },
    "ruleConfig": {
      "type": "object",
      "required": ["severity", "gate"],
      "properties": {
        "severity": {
          "type": "string",
          "enum": ["error", "warning", "info"]
        },
        "gate": {
          "type": "boolean",
          "description": "Fail CI if violated"
        },
        "source": {
          "type": "string",
          "description": "Which tool provides this rule"
        }
      }
      }
    }
  }
}
```

**Deliverables:**
- ✅ .cerber/contract.schema.json
- ✅ TypeScript types (src/types/contract.ts)
- ✅ Validation logic (src/contracts/ContractValidator.ts updated)
- ✅ Git committed

**Tests:**
- Unit test: validate sample contracts against schema
- Integration test: load contract + validate structure

---

### 0.4 Update CERBER.md Spec (4h)

**Add sections:**
1. **Output Schema** - deterministic JSON format
2. **Profiles** - solo/dev/team definitions
3. **Exit Codes** - 0 (OK), 1 (violations), 2 (config error), 3 (runtime error)
4. **Tool Adapters** - how adapters work
5. **One Truth Philosophy** - contract.yml = source of truth

**Deliverables:**
- ✅ CERBER.md updated
- ✅ Examples added
- ✅ Git committed

**Tests:** N/A (documentation)

---

## 🎯 PHASE 1: CORE INFRASTRUCTURE (Dni 3-7) - 40h

**Cel:** Build core orchestration system + adapters framework

### 1.1 Tool Manager (6h)

**Create:**
```typescript
// src/core/tool-manager.ts
export interface ToolInfo {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  installHint: string;
}

export class ToolManager {
  private cache: Map<string, ToolInfo> = new Map();
  
  /**
   * Check if tool is installed and cache result
   */
  async detectTool(name: string): Promise<ToolInfo> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    
    const info = await this.detect(name);
    this.cache.set(name, info);
    return info;
  }
  
  private async detect(name: string): Promise<ToolInfo> {
    try {
      const { stdout } = await execa(name, ['--version']);
      const version = this.parseVersion(stdout);
      const { stdout: path } = await execa('which', [name]);
      
      return {
        name,
        installed: true,
        version,
        path: path.trim(),
        installHint: this.getInstallHint(name)
      };
    } catch {
      return {
        name,
        installed: false,
        installHint: this.getInstallHint(name)
      };
    }
  }
  
  private parseVersion(output: string): string | undefined {
    const match = output.match(/\d+\.\d+\.\d+/);
    return match?.[0];
  }
  
  private getInstallHint(name: string): string {
    const hints = {
      actionlint: 'brew install actionlint  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest',
      zizmor: 'brew install zizmor  # or: cargo install zizmor',
      gitleaks: 'brew install gitleaks  # or: go install github.com/gitleaks/gitleaks/v8@latest'
    };
    return hints[name] || `Install ${name} from official source`;
  }
  
  /**
   * Check multiple tools in parallel
   */
  async detectAll(tools: string[]): Promise<ToolInfo[]> {
    return Promise.all(tools.map(tool => this.detectTool(tool)));
  }
  
  /**
   * Get summary for doctor command
   */
  async getSummary(tools: string[]): Promise<{ installed: number; missing: number; tools: ToolInfo[] }> {
    const results = await this.detectAll(tools);
    return {
      installed: results.filter(t => t.installed).length,
      missing: results.filter(t => !t.installed).length,
      tools: results
    };
  }
}
```

**Deliverables:**
- ✅ src/core/tool-manager.ts
- ✅ Tool detection with caching
- ✅ Version parsing
- ✅ Install hints
- ✅ Git committed

**Tests:**
- Unit test: parseVersion() with different formats
- Mock test: detectTool() with/without tool
- Integration test: detectAll() on real system

---

### 1.1b Tool Version Management & Auto-Installation (4h)

**Problem:** Tools evolve, versions change, users don't want manual installation.

**Solution Strategy:**

**1. Pinned Versions Registry:**
```typescript
// src/adapters/_shared/versions.ts
export const TOOL_VERSIONS = {
  actionlint: {
    recommended: '1.6.27',
    minimum: '1.6.0',
    download: {
      linux: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_linux_amd64.tar.gz',
      darwin: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_darwin_amd64.tar.gz',
      win32: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_windows_amd64.zip'
    },
    checksum: {
      '1.6.27': {
        linux: 'sha256:abc123...',
        darwin: 'sha256:def456...',
        win32: 'sha256:ghi789...'
      }
    }
  },
  zizmor: {
    recommended: '0.2.0',
    minimum: '0.1.0',
    download: {
      linux: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-unknown-linux-musl',
      darwin: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-apple-darwin',
      win32: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-pc-windows-msvc.exe'
    }
  },
  gitleaks: {
    recommended: '8.18.0',
    minimum: '8.0.0',
    download: {
      linux: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_linux_x64.tar.gz',
      darwin: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_darwin_x64.tar.gz',
      win32: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_windows_x64.zip'
    }
  }
};

export function getToolVersion(name: string): { recommended: string; minimum: string } {
  return TOOL_VERSIONS[name] || { recommended: 'latest', minimum: '0.0.0' };
}

export function getDownloadURL(name: string, version: string, platform: NodeJS.Platform): string | null {
  const tool = TOOL_VERSIONS[name];
  if (!tool || !tool.download) return null;
  
  const template = tool.download[platform];
  if (!template) return null;
  
  return template.replace('{version}', version);
}

export function isVersionCompatible(installed: string, minimum: string): boolean {
  // Simple semver comparison
  const [iMajor, iMinor, iPatch] = installed.split('.').map(Number);
  const [mMajor, mMinor, mPatch] = minimum.split('.').map(Number);
  
  if (iMajor > mMajor) return true;
  if (iMajor < mMajor) return false;
  if (iMinor > mMinor) return true;
  if (iMinor < mMinor) return false;
  return iPatch >= mPatch;
}
```

**2. Auto-Download & Cache:**
```typescript
// src/core/tool-installer.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { get } from 'https';
import { extract } from 'tar';
import AdmZip from 'adm-zip';

export class ToolInstaller {
  private cacheDir: string;
  
  constructor() {
    // Cache in ~/.cerber/tools/
    this.cacheDir = path.join(os.homedir(), '.cerber', 'tools');
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }
  
  /**
   * Check if tool is cached
   */
  isCached(name: string, version: string): boolean {
    const binPath = this.getBinPath(name, version);
    return fs.existsSync(binPath);
  }
  
  /**
   * Get cached binary path
   */
  getBinPath(name: string, version: string): string {
    const ext = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.cacheDir, name, version, `${name}${ext}`);
  }
  
  /**
   * Download and install tool
   */
  async install(name: string, version: string): Promise<string> {
    // Check if already cached
    if (this.isCached(name, version)) {
      console.log(`✅ ${name} ${version} already cached`);
      return this.getBinPath(name, version);
    }
    
    console.log(`📦 Downloading ${name} ${version}...`);
    
    // Get download URL
    const url = getDownloadURL(name, version, process.platform);
    if (!url) {
      throw new Error(`No download URL for ${name} on ${process.platform}`);
    }
    
    // Download to temp
    const tempDir = path.join(os.tmpdir(), `cerber-${name}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    const archivePath = path.join(tempDir, path.basename(url));
    await this.download(url, archivePath);
    
    // Extract
    const extractDir = path.join(this.cacheDir, name, version);
    fs.mkdirSync(extractDir, { recursive: true });
    
    if (url.endsWith('.tar.gz')) {
      await extract({ file: archivePath, cwd: extractDir });
    } else if (url.endsWith('.zip')) {
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
    } else {
      // Single binary (e.g., zizmor)
      const binPath = this.getBinPath(name, version);
      fs.copyFileSync(archivePath, binPath);
      fs.chmodSync(binPath, 0o755);
    }
    
    // Cleanup temp
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Installed ${name} ${version}`);
    return this.getBinPath(name, version);
  }
  
  private async download(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          this.download(response.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        
        const file = createWriteStream(dest);
        pipeline(response, file)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);
    });
  }
  
  /**
   * Get tool (from cache or install)
   */
  async ensureTool(name: string): Promise<string> {
    const { recommended } = getToolVersion(name);
    
    if (this.isCached(name, recommended)) {
      return this.getBinPath(name, recommended);
    }
    
    // Auto-install if not found
    return this.install(name, recommended);
  }
}
```

**3. Version Check & Auto-Update:**
```typescript
// Update ToolManager to use ToolInstaller
export class ToolManager {
  private cache: Map<string, ToolInfo> = new Map();
  private installer = new ToolInstaller();
  
  async detectTool(name: string, autoInstall = false): Promise<ToolInfo> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    
    // Try system-installed first
    let info = await this.detectSystem(name);
    
    // Check version compatibility
    if (info.installed && info.version) {
      const { minimum } = getToolVersion(name);
      if (!isVersionCompatible(info.version, minimum)) {
        console.warn(`⚠️  ${name} ${info.version} is outdated (minimum: ${minimum})`);
        info.outdated = true;
      }
    }
    
    // Auto-install if not found and autoInstall=true
    if (!info.installed && autoInstall) {
      try {
        const binPath = await this.installer.ensureTool(name);
        info = {
          name,
          installed: true,
          version: getToolVersion(name).recommended,
          path: binPath,
          installHint: `Already installed by Cerber`,
          cached: true
        };
      } catch (error) {
        console.error(`Failed to auto-install ${name}:`, error);
      }
    }
    
    this.cache.set(name, info);
    return info;
  }
  
  private async detectSystem(name: string): Promise<ToolInfo> {
    // Same as before (check system PATH)
    try {
      const { stdout } = await execa(name, ['--version']);
      const version = this.parseVersion(stdout);
      const { stdout: path } = await execa('which', [name]);
      
      return {
        name,
        installed: true,
        version,
        path: path.trim(),
        installHint: this.getInstallHint(name),
        cached: false
      };
    } catch {
      return {
        name,
        installed: false,
        installHint: this.getInstallHint(name),
        cached: false
      };
    }
  }
}
```

**4. Contract Tool Version Pinning:**
```yaml
# .cerber/contract.yml
contractVersion: 1
tools:
  actionlint:
    enabled: true
    version: '1.6.27'  # Pin specific version (optional)
  zizmor:
    enabled: true
    version: 'latest'  # Or use latest
  gitleaks:
    enabled: true
    # No version = use recommended
```

**5. Doctor Command Integration:**
```typescript
// cerber doctor shows version status
async function doctor() {
  const tools = ['actionlint', 'zizmor', 'gitleaks'];
  const manager = new ToolManager();
  
  console.log('🔧 Tool Status:\n');
  
  for (const name of tools) {
    const info = await manager.detectTool(name);
    const { recommended, minimum } = getToolVersion(name);
    
    if (info.installed) {
      if (info.outdated) {
        console.log(`   ⚠️  ${name} ${info.version} (outdated, minimum: ${minimum})`);
        console.log(`      Run: cerber install ${name}`);
      } else {
        const cachedTag = info.cached ? ' [cached]' : '';
        console.log(`   ✅ ${name} ${info.version}${cachedTag}`);
      }
    } else {
      console.log(`   ❌ ${name} not installed`);
      console.log(`      Run: cerber install ${name}`);
      console.log(`      Or: ${info.installHint}`);
    }
  }
}
```

**6. CLI Commands:**
```bash
# Auto-install missing tools
cerber install actionlint zizmor gitleaks

# Update all tools to recommended versions
cerber update --all

# Check versions without installing
cerber doctor --check-versions

# Validate with auto-install
cerber validate --auto-install
```

**Strategy Overview:**

| Scenario | Behavior |
|----------|----------|
| Tool in PATH | ✅ Use system tool |
| Tool in PATH (outdated) | ⚠️ Warn, suggest update, still use |
| Tool not found (local dev) | ℹ️ Show install hint |
| Tool not found (CI + auto-install) | 📦 Download to ~/.cerber/tools/ |
| Tool not found (Docker) | ✅ Pre-installed in image |
| Version mismatch | ⚠️ Warn, show minimum required |

**Deliverables:**
- ✅ src/adapters/_shared/versions.ts (pinned versions registry)
- ✅ src/core/tool-installer.ts (download + cache)
- ✅ Update ToolManager with version check
- ✅ cerber install command
- ✅ cerber update command
- ✅ --auto-install flag
- ✅ Git committed

**Tests:**
- Unit test: isVersionCompatible()
- Unit test: getDownloadURL()
- Mock test: ToolInstaller.install() (don't download in tests)
- Integration test: auto-install on real system (opt-in)
- Test: version outdated detection

**Dependencies:**
- npm install adm-zip (for .zip extraction on Windows)
- npm install tar (for .tar.gz extraction)

---

### 1.2 Target Manager (6h)

**Create:**
```typescript
// src/core/target-manager.ts
export interface Target {
  id: string;
  name: string;
  description: string;
  discover: (cwd: string) => Promise<string[]>;
  getDefaultTools: () => string[];
}

export class TargetManager {
  private targets: Map<string, Target> = new Map();
  
  registerTarget(target: Target): void {
    this.targets.set(target.id, target);
  }
  
  getTarget(id: string): Target | undefined {
    return this.targets.get(id);
  }
  
  getAllTargets(): Target[] {
    return Array.from(this.targets.values());
  }
  
  /**
   * Auto-detect which targets are available in project
   */
  async detectAvailableTargets(cwd: string): Promise<Target[]> {
    const available: Target[] = [];
    
    for (const target of this.targets.values()) {
      const files = await target.discover(cwd);
      if (files.length > 0) {
        available.push(target);
      }
    }
    
    return available;
  }
}
```

**Create Targets:**
```typescript
// src/targets/github-actions/discover.ts
export async function discoverGitHubActions(cwd: string): Promise<string[]> {
  const workflowsDir = path.join(cwd, '.github/workflows');
  
  if (!fs.existsSync(workflowsDir)) {
    return [];
  }
  
  const files = await glob('**/*.{yml,yaml}', {
    cwd: workflowsDir,
    absolute: true
  });
  
  return files;
}

// src/targets/github-actions/toolpacks.ts
export function getDefaultTools(): string[] {
  return ['actionlint', 'zizmor', 'gitleaks'];
}

// src/targets/github-actions/index.ts
export const GitHubActionsTarget: Target = {
  id: 'github-actions',
  name: 'GitHub Actions',
  description: 'GitHub Actions workflows (.github/workflows/*.yml)',
  discover: discoverGitHubActions,
  getDefaultTools
};
```

**Deliverables:**
- ✅ src/core/target-manager.ts
- ✅ src/targets/github-actions/ (discover, toolpacks, index)
- ✅ Auto-detection of available targets
- ✅ Git committed

**Tests:**
- Unit test: TargetManager register/get
- Integration test: discoverGitHubActions() on fixtures
- Test: detectAvailableTargets() returns correct targets

---

### 1.3 File Discovery (SCM Integration) (6h)

**Create:**
```typescript
// src/scm/git.ts
export class GitSCM {
  constructor(private cwd: string) {}
  
  /**
   * Get staged files (for pre-commit)
   */
  async getStagedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', '--cached'], {
        cwd: this.cwd
      });
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
  
  /**
   * Get changed files vs base branch (for PR)
   */
  async getChangedFiles(baseBranch: string = 'main'): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', `origin/${baseBranch}...HEAD`], {
        cwd: this.cwd
      });
      return stdout.split('\n').filter(Boolean);
    } catch {
      // Fallback: all tracked files
      return this.getTrackedFiles();
    }
  }
  
  /**
   * Get all tracked files
   */
  async getTrackedFiles(): Promise<string[]> {
    const { stdout } = await execa('git', ['ls-files'], {
      cwd: this.cwd
    });
    return stdout.split('\n').filter(Boolean);
  }
  
  /**
   * Check if in git repo
   */
  async isGitRepo(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--git-dir'], { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }
}

// src/scm/paths.ts
export class PathNormalizer {
  /**
   * Normalize paths for cross-platform (Windows/Linux)
   */
  static normalize(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
  
  /**
   * Make path relative to cwd
   */
  static makeRelative(filePath: string, cwd: string): string {
    const relative = path.relative(cwd, filePath);
    return this.normalize(relative);
  }
  
  /**
   * Filter files by glob patterns
   */
  static matchGlobs(files: string[], globs: string[]): string[] {
    return files.filter(file => {
      return globs.some(glob => minimatch(file, glob));
    });
  }
}

// src/core/file-discovery.ts
export interface DiscoveryOptions {
  mode: 'staged' | 'changed' | 'all';
  target: Target;
  baseBranch?: string;
  globs?: string[];
}

export class FileDiscovery {
  constructor(
    private cwd: string,
    private git: GitSCM
  ) {}
  
  async discover(options: DiscoveryOptions): Promise<string[]> {
    // 1. Get files by mode
    let files: string[];
    
    switch (options.mode) {
      case 'staged':
        files = await this.git.getStagedFiles();
        break;
      case 'changed':
        files = await this.git.getChangedFiles(options.baseBranch);
        break;
      case 'all':
        files = await options.target.discover(this.cwd);
        break;
    }
    
    // 2. Filter by target globs (if provided)
    if (options.globs) {
      files = PathNormalizer.matchGlobs(files, options.globs);
    }
    
    // 3. Normalize paths
    files = files.map(f => PathNormalizer.normalize(f));
    
    return files;
  }
}
```

**Deliverables:**
- ✅ src/scm/git.ts (staged/changed/all files)
- ✅ src/scm/paths.ts (path normalization)
- ✅ src/core/file-discovery.ts (unified discovery)
- ✅ Git committed

**Tests:**
- Unit test: PathNormalizer.normalize() Windows/Linux
- Mock test: GitSCM methods with mock git
- Integration test: FileDiscovery on fixtures

---

### 1.4 Adapter Framework (6h)

**Create:**
```typescript
// src/orchestrator/ToolAdapter.ts
export interface ToolAdapter {
  name: string;
  version?: string;
  
  // Detection
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  getInstallHint(): string;
  
  // Execution
  run(options: RunOptions): Promise<ToolOutput>;
  
  // Parsing
  parseOutput(raw: string): CerberViolation[];
  
  // Mapping
  mapRule(cerberRuleId: string): string | null;
}

export interface RunOptions {
  files?: string[];
  config?: string;
  args?: string[];
}

export interface ToolOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

**Create:**
```typescript
// src/orchestrator/ToolRegistry.ts
export class ToolRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();
  
  register(name: string, adapter: ToolAdapter): void;
  get(name: string): ToolAdapter | undefined;
  getAll(): ToolAdapter[];
  
  async checkAll(): Promise<ToolStatus[]>;
}

export interface ToolStatus {
  name: string;
  installed: boolean;
  version?: string;
  installHint: string;
  optional: boolean;
}
```

**Deliverables:**
- ✅ src/orchestrator/ToolAdapter.ts
- ✅ src/orchestrator/ToolRegistry.ts
- ✅ src/orchestrator/index.ts (exports)
- ✅ Git committed

**Tests:**
- Unit test: ToolRegistry register/get/getAll
- Mock adapter for testing

---

### 1.2 Actionlint Adapter (6h)

**⚠️ MINA #2 FIX: Actionlint format reality check - template mode, not native JSON**

**Create:**
```typescript
// src/orchestrator/adapters/ActionlintAdapter.ts
export class ActionlintAdapter implements ToolAdapter {
  name = 'actionlint';
  
  // Actionlint custom template for structured output
  private static TEMPLATE = '{{json .}}';
  
  async isInstalled(): Promise<boolean> {
    try {
      await execa('actionlint', ['-version']);
      return true;
    } catch {
      return false;
    }
  }
  
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execa('actionlint', ['-version']);
      // Parse: "1.6.27 built with go1.21"
      return stdout.match(/(\d+\.\d+\.\d+)/)?.[1] || null;
    } catch {
      return null;
    }
  }
  
  getInstallHint(): string {
    const platform = process.platform;
    if (platform === 'darwin') {
      return 'brew install actionlint  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest';
    } else if (platform === 'win32') {
      return 'choco install actionlint  # or: scoop install actionlint';
    } else {
      return 'Download: https://github.com/rhysd/actionlint/releases  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest';
    }
  }
  
  async run(options: RunOptions): Promise<ToolOutput> {
    // Use template format (actionlint doesn't have native JSON mode)
    const args = [
      '-format', ActionlintAdapter.TEMPLATE,
      '-color', 'never'
    ];
    
    if (options.args) {
      args.push(...options.args);
    }
    
    if (options.files?.length) {
      args.push(...options.files);
    }
    
    const start = Date.now();
    const result = await execa('actionlint', args, { 
      reject: false,
      all: true,
      cwd: options.cwd,
      timeout: options.timeout || 30000
    });
    
    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: Date.now() - start
    };
  }
  
  parseOutput(raw: string): CerberViolation[] {
    if (!raw.trim()) return [];
    
    try {
      // Template {{json .}} outputs array of issues
      const issues = JSON.parse(raw);
      
      return issues.map((item: any) => ({
        id: item.kind || 'actionlint',
        severity: 'error',  // actionlint only reports errors
        message: item.message || item.title,
        path: item.filepath || item.file,
        line: item.line || 0,
        column: item.column || 0,
        source: 'actionlint',
        toolOutput: item
      }));
    } catch (error) {
      // Fallback: parse text output if JSON fails
      return this.parseTextOutput(raw);
    }
  }
  
  private parseTextOutput(raw: string): CerberViolation[] {
    // Fallback parser for standard text format
    // Example: ".github/workflows/ci.yml:10:5: error message [rule-name]"
    const lines = raw.split('\n').filter(Boolean);
    const regex = /^(.+?):(\d+):(\d+):\s*(.+?)\s*\[([^\]]+)\]$/;
    
    return lines.map(line => {
      const match = line.match(regex);
      if (!match) return null;
      
      return {
        id: match[5],
        severity: 'error',
        message: match[4],
        path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        source: 'actionlint',
        toolOutput: { raw: line }
      };
    }).filter(Boolean) as CerberViolation[];
  }
  
  mapRule(cerberRuleId: string): string | null {
    // actionlint runs all checks (no selective rules)
    return null;
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/ActionlintAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Fixtures created (see below)
- ✅ Git committed

**⚠️ MINA #4 FIX: Adapter testing strategy - fixtures, not real tools**

**Tests:**
- Unit test: `parseOutput()` with **fixtures** (NO tool required)
  ```typescript
  // tests/adapters/actionlint.test.ts
  import { ActionlintAdapter } from '@/adapters/actionlint';
  import fs from 'fs';
  
  describe('ActionlintAdapter', () => {
    const adapter = new ActionlintAdapter();
    
    it('parses JSON output from template', () => {
      const fixture = fs.readFileSync('fixtures/tool-outputs/actionlint/syntax-error.json', 'utf-8');
      const violations = adapter.parseOutput(fixture);
      
      expect(violations).toMatchSnapshot();
      expect(violations[0]).toMatchObject({
        id: 'syntax-check',
        severity: 'error',
        source: 'actionlint'
      });
    });
    
    it('parses text output fallback', () => {
      const fixture = fs.readFileSync('fixtures/tool-outputs/actionlint/text-output.txt', 'utf-8');
      const violations = adapter.parseOutput(fixture);
      
      expect(violations.length).toBeGreaterThan(0);
    });
    
    it('handles empty output', () => {
      const violations = adapter.parseOutput('');
      expect(violations).toEqual([]);
    });
  });
  ```

- Integration test: `run()` on real tool (skip if not installed)
  ```typescript
  it.skipIf(!await adapter.isInstalled())('runs real actionlint', async () => {
    const result = await adapter.run({ 
      files: ['fixtures/workflows/valid.yml'],
      cwd: process.cwd()
    });
    expect(result.exitCode).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });
  ```

- Mock test: `isInstalled()` / `getVersion()`
  ```typescript
  it('detects installation', async () => {
    // Skip if tool not installed (don't fail test)
    const installed = await adapter.isInstalled();
    expect(typeof installed).toBe('boolean');
  });
  ```

**Create Fixtures:**
```bash
# fixtures/tool-outputs/actionlint/syntax-error.json
[
  {
    "kind": "syntax-check",
    "message": "invalid syntax in workflow file",
    "filepath": ".github/workflows/ci.yml",
    "line": 10,
    "column": 5
  }
]

# fixtures/tool-outputs/actionlint/multiple-issues.json
[...]

# fixtures/tool-outputs/actionlint/no-issues.json
[]

# fixtures/tool-outputs/actionlint/text-output.txt
.github/workflows/ci.yml:10:5: error message [syntax-check]
```

**Rule:** Unit tests MUST pass without actionlint installed (fixtures only).

**Dependencies:**
- npm install execa (if not installed)

---

### 1.3 Zizmor Adapter (6h)

**Create:**
```typescript
// src/orchestrator/adapters/ZizmorAdapter.ts
export class ZizmorAdapter implements ToolAdapter {
  name = 'zizmor';
  
  // Similar structure to ActionlintAdapter
  
  async run(options: RunOptions): Promise<ToolOutput> {
    const args = ['--format', 'json'];
    if (options.files) {
      args.push(...options.files);
    }
    
    const result = await execa('zizmor', args, { reject: false });
    // ... parse results
  }
  
  parseOutput(raw: string): CerberViolation[] {
    // Parse zizmor JSON output (security findings)
    const data = JSON.parse(raw);
    return data.results.map(item => ({
      id: `zizmor/${item.check_id}`,
      severity: item.severity === 'high' ? 'error' : 'warning',
      message: item.message,
      path: item.location.path,
      line: item.location.start_line,
      hint: item.remediation,
      source: 'zizmor',
      toolOutput: item
    }));
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/ZizmorAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Git committed

**Tests:**
- Unit test: parseOutput with sample zizmor JSON
- Integration test: run on fixtures with security issues

---

### 1.4 Ratchet Adapter (6h)

**Create:**
```typescript
// src/orchestrator/adapters/RatchetAdapter.ts
export class RatchetAdapter implements ToolAdapter {
  name = 'ratchet';
  
  async run(options: RunOptions): Promise<ToolOutput> {
    const args = ['check'];
    if (options.files) {
      args.push(...options.files);
    }
    
    const result = await execa('ratchet', args, { reject: false });
    // ... parse unpinned actions
  }
  
  parseOutput(raw: string): CerberViolation[] {
    // Parse ratchet output (unpinned actions)
    const lines = raw.split('\n');
    const violations: CerberViolation[] = [];
    
    for (const line of lines) {
      const match = line.match(/(.+):(\d+): (.+)/);
      if (match) {
        violations.push({
          id: 'ci/pin-versions',
          severity: 'warning',
          message: match[3],
          path: match[1],
          line: parseInt(match[2]),
          hint: 'Pin action to commit SHA or @vX.Y.Z',
          source: 'ratchet',
          toolOutput: { raw: line }
        });
      }
    }
    
    return violations;
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/RatchetAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Git committed

**Tests:**
- Unit test: parseOutput with sample ratchet output
- Integration test: detect unpinned actions

---

### 1.5 Orchestrator Engine (8h)

**Create:**
```typescript
// src/orchestrator/Orchestrator.ts
export class Orchestrator {
  constructor(
    private registry: ToolRegistry,
    private contract: Contract
  ) {}
  
  async validate(options: ValidateOptions): Promise<CerberOutput> {
    const violations: CerberViolation[] = [];
    const metadata: any = {
      profile: options.profile,
      tools: []
    };
    
    // 1. Get profile config
    const profile = this.contract.profiles[options.profile];
    
    // 2. Run enabled tools
    for (const toolName of profile.enable) {
      const adapter = this.registry.get(toolName);
      if (!adapter) {
        console.warn(`⚠️  Tool '${toolName}' not found`);
        continue;
      }
      
      // Check if installed
      const installed = await adapter.isInstalled();
      if (!installed) {
        console.warn(`⚠️  ${adapter.name} not installed`);
        console.warn(`   Install: ${adapter.getInstallHint()}`);
        metadata.tools.push({
          name: adapter.name,
          enabled: false,
          reason: 'not_installed'
        });
        continue;
      }
      
      // Get version
      const version = await adapter.getVersion();
      metadata.tools.push({
        name: adapter.name,
        version,
        enabled: true
      });
      
      // Run tool
      console.log(`🔍 Running ${adapter.name}...`);
      const output = await adapter.run({ files: options.files });
      
      // Parse violations
      const toolViolations = adapter.parseOutput(output.stdout);
      violations.push(...toolViolations);
    }
    
    // 3. Filter by severity (based on profile.failOn)
    const filtered = violations.filter(v => 
      profile.failOn.includes(v.severity)
    );
    
    // 4. Generate deterministic output
    return this.generateOutput(filtered, metadata);
  }
  
  private generateOutput(
    violations: CerberViolation[],
    metadata: any
  ): CerberOutput {
    // Sort violations (deterministic)
    violations.sort((a, b) => {
      // Sort by: path, line, column, id
      if (a.path !== b.path) return a.path.localeCompare(b.path);
      if (a.line !== b.line) return (a.line || 0) - (b.line || 0);
      if (a.column !== b.column) return (a.column || 0) - (b.column || 0);
      return a.id.localeCompare(b.id);
    });
    
    const summary = {
      total: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length
    };
    
    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      summary,
      violations,
      metadata
    };
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/Orchestrator.ts
- ✅ Integration with ToolRegistry + Contract
- ✅ Deterministic output (sorted)
- ✅ Git committed

**Tests:**
- Unit test: validate() with mock adapters
- Integration test: full validation on fixtures
- Snapshot test: output determinism

---

### 1.6 Reporting & Output Formats (8h)

**Create unified reporting system:**

```typescript
// src/reporting/violation.ts
export interface CerberViolation {
  id: string;              // Stable rule ID (e.g., "security/no-secrets")
  severity: 'error' | 'warning' | 'info';
  message: string;
  path: string;            // Relative path from repo root
  line?: number;           // 1-indexed
  column?: number;         // 1-indexed
  hint?: string;           // Fix suggestion
  source: string;          // Tool name (e.g., "actionlint", "zizmor")
  toolOutput?: any;        // Original tool output (debugging)
}

export interface CerberOutput {
  version: string;         // Schema version
  timestamp: string;       // ISO 8601
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  violations: CerberViolation[];
  metadata: {
    profile: string;
    target: string;
    tools: Array<{
      name: string;
      version?: string;
      enabled: boolean;
    }>;
    contract: string;      // Path to contract
  };
}
```

**Create formatters:**

```typescript
// src/reporting/format-text.ts
export function formatText(output: CerberOutput): string {
  let result = '';
  
  result += `\n🛡️  CERBER VALIDATION REPORT\n`;
  result += `   Profile: ${output.metadata.profile}\n`;
  result += `   Target: ${output.metadata.target}\n`;
  result += `   Tools: ${output.metadata.tools.map(t => `${t.name} (${t.version})`).join(', ')}\n`;
  
  result += `\n📊 Summary:\n`;
  result += `   Total: ${output.summary.total}\n`;
  result += `   Errors: ${output.summary.errors}\n`;
  result += `   Warnings: ${output.summary.warnings}\n`;
  result += `   Info: ${output.summary.info}\n`;
  
  if (output.violations.length > 0) {
    result += `\n❌ Violations:\n\n`;
    
    for (const v of output.violations) {
      const icon = v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
      result += `${icon} ${v.id} (${v.source})\n`;
      result += `   ${v.path}:${v.line || '?'}${v.column ? `:${v.column}` : ''}\n`;
      result += `   ${v.message}\n`;
      if (v.hint) {
        result += `   💡 ${v.hint}\n`;
      }
      result += '\n';
    }
  } else {
    result += `\n✅ No violations found!\n`;
  }
  
  return result;
}

// src/reporting/format-json.ts
export function formatJSON(output: CerberOutput): string {
  // Deterministic JSON (sorted keys)
  return JSON.stringify(output, null, 2);
}

// src/reporting/format-github.ts
export function formatGitHub(output: CerberOutput): string {
  // GitHub Actions annotations format
  let result = '';
  
  for (const v of output.violations) {
    const level = v.severity === 'error' ? 'error' : 'warning';
    const location = `file=${v.path},line=${v.line || 1},col=${v.column || 1}`;
    result += `::${level} ${location}::${v.id}: ${v.message}\n`;
  }
  
  return result;
}

// src/reporting/format-sarif.ts
export function formatSARIF(output: CerberOutput): string {
  // SARIF 2.1.0 format (GitHub Code Scanning compatible)
  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'Cerber',
            version: output.version,
            informationUri: 'https://github.com/Agaslez/cerber-core',
            rules: generateRules(output.violations)
          }
        },
        results: output.violations.map(v => ({
          ruleId: v.id,
          level: v.severity === 'error' ? 'error' : 'warning',
          message: {
            text: v.message
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: v.path
                },
                region: {
                  startLine: v.line || 1,
                  startColumn: v.column || 1
                }
              }
            }
          ]
        }))
      }
    ]
  };
  
  return JSON.stringify(sarif, null, 2);
}

function generateRules(violations: CerberViolation[]): any[] {
  const uniqueRules = new Map<string, CerberViolation>();
  
  for (const v of violations) {
    if (!uniqueRules.has(v.id)) {
      uniqueRules.set(v.id, v);
    }
  }
  
  return Array.from(uniqueRules.values()).map(v => ({
    id: v.id,
    shortDescription: {
      text: v.message
    },
    helpUri: `https://cerber-core.dev/rules/${v.id}`,
    properties: {
      source: v.source
    }
  }));
}

// src/reporting/formatter.ts
export class ReportFormatter {
  format(output: CerberOutput, format: 'text' | 'json' | 'github' | 'sarif'): string {
    switch (format) {
      case 'text':
        return formatText(output);
      case 'json':
        return formatJSON(output);
      case 'github':
        return formatGitHub(output);
      case 'sarif':
        return formatSARIF(output);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
}
```

**Deliverables:**
- ✅ src/reporting/violation.ts (unified model)
- ✅ src/reporting/format-text.ts
- ✅ src/reporting/format-json.ts
- ✅ src/reporting/format-github.ts (::error annotations)
- ✅ src/reporting/format-sarif.ts (GitHub Code Scanning)
- ✅ src/reporting/formatter.ts (dispatcher)
- ✅ Git committed

**Tests:**
- Unit test: each formatter with sample output
- Snapshot test: format consistency
- Integration test: full pipeline with different formats

---

## 🎯 PHASE 2: CLI & MODES (Dni 8-10) - 18h

**Cel:** Universal CLI modes (validate, guard, stdin)

### 2.1 Update cerber validate (6h)

**Supports multiple input modes:**
```bash
# Mode 1: Auto-detect (all files in target)
cerber validate --target github-actions

# Mode 2: Specific files
cerber validate --files .github/workflows/ci.yml

# Mode 3: Changed files (PR mode)
cerber validate --changed --base-branch main

# Mode 4: Staged files (pre-commit)
cerber validate --staged

# Mode 5: Stdin (pipeline integration)
echo ".github/workflows/ci.yml" | cerber validate --stdin
```

**Implementation:**
```typescript
// bin/cerber-validate
#!/usr/bin/env node
import { Orchestrator } from '../dist/orchestrator/Orchestrator.js';
import { ToolRegistry } from '../dist/orchestrator/ToolRegistry.js';
import { ContractLoader } from '../dist/contracts/ContractLoader.js';
import { ActionlintAdapter } from '../dist/orchestrator/adapters/ActionlintAdapter.js';
import { ZizmorAdapter } from '../dist/orchestrator/adapters/ZizmorAdapter.js';
import { RatchetAdapter } from '../dist/orchestrator/adapters/RatchetAdapter.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  // Load contract
  const loader = new ContractLoader();
  const contract = await loader.load(args.contract || '.cerber/contract.yml');
  
  // Setup registry
  const registry = new ToolRegistry();
  registry.register('actionlint', new ActionlintAdapter());
  registry.register('zizmor', new ZizmorAdapter());
  registry.register('ratchet', new RatchetAdapter());
  
  // Run orchestrator
  const orchestrator = new Orchestrator(registry, contract);
  const result = await orchestrator.validate({
    profile: args.profile || 'dev',
    files: args.files
  });
  
  // Output
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printTextOutput(result);
  }
  
  // Exit code
  const exitCode = result.summary.errors > 0 ? 1 : 0;
  process.exit(exitCode);
}

function parseArgs(argv: string[]): any {
  // Parse: --profile, --json, --files, --contract
}

function printTextOutput(result: CerberOutput): void {
  // Human-readable output
  console.log(`\n🛡️  CERBER VALIDATION REPORT`);
  console.log(`   Profile: ${result.metadata.profile}`);
  console.log(`   Tools: ${result.metadata.tools.map(t => t.name).join(', ')}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${result.summary.total}`);
  console.log(`   Errors: ${result.summary.errors}`);
  console.log(`   Warnings: ${result.summary.warnings}`);
  
  if (result.violations.length > 0) {
    console.log(`\n❌ Violations:\n`);
    for (const v of result.violations) {
      console.log(`   ${v.severity.toUpperCase()}: ${v.id}`);
      console.log(`   ${v.path}:${v.line || '?'}`);
      console.log(`   ${v.message}`);
      if (v.hint) {
        console.log(`   💡 ${v.hint}`);
      }
      console.log('');
    }
  }
}

main();
```

**Deliverables:**
- ✅ bin/cerber-validate updated
- ✅ Supports --profile, --json, --files
- ✅ Git committed

**Tests:**
- E2E test: run cerber-validate on fixtures
- Snapshot test: JSON output determinism
- Test: --profile solo/dev/team changes behavior

---

### 2.2 Create cerber doctor (6h)

**Create:**
```bash
# bin/cerber-doctor
```

**Features:**
1. Detect project type (package.json, Dockerfile, etc.)
2. Scan for workflows (.github/workflows/)
3. Check tool installation (actionlint, zizmor, ratchet)
4. Generate contract.yml (if missing)
5. Show health report

**Implementation:**
```typescript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🏥 CERBER DOCTOR - Project Health Check\n');
  
  // 1. Detect project
  const projectType = detectProjectType(process.cwd());
  console.log(`📦 Project type: ${projectType}`);
  
  // 2. Check workflows
  const workflowsDir = path.join(process.cwd(), '.github/workflows');
  if (fs.existsSync(workflowsDir)) {
    const workflows = fs.readdirSync(workflowsDir);
    console.log(`📁 Workflows found: ${workflows.length}`);
  } else {
    console.log('⚠️  No workflows found');
  }
  
  // 3. Check tools
  console.log('\n🔧 Tool Status:');
  const registry = new ToolRegistry();
  registry.register('actionlint', new ActionlintAdapter());
  registry.register('zizmor', new ZizmorAdapter());
  registry.register('ratchet', new RatchetAdapter());
  
  const statuses = await registry.checkAll();
  for (const status of statuses) {
    if (status.installed) {
      console.log(`   ✅ ${status.name} (${status.version})`);
    } else {
      console.log(`   ❌ ${status.name} - not installed`);
      console.log(`      Install: ${status.installHint}`);
    }
  }
  
  // 4. Check contract
  const contractPath = path.join(process.cwd(), '.cerber/contract.yml');
  if (!fs.existsSync(contractPath)) {
    console.log('\n⚠️  No contract found');
    console.log('   Run: cerber init --template ' + projectType);
  } else {
    console.log('\n✅ Contract found: .cerber/contract.yml');
  }
  
  // 5. Run validation (if tools available)
  const allInstalled = statuses.every(s => s.installed);
  if (allInstalled && fs.existsSync(contractPath)) {
    console.log('\n🔍 Running validation...');
    // Run orchestrator
  }
  
  console.log('\n✅ Health check complete');
}

function detectProjectType(cwd: string): string {
  // Same as cerber-init
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
    if (pkg.dependencies?.react) return 'react';
    return 'nodejs';
  }
  if (fs.existsSync(path.join(cwd, 'Dockerfile'))) return 'docker';
  if (fs.existsSync(path.join(cwd, 'requirements.txt'))) return 'python';
  if (fs.existsSync(path.join(cwd, 'main.tf'))) return 'terraform';
  return 'unknown';
}

main();
```

**Deliverables:**
- ✅ bin/cerber-doctor created
- ✅ Added to package.json bin
- ✅ Git committed

**Tests:**
- E2E test: run on fixtures (with/without tools)
- Test: detect project type
- Test: check tool status

---

### 2.3 Add Profile Support to Templates (4h)

**Update all 5 templates:**
```yaml
# templates/nodejs/contract.yml
version: 2.0.0
extends: nodejs-base

profiles:
  solo:
    failOn: [error]
    enable: [actionlint]
  dev:
    failOn: [error, warning]
    enable: [actionlint, zizmor]
  team:
    failOn: [error, warning]
    enable: [actionlint, zizmor, ratchet]
    requireDeterministicOutput: true
    requirePinning: true

tools:
  actionlint:
    enabled: true
  zizmor:
    enabled: true
  ratchet:
    enabled: true

rules:
  security/no-hardcoded-secrets:
    enforced: true
    severity: error
    tool: zizmor
  
  ci/pin-versions:
    enforced: true
    severity: warning
    tool: ratchet
  
  best-practices/setup-node-with-version:
    enforced: true
    severity: error
```

**Update:**
- templates/nodejs/contract.yml
- templates/docker/contract.yml
- templates/react/contract.yml
- templates/python/contract.yml
- templates/terraform/contract.yml

**Deliverables:**
- ✅ All 5 templates updated with profiles
- ✅ Git committed

**Tests:**
- Update template tests to validate profiles
- Test: profile inheritance (solo < dev < team)

---

## 🎯 PHASE 3: GUARDIAN PRE-COMMIT (Dni 11-12) - 12h

**Cel:** Fast pre-commit with lint-staged

### 3.1 Install lint-staged + Husky (2h)

```bash
npm install --save-dev lint-staged
npx husky install
```

**Create:**
```json
// package.json
{
  "lint-staged": {
    ".github/workflows/*.{yml,yaml}": [
      "cerber-validate --profile dev --changed"
    ],
    ".cerber/*.{yml,yaml}": [
      "cerber-validate --profile dev --contract"
    ]
  }
}
```

**Create:**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Deliverables:**
- ✅ lint-staged configured
- ✅ .husky/pre-commit created
- ✅ Git committed

**Tests:**
- Manual test: git commit with violation (should fail)
- Manual test: git commit without violation (should pass)

---

### 3.2 Add --changed Flag (4h)

**Modify cerber-validate:**
```typescript
// Only validate changed files (git diff)
if (args.changed) {
  const changedFiles = await getChangedFiles();
  options.files = changedFiles.filter(f => 
    f.endsWith('.yml') || f.endsWith('.yaml')
  );
}

async function getChangedFiles(): Promise<string[]> {
  const { stdout } = await execa('git', ['diff', '--name-only', '--cached']);
  return stdout.split('\n').filter(Boolean);
}
```

**Deliverables:**
- ✅ --changed flag support
- ✅ Only scans staged files
- ✅ Git committed

**Tests:**
- E2E test: --changed with mock git diff
- Test: filter .yml/.yaml files only

---

### 3.3 Fast Mode (Skip Slow Tools) (4h)

**Modify Orchestrator:**
```typescript
// profiles can specify "fast" tools for pre-commit
profiles:
  dev-fast:
    failOn: [error]
    enable: [actionlint]  # Skip zizmor (slow)
```

**Update lint-staged:**
```json
{
  "lint-staged": {
    ".github/workflows/*.{yml,yaml}": [
      "cerber-validate --profile dev-fast --changed"
    ]
  }
}
```

**Deliverables:**
- ✅ dev-fast profile in templates
- ✅ lint-staged uses fast profile
- ✅ Git committed

**Tests:**
- Benchmark: pre-commit < 2 seconds
- Test: dev-fast only runs actionlint

---

### 3.4 Update GitHub Actions CI (2h)

**Modify:**
```yaml
# .github/workflows/ci.yml
jobs:
  cerber-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install tools
        run: |
          brew install actionlint
          brew install zizmor
          brew install ratchet
          
      - name: Cerber Validate (Team Profile)
        run: npx cerber-validate --profile team --json > cerber-output.json
        
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cerber-results
          path: cerber-output.json
```

**Deliverables:**
- ✅ CI workflow uses team profile
- ✅ Installs all tools
- ✅ Uploads JSON output
- ✅ Git committed

**Tests:**
- Run CI on GitHub (manual verification)

---

## 🎯 PHASE 4: POLISH & RELEASE (Dni 13-15) - 16h

**Cel:** Documentation, tests, release prep

### 4.1 Update Documentation (6h)

**Files to update:**
- README.md (add orchestrator section)
- CERBER.md (profiles, output schema, adapters)
- MIGRATION.md (v1 → v2 guide)
- QUICKSTART.md (updated workflow)

**Sections:**
1. What's new in V2
2. Profiles (solo/dev/team)
3. Tool installation
4. Output schema
5. Migration guide

**Deliverables:**
- ✅ All docs updated
- ✅ Examples added
- ✅ Git committed

**Tests:** N/A (documentation)

---

### 4.2 Add Integration Tests (6h)

**Create:**
```typescript
// test/integration/orchestrator.test.ts
describe('Orchestrator Integration', () => {
  it('should run actionlint on valid workflow', async () => {
    const result = await orchestrator.validate({
      profile: 'dev',
      files: ['fixtures/workflows/valid.yml']
    });
    expect(result.violations).toHaveLength(0);
  });
  
  it('should detect security issues with zizmor', async () => {
    const result = await orchestrator.validate({
      profile: 'dev',
      files: ['fixtures/workflows/insecure.yml']
    });
    expect(result.violations.some(v => v.source === 'zizmor')).toBe(true);
  });
  
  it('should detect unpinned actions with ratchet', async () => {
    const result = await orchestrator.validate({
      profile: 'team',
      files: ['fixtures/workflows/unpinned.yml']
    });
    expect(result.violations.some(v => v.id === 'ci/pin-versions')).toBe(true);
  });
});
```

**Deliverables:**
- ✅ test/integration/orchestrator.test.ts
- ✅ Fixtures for all scenarios
- ✅ Snapshot tests for output
- ✅ Git committed

**Tests:**
- All integration tests passing
- Coverage > 80%

---

### 4.3 Version Bump + Changelog (2h)

**Update:**
- package.json: version → 2.0.0
- CHANGELOG.md: Add V2.0.0 section

**Changelog:**
```markdown
# Changelog

## [2.0.0] - 2026-01-XX

### 🎉 Major Release - Orchestrator Architecture

#### Added
- **Orchestrator Engine** - Run multiple tools from one command
- **Tool Adapters** - actionlint, zizmor, ratchet integration
- **Profiles** - solo/dev/team (business model)
- **cerber doctor** - Auto-detect project + generate contract
- **Deterministic Output** - JSON schema + stable sorting
- **Guardian Pre-commit** - Fast validation with lint-staged
- **Output Schema** - .cerber/output.schema.json

#### Changed
- **cerber-validate** - Now uses orchestrator (backward compatible)
- **Templates** - All templates updated with profiles
- **Contract Schema** - Added profiles + tools sections

#### Breaking Changes
- Output format changed (now includes metadata.tools)
- Exit codes standardized (0/1/2/3)
- Requires Node >= 20

### Migration Guide
See [MIGRATION.md](MIGRATION.md) for v1 → v2 upgrade path.
```

**Deliverables:**
- ✅ package.json version bumped
- ✅ CHANGELOG.md updated
- ✅ Git committed

---

### 4.4 Release Prep (2h)

**Checklist:**
- [ ] All tests passing (102+ tests)
- [ ] Docs updated
- [ ] CHANGELOG.md complete
- [ ] MIGRATION.md exists
- [ ] npm run build succeeds
- [ ] No TypeScript errors
- [ ] No lint errors

**Git tag:**
```bash
git tag -a v2.0.0 -m "Release v2.0.0 - Orchestrator Architecture"
git push origin v2.0.0
```

**NPM publish:**
```bash
npm run build
npm publish --access public
```

**Deliverables:**
- ✅ v2.0.0 tag pushed
- ✅ NPM package published
- ✅ GitHub release created

---

## 🎯 PHASE 5: POST-RELEASE (Dni 16-20) - 20h

**Cel:** Marketing, monitoring, community

### 5.1 Demo Video (4h)

**Create:**
- 3-minute demo video
- Show: cerber init → doctor → validate → fix

**Script:**
```
00:00 - Problem: "Managing 5 tools, 5 configs"
00:30 - Solution: "One contract, Cerber runs everything"
01:00 - Demo: cerber init --template nodejs
01:30 - Demo: cerber doctor (shows tool status)
02:00 - Demo: cerber validate --profile dev
02:30 - Demo: pre-commit hook in action
03:00 - Call to action: npm install cerber-core
```

**Deliverables:**
- ✅ Demo video uploaded (YouTube)
- ✅ GIF for README
- ✅ Tweet thread

---

### 5.2 Launch Marketing (4h)

**Platforms:**
1. HackerNews (Show HN: Cerber Core 2.0)
2. Reddit (r/devops, r/github, r/javascript)
3. Dev.to article
4. Twitter thread
5. LinkedIn post

**Messaging:**
```
🛡️ Cerber Core 2.0 - Contract-Driven DevOps Orchestrator

Tired of managing ESLint, actionlint, hadolint, prettier configs?

Cerber runs them all from ONE contract:
- .cerber/contract.yml = single source of truth
- 3 profiles: solo/dev/team
- Deterministic JSON output
- Pre-commit + CI integration

Setup in 60 seconds:
npm i -D cerber-core
npx cerber init
npx cerber doctor

Open source, MIT license
GitHub: github.com/Agaslez/cerber-core
```

**Deliverables:**
- ✅ Posted on all platforms
- ✅ Responses monitored

---

### 5.3 Monitor & Respond (4h/day × 3 days = 12h)

**Daily tasks:**
- Monitor GitHub issues
- Respond to comments (HN, Reddit)
- Fix critical bugs
- Update docs based on feedback

**Metrics to track:**
- NPM downloads
- GitHub stars
- Discord joins
- Issue/PR count

---

## 📊 TIMELINE SUMMARY

| Phase | Days | Hours | Deliverables |
|-------|------|-------|--------------|
| Phase 0: Foundation | 1-2 | 12h | AGENTS.md, schemas, docs, copilot instructions |
| Phase 1: Core Infrastructure | 3-7 | 40h | Tool manager, targets, file discovery, adapters, reporting |
| Phase 2: CLI & Modes | 8-10 | 18h | validate, guard, doctor, stdin/paths modes |
| Phase 3: Guardian Pre-commit | 11-12 | 12h | lint-staged, fast mode, git hooks |
| Phase 4: Polish & Release | 13-15 | 16h | Docs, tests, CHANGELOG, release |
| Phase 5: Marketing & Launch | 16-17 | 12h | Demo video, posts, monitoring |
| Phase 6: Universal Deployment | 18 | 12h | Docker image, GitHub Action, CI examples |
| **TOTAL** | **18 days** | **122h** | **V2.0.0 Release** |

**Critical Path:**
- Days 1-7: Core infrastructure (52h) - BLOCKER for everything else
- Days 8-12: CLI + Guardian (30h) - User-facing features
- Days 13-18: Polish + Launch (40h) - Release readiness

**Parallel Work Opportunities:**
- Docs can be written while code is being implemented
- Tests can be written in parallel with features
- Marketing materials can be prepared during Phase 4

---

## ✅ DEFINITION OF DONE (V2.0.0)

**Technical:**
- [ ] All tests passing (120+ tests)
- [ ] 3 adapters working (actionlint, zizmor, ratchet)
- [ ] Orchestrator validated on 10+ real workflows
- [ ] Output schema documented + validated
- [ ] Profiles working (solo/dev/team)
- [ ] cerber doctor generates working contracts
- [ ] Pre-commit < 2 seconds
- [ ] CI runs full validation
- [ ] Zero TypeScript errors
- [ ] Zero lint errors

**Documentation:**
- [ ] AGENTS.md exists
- [ ] README.md updated (orchestrator section)
- [ ] CERBER.md updated (profiles, schemas)
- [ ] MIGRATION.md exists (v1 → v2)
- [ ] QUICKSTART.md updated
- [ ] Demo video published

**Release:**
- [ ] package.json → 2.0.0
- [ ] CHANGELOG.md complete
- [ ] Git tag v2.0.0
- [ ] NPM published
- [ ] GitHub release

**Marketing:**
- [ ] HackerNews post
- [ ] Reddit posts (3 subreddits)
- [ ] Dev.to article
- [ ] Twitter thread
- [ ] LinkedIn post

---

## 🎯 SUCCESS METRICS (30 days post-launch)

**Adoption:**
- 1000+ NPM downloads/week
- 500+ GitHub stars
- 50+ Discord members
- 10+ production users

**Quality:**
- < 5 critical bugs reported
- > 90% test coverage
- < 1 day bug fix time

**Community:**
- 5+ community PRs
- 20+ GitHub issues (feedback)
- 3+ case studies

---

## 🎯 PHASE 6: UNIVERSAL DEPLOYMENT (Bonus - Dni 16-18) - 12h

**Cel:** Docker image + universal CI compatibility

### 6.1 Docker Image (6h)

**Create:**
```dockerfile
# Dockerfile
FROM node:20-alpine

# Install tools
RUN apk add --no-cache \
    git \
    go \
    cargo \
    && go install github.com/rhysd/actionlint/cmd/actionlint@latest \
    && cargo install zizmor \
    && go install github.com/gitleaks/gitleaks/v8@latest

# Copy Cerber
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY bin/ ./bin/

# Add to PATH
ENV PATH="/app/bin:/root/go/bin:/root/.cargo/bin:$PATH"

ENTRYPOINT ["cerber"]
CMD ["validate"]
```

**Build & Publish:**
```bash
# Build
docker build -t ghcr.io/agaslez/cerber-core:2.0.0 .

# Test
docker run --rm ghcr.io/agaslez/cerber-core:2.0.0 --version

# Publish
docker push ghcr.io/agaslez/cerber-core:2.0.0
docker push ghcr.io/agaslez/cerber-core:latest
```

**Usage examples:**
```yaml
# GitHub Actions
- name: Cerber Validate
  run: |
    docker run --rm \
      -v $PWD:/workspace \
      -w /workspace \
      ghcr.io/agaslez/cerber-core:2.0.0 \
      validate --target github-actions --format json

# GitLab CI
cerber_validate:
  image: ghcr.io/agaslez/cerber-core:2.0.0
  script:
    - cerber validate --target gitlab-ci

# Jenkins
stage('Cerber') {
  docker.image('ghcr.io/agaslez/cerber-core:2.0.0').inside {
    sh 'cerber validate'
  }
}
```

**Deliverables:**
- ✅ Dockerfile
- ✅ .dockerignore
- ✅ Docker image published to ghcr.io
- ✅ docs/docker.md (usage guide)
- ✅ Git committed

**Tests:**
- Integration test: run Docker image on fixtures
- Test: all tools available in image
- Verify: image size < 500MB

---

### 6.2 GitHub Action (Reusable Workflow) (4h)

**Create:**
```yaml
# .github/actions/cerber-validate/action.yml
name: 'Cerber Validate'
description: 'Run Cerber validation with Docker'
author: 'Agaslez'

inputs:
  target:
    description: 'Target to validate (github-actions, gitlab-ci, generic-yaml)'
    required: false
    default: 'github-actions'
  profile:
    description: 'Profile to use (solo, dev, team)'
    required: false
    default: 'team'
  format:
    description: 'Output format (text, json, github, sarif)'
    required: false
    default: 'github'
  fail-on:
    description: 'Fail on severity (error, warning, info)'
    required: false
    default: 'error'

runs:
  using: 'docker'
  image: 'docker://ghcr.io/agaslez/cerber-core:2.0.0'
  args:
    - 'validate'
    - '--target'
    - ${{ inputs.target }}
    - '--profile'
    - ${{ inputs.profile }}
    - '--format'
    - ${{ inputs.format }}

branding:
  icon: 'shield'
  color: 'blue'
```

**⚠️ MINA #3 FIX: CI installation - download binaries, not brew**

**Usage:**
```yaml
# .github/workflows/cerber.yml
name: Cerber Validate

on: [push, pull_request]

jobs:
  cerber:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      # Install tools (download release binaries)
      - name: Install actionlint
        run: |
          curl -sL https://github.com/rhysd/actionlint/releases/download/v1.6.27/actionlint_1.6.27_linux_amd64.tar.gz | tar xz
          sudo mv actionlint /usr/local/bin/
          actionlint --version
      
      - name: Install zizmor
        run: |
          curl -sL https://github.com/woodruffw/zizmor/releases/download/v0.2.0/zizmor-x86_64-unknown-linux-musl -o zizmor
          chmod +x zizmor
          sudo mv zizmor /usr/local/bin/
          zizmor --version
      
      - name: Install gitleaks
        run: |
          curl -sL https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz | tar xz
          sudo mv gitleaks /usr/local/bin/
          gitleaks version
      
      - name: Cerber Validate
        uses: agaslez/cerber-core/actions/cerber-validate@v2
        with:
          target: github-actions
          profile: team
          format: github

# OR: Use Docker image with pre-installed tools
jobs:
  cerber-docker:
    runs-on: ubuntu-latest
    container: ghcr.io/agaslez/cerber-core:2.0.0
    steps:
      - uses: actions/checkout@v4
      - run: cerber validate --format=github
```

**Platform-specific installation:**
- **Ubuntu (CI):** Download release binaries (curl + tar)
- **macOS:** Homebrew (local dev)
- **Windows:** Chocolatey or Scoop (local dev)
- **Docker:** Pre-installed in image

**Deliverables:**
- ✅ .github/actions/cerber-validate/action.yml
- ✅ docs/github-action.md (usage guide)
- ✅ Git committed

**Tests:**
- Manual test: run action in real workflow
- Verify: annotations appear in PR

---

### 6.3 Universal CI Examples (2h)

**Create documentation:**

```markdown
# docs/ci-examples.md

## GitHub Actions
\`\`\`yaml
- name: Cerber
  run: npx cerber-core validate --target github-actions
\`\`\`

## GitLab CI
\`\`\`yaml
cerber:
  stage: test
  image: ghcr.io/agaslez/cerber-core:2.0.0
  script:
    - cerber validate --target gitlab-ci
\`\`\`

## Jenkins
\`\`\`groovy
stage('Cerber') {
  docker.image('ghcr.io/agaslez/cerber-core:2.0.0').inside {
    sh 'cerber validate'
  }
}
\`\`\`

## Azure DevOps
\`\`\`yaml
- task: Docker@2
  inputs:
    command: 'run'
    image: 'ghcr.io/agaslez/cerber-core:2.0.0'
    arguments: 'validate'
\`\`\`

## CircleCI
\`\`\`yaml
jobs:
  cerber:
    docker:
      - image: ghcr.io/agaslez/cerber-core:2.0.0
    steps:
      - checkout
      - run: cerber validate
\`\`\`
```

**Deliverables:**
- ✅ docs/ci-examples.md
- ✅ All major CI platforms documented
- ✅ Git committed

**Tests:** N/A (documentation)

---

## 🚨 RISK MITIGATION

**Risk 1: Tools not installed**
- Mitigation: Graceful degradation (works without tools)
- cerber doctor shows install hints

**Risk 2: Breaking changes impact users**
- Mitigation: MIGRATION.md + v1 compatibility mode
- Announce on Discord/Twitter 2 weeks before

**Risk 3: Adapter bugs**
- Mitigation: Comprehensive tests + fixtures
- Each adapter has unit + integration tests

**Risk 4: Performance issues (slow)**
- Mitigation: Benchmark + optimize
- Pre-commit uses fast profile (< 2s)
- CI uses full profile

**Risk 5: Tool conflicts (version mismatches)**
- Mitigation: Document compatible versions
- cerber doctor shows installed versions

---

## 🎉 NEXT STEPS (Post V2.0.0)

**V2.1 (Q1 2026):**
- More adapters (hadolint, tflint, eslint)
- SARIF output format
- GitHub Action (reusable workflow)

**V2.2 (Q2 2026):**
- Auto-fix engine (safe fixes only)
- Confidence scoring
- Rollback mechanism

**V2.3 (Q3 2026):**
- Web dashboard
- Team analytics
- Compliance reports (SOC2, ISO27001)

**V3.0 (Q4 2026):**
- Universal validation (not just CI/CD)
- Frontend/backend/database validation
- Self-healing platform

---

## 📝 APPENDIX

### A. Tools Overview

| Tool | Purpose | Output Format | Install | Phase |
|------|---------|---------------|---------|-------|
| **actionlint** | GitHub Actions linting | JSON | brew install actionlint | 1.5 |
| **zizmor** | GitHub Actions security | JSON | brew install zizmor | 1.6 |
| **gitleaks** | Secrets detection | JSON | brew install gitleaks | 1.7 |

**Future tools (V2.1+):**
- hadolint (Dockerfile linting)
- tflint (Terraform linting)
- yamllint (Generic YAML)
- eslint (JavaScript/TypeScript)

### B. Profile Comparison

| Feature | Solo | Dev | Team |
|---------|------|-----|------|
| failOn | error | error, warning | error, warning |
| Tools | actionlint | actionlint, zizmor | actionlint, zizmor, gitleaks |
| Pinning required | No | No | Yes |
| Deterministic output | No | No | Yes |
| Speed | Fast (~3s) | Medium (~8s) | Slow (~15s) |
| Use case | Personal projects | Team development | Production CI |
| Pre-commit | ✅ Yes | ✅ Yes | ⚠️ Optional (slow) |

### C. Exit Codes

| Code | Meaning | Example | Action |
|------|---------|---------|--------|
| 0 | Success (no violations) | All checks passed | ✅ Continue |
| 1 | Violations found | 3 errors, 5 warnings | ❌ Block merge |
| 2 | Configuration error | Invalid contract.yml | 🔧 Fix config |
| 3 | Runtime error | Tool crashed | 🐛 Report bug |
| 4 | Tool not found | actionlint not installed | 📦 Install tool |

### D. Target System

**What is a Target?**
Target defines WHAT to validate (scope):
- `github-actions` → .github/workflows/*.yml
- `gitlab-ci` → .gitlab-ci.yml + includes
- `generic-yaml` → any YAML files

**Target Structure:**
```typescript
interface Target {
  id: string;                           // Unique ID
  name: string;                         // Display name
  description: string;                  // What it does
  discover: (cwd: string) => string[];  // Find files
  getDefaultTools: () => string[];      // Recommended tools
}
```

**How to Add New Target:**
1. Create `src/targets/<name>/discover.ts`
2. Create `src/targets/<name>/toolpacks.ts`
3. Create `src/targets/<name>/index.ts`
4. Register in `TargetManager`
5. Add docs to `docs/targets.md`

### E. Adapter System

**What is an Adapter?**
Adapter wraps external tool:
- Detects if installed
- Runs tool with correct args
- Parses output → `CerberViolation[]`

**Adapter Interface:**
```typescript
interface ToolAdapter {
  name: string;
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  getInstallHint(): string;
  run(options: RunOptions): Promise<ToolOutput>;
  parseOutput(raw: string): CerberViolation[];
}
```

**How to Add New Adapter:**
1. Create `src/adapters/<tool>/run.ts`
2. Create `src/adapters/<tool>/parse.ts`
3. Implement `ToolAdapter` interface
4. Add tests with fixtures
5. Register in `ToolRegistry`
6. Add docs to `docs/adapters.md`

### F. Output Formats

| Format | Use Case | Example |
|--------|----------|---------|
| **text** | Human-readable terminal | Default local dev |
| **json** | CI integration, storage | `--format json > results.json` |
| **github** | GitHub Actions annotations | Auto-detected in GHA |
| **sarif** | GitHub Code Scanning | Upload to Security tab |

**Format Selection Logic:**
```typescript
// Auto-detect GitHub Actions
if (process.env.GITHUB_ACTIONS === 'true') {
  defaultFormat = 'github';
} else {
  defaultFormat = 'text';
}
```

### G. Contract Schema Evolution

**V2.0.0 Contract:**
```yaml
contractVersion: 1
name: my-project
targets:
  - id: github-actions
    globs:
      - .github/workflows/**/*.yml
    tools:
      - id: actionlint
        severity: error
      - id: zizmor
        severity: error
profiles:
  solo:
    failOn: [error]
    enable: [actionlint]
  dev:
    failOn: [error, warning]
    enable: [actionlint, zizmor]
  team:
    failOn: [error, warning]
    enable: [actionlint, zizmor, gitleaks]
output:
  formats: [text, json]
  failOn: error
```

**Future Evolution (V2.1+):**
- Multiple targets in one contract
- Custom rules (RegEx patterns)
- Tool-specific configurations
- Conditional rules (if/then logic)

### H. Universal Deployment Matrix

| Platform | Method | Command |
|----------|--------|---------|
| **Local Dev** | npm | `npx cerber-core validate` |
| **Pre-commit** | husky | `npx cerber-core guard --staged` |
| **GitHub Actions** | Docker Action | `uses: agaslez/cerber-core@v2` |
| **GitHub Actions** | Docker Run | `docker run ghcr.io/agaslez/cerber-core:2.0.0` |
| **GitLab CI** | Docker | `image: ghcr.io/agaslez/cerber-core:2.0.0` |
| **Jenkins** | Docker | `docker.image('ghcr.io/agaslez/cerber-core:2.0.0')` |
| **Azure DevOps** | Docker Task | See docs/ci-examples.md |
| **CircleCI** | Docker Executor | `docker: ghcr.io/agaslez/cerber-core:2.0.0` |

**Key Insight:**
> Cerber jest uniwersalny bo jest CLI + Docker.
> GitHub Actions to tylko jeden z runnerów.
> Contract.yml to jedna prawda, niezależnie od CI.

---

## ✅ ROADMAP VALIDATION - "Stefan's Architecture Checklist"

**Porównanie: Co było vs Co jest teraz**

| Element | Poprzednia Roadmap | Nowa Roadmap (Stefan's Plan) | Status |
|---------|-------------------|------------------------------|--------|
| **Folder Structure** | ❌ Brak schematu | ✅ Pełna struktura (`src/core/`, `src/targets/`, `src/adapters/`) | ✅ DONE |
| **One Truth** | ✅ contract.yml | ✅ contract.yml + output.schema.json + CERBER.md | ✅ ENHANCED |
| **Targets** | ❌ Tylko GitHub Actions | ✅ github-actions + gitlab-ci + generic-yaml | ✅ ADDED |
| **Tool Manager** | ❌ Brak | ✅ src/core/tool-manager.ts (detection, caching, versions) | ✅ ADDED |
| **Target Manager** | ❌ Brak | ✅ src/core/target-manager.ts (multi-target support) | ✅ ADDED |
| **File Discovery** | ❌ Prosty glob | ✅ src/core/file-discovery.ts (staged/changed/all) | ✅ ADDED |
| **SCM Integration** | ❌ Brak | ✅ src/scm/git.ts (staged files, changed files, base branch diff) | ✅ ADDED |
| **Path Safety** | ❌ Brak | ✅ src/security/path-safety.ts (blokada ../) | ✅ ADDED |
| **Reporting Formats** | ⚠️ Tylko text/json | ✅ text + json + github + sarif | ✅ ENHANCED |
| **Stdin/Paths Mode** | ❌ Brak | ✅ cerber validate --stdin, --paths | ✅ ADDED |
| **Guardian Pre-commit** | ✅ Planned | ✅ lint-staged + cerber guard --staged | ✅ ENHANCED |
| **Docker Image** | ❌ Brak | ✅ ghcr.io/agaslez/cerber-core:2.0.0 | ✅ ADDED |
| **GitHub Action** | ❌ Brak | ✅ agaslez/cerber-core/actions/cerber-validate@v2 | ✅ ADDED |
| **Universal CI** | ⚠️ Tylko GitHub | ✅ GitHub + GitLab + Jenkins + Azure + CircleCI | ✅ ENHANCED |
| **Adapters** | ✅ actionlint, zizmor, ratchet | ✅ actionlint, zizmor, gitleaks | ✅ ADJUSTED |
| **Profiles** | ✅ solo/dev/team | ✅ solo/dev/team + modes (guard/ci) | ✅ ENHANCED |
| **Agent Rules** | ❌ Brak | ✅ AGENTS.md + .github/copilot-instructions.md | ✅ ADDED |

**Summary:**
- ✅ **15 New Elements** added from Stefan's plan
- ✅ **5 Enhanced Elements** (reporting, profiles, one truth, CI, guardian)
- ✅ **3 Adjusted Elements** (adapters: ratchet → gitleaks for better security coverage)
- ✅ **Zero Conflicts** - wszystko spójne z filozofią "jedna prawda"

**Key Architecture Decisions:**

1. **Uniwersalność wykonawcza (CLI + Docker):**
   ✅ Cerber działa lokalnie, w każdym CI, w pre-commit
   ✅ Docker image dla CI bez Node.js
   ✅ Stdin/paths mode dla pipeline integration

2. **Uniwersalność merytoryczna (Targets):**
   ✅ github-actions (Phase 1)
   ✅ gitlab-ci (architecture ready, implementation Phase 2+)
   ✅ generic-yaml (architecture ready)

3. **"Dyrygent, nie orkiestra":**
   ✅ Cerber = orchestrator (kontrakty + adaptery + reporting)
   ✅ Tools = executors (actionlint, zizmor, gitleaks)
   ✅ No reinventing (używamy gotowych narzędzi)

4. **Jedna prawda:**
   ✅ contract.yml = policy (CO sprawdzamy)
   ✅ output.schema.json = format (JAK raportujemy)
   ✅ CERBER.md = spec (DLACZEGO tak działa)

**Stefan's Philosophy → Roadmap Mapping:**

| Stefan's Point | Roadmap Section | Implementation |
|----------------|-----------------|----------------|
| "Jedna prawda" | Phase 0 | contract.yml + output.schema.json + CERBER.md |
| "No reinventing" | Phase 1.4-1.7 | Adapters (actionlint, zizmor, gitleaks) |
| "Targets" | Phase 1.2 | TargetManager + github-actions/gitlab-ci/generic |
| "Tool manager" | Phase 1.1 | ToolManager (detection, caching, hints) |
| "Guardian pre-commit" | Phase 3 | lint-staged + cerber guard --staged |
| "Stdin/paths mode" | Phase 2.1 | cerber validate --stdin, --paths |
| "Docker image" | Phase 6.1 | ghcr.io/agaslez/cerber-core:2.0.0 |
| "SARIF reporter" | Phase 1.6 | format-sarif.ts (GitHub Code Scanning) |
| "Plugin API" | Phase 1.4 | ToolAdapter interface |
| "Universal CI" | Phase 6.3 | docs/ci-examples.md (wszystkie platformy) |

**Verdict:** ✅ **ROADMAP FULLY ALIGNED WITH STEFAN'S ARCHITECTURE** 🎯

---

**END OF ROADMAP**

🛡️ **Cerber Core V2.0 - "One Truth, Many Tools"**

*Przygotowane do akceptacji - czekam na Twoje GO!*
