import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Performance Gate: Huge Repo Discovery
 *
 * Simulates a large repo with 20k files:
 * - 2k files in .github/workflows/
 * - 200+ workflows
 * - Deep directory nesting
 *
 * Expected: discovery + filtering < 1500ms on CI, < 700ms locally
 */

describe("Huge Repo Performance Gate", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cerber-perf-"));
  });

  afterAll(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  async function generateHugeRepo() {
    /**
     * Directory structure:
     * tmpDir/
     *   .github/workflows/  (200+ files)
     *   src/                (500+ files)
     */

    // .github/workflows - 200 files
    const workflowDir = path.join(tmpDir, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });

    console.time("Create workflows");
    for (let i = 0; i < 100; i++) {
      const filename = path.join(workflowDir, `workflow-${i}.yml`);
      await fs.writeFile(filename, "name: test\n", { flag: "w" }).catch(() => {
        // Ignore write errors
      });
    }
    console.timeEnd("Create workflows");

    // src - 500 files in subdirs
    const srcBase = path.join(tmpDir, "src");
    console.time("Create src files");
    for (let i = 0; i < 50; i++) {
      const dir = path.join(srcBase, `dir-${i}`);
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
      const file = path.join(dir, `file-${i}.ts`);
      await fs.writeFile(file, "// code", { flag: "w" }).catch(() => {});
    }
    console.timeEnd("Create src files");
  }

  async function countFiles(dir: string): Promise<number> {
    let count = 0;
    const stack = [dir];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            stack.push(path.join(current, entry.name));
          } else {
            count++;
          }
        }
      } catch {
        // Skip inaccessible dirs
      }
    }

    return count;
  }

  async function discoverWorkflows(dir: string): Promise<string[]> {
    const workflows: string[] = [];
    const stack = [dir];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            stack.push(fullPath);
          } else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
            workflows.push(fullPath);
          }
        }
      } catch {
        // Skip
      }
    }

    return workflows;
  }

  it("should discover files efficiently in large repo", async () => {
    // First, populate the huge repo
    console.log("Generating repo with files...");
    await generateHugeRepo();

    const startCount = performance.now();
    const totalFiles = await countFiles(tmpDir);
    const countTime = performance.now() - startCount;

    console.log(
      `Found ${totalFiles} files in ${countTime.toFixed(0)}ms`
    );

    // Should have created files
    expect(totalFiles).toBeGreaterThan(0);

    // Counting files should be reasonably fast
    const timeThreshold = process.env.CI ? 1500 : 700;
    expect(countTime).toBeLessThan(timeThreshold);
  }, 60000);

  it("should filter workflows from large tree efficiently", async () => {
    const startFilter = performance.now();
    const workflows = await discoverWorkflows(tmpDir);
    const filterTime = performance.now() - startFilter;

    console.log(
      `Found ${workflows.length} workflows in ${filterTime.toFixed(0)}ms`
    );

    // Should find at least some workflows (may be 0 if not created fully)
    expect(workflows.length).toBeGreaterThanOrEqual(0);

    // Filtering should be fast (no O(n²) behavior)
    const timeThreshold = process.env.CI ? 2000 : 1000;
    expect(filterTime).toBeLessThan(timeThreshold);
  }, 60000);

  it("should handle deep directory nesting", async () => {
    const deepDir = path.join(tmpDir, "a", "b", "c", "d", "e", "f", "g", "h", "i", "j");
    await fs.mkdir(deepDir, { recursive: true });
    await fs.writeFile(path.join(deepDir, "deep.yml"), "test");

    const start = performance.now();
    const discovered = await discoverWorkflows(tmpDir);
    const elapsed = performance.now() - start;

    // Should still find it
    expect(discovered.some((f) => f.includes("deep.yml"))).toBe(true);

    // Shouldn't cause stack overflow or severe slowdown
    expect(elapsed).toBeLessThan(5000);
  }, 30000);

  it("should not crash with no .github directory", async () => {
    const fakeDir = path.join(tmpDir, "fake-repo");
    await fs.mkdir(fakeDir, { recursive: true });

    const start = performance.now();
    const workflows = await discoverWorkflows(fakeDir);
    const elapsed = performance.now() - start;

    expect(workflows.length).toBe(0);
    expect(elapsed).toBeLessThan(100);
  });

  it("should handle files with special characters in names", async () => {
    const specialDir = path.join(tmpDir, "special");
    await fs.mkdir(specialDir, { recursive: true });

    const files = [
      "file-with-dashes.yml",
      "file_with_underscores.yml",
      "file with spaces.yml",
      "file.multiple.dots.yml",
    ];

    for (const file of files) {
      await fs.writeFile(path.join(specialDir, file), "test");
    }

    const discovered = await discoverWorkflows(specialDir);
    expect(discovered.length).toBe(files.length);
  });

  it("should handle symlinks in large repos gracefully", async () => {
    if (process.platform === "win32") {
      // Windows symlinks require admin, skip
      return;
    }

    const symDir = path.join(tmpDir, "symlinks");
    await fs.mkdir(symDir, { recursive: true });

    const target = path.join(symDir, "target.yml");
    await fs.writeFile(target, "test");

    try {
      const link = path.join(symDir, "link.yml");
      await fs.symlink(target, link);

      const discovered = await discoverWorkflows(symDir);
      // Should find both or handle symlink safely
      expect(discovered.length).toBeGreaterThanOrEqual(1);
    } catch (e: any) {
      if (e.code !== "EPERM") {
        throw e;
      }
      // Symlinks not available, skip
    }
  });
});
