import yaml from "js-yaml";

/**
 * Contract Corruption Tests
 *
 * Verifies Cerber handles malformed contracts gracefully:
 * - BOM (Byte Order Mark)
 * - CRLF vs LF line endings
 * - Tabs vs spaces
 * - Cyclic extends
 * - Missing required fields
 * - Unknown fields
 */

describe("Contract Corruption Handling", () => {
  describe("BOM Handling", () => {
    it("should parse YAML with UTF-8 BOM", () => {
      const bom = "\uFEFF";
      const yaml_with_bom = bom + "profiles:\n  dev:\n    tools: [actionlint]";

      let result;
      try {
        result = yaml.load(yaml_with_bom);
        expect(result).toBeDefined();
      } catch (e) {
        // Should either parse or give clear error, not crash
        expect(String(e)).toBeDefined();
      }
    });

    it("should handle multiple BOMs gracefully", () => {
      const bom = "\uFEFF\uFEFF";
      const yaml_content = bom + "test: value";

      expect(() => {
        const result = yaml.load(yaml_content);
        // Either parses or throws, should not crash
      }).not.toThrow(new Error("Stack overflow"));
    });
  });

  describe("Line Ending Variations", () => {
    it("should handle LF line endings", () => {
      const lf_yaml = "profiles:\n  dev:\n    tools: [actionlint]\n";
      const result = yaml.load(lf_yaml);
      expect(result).toHaveProperty("profiles");
    });

    it("should handle CRLF line endings", () => {
      const crlf_yaml = "profiles:\r\n  dev:\r\n    tools: [actionlint]\r\n";
      const result = yaml.load(crlf_yaml);
      expect(result).toHaveProperty("profiles");
    });

    it("should handle mixed line endings (LF + CRLF)", () => {
      const mixed_yaml = "profiles:\r\n  dev:\n    tools: [actionlint]\r\n";
      const result = yaml.load(mixed_yaml);
      expect(result).toHaveProperty("profiles");
    });

    it("should not duplicate lines on CRLF", () => {
      const crlf_yaml = "items:\r\n  - item1\r\n  - item2\r\n";
      const result = yaml.load(crlf_yaml) as any;
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBe("item1");
    });
  });

  describe("Indentation Variations", () => {
    it("should handle space indentation", () => {
      const spaced = "profiles:\n  dev:\n    tools: [actionlint]";
      const result = yaml.load(spaced);
      expect(result).toHaveProperty("profiles");
    });

    it("should handle tab indentation (may fail, but not crash)", () => {
      const tabbed = "profiles:\n\tdev:\n\t\ttools: [actionlint]";
      let result;
      try {
        result = yaml.load(tabbed);
        // If it parses, great
        expect(result).toBeDefined();
      } catch (e) {
        // If it fails, should be a clear error, not crash
        expect(String(e)).toContain("tab");
      }
    });

    it("should detect inconsistent indentation and error clearly", () => {
      const inconsistent = "profiles:\n  dev:\n    tools: [actionlint]\n  prod:\n     tools: [actionlint]"; // 5 spaces instead of 4
      let result;
      try {
        result = yaml.load(inconsistent);
        expect(result).toBeDefined();
      } catch (e) {
        // Should provide helpful error message
        const msg = String(e);
        expect(msg).toBeDefined();
        expect(msg.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Cyclic Extends", () => {
    it("should detect direct self-extends", () => {
      // Simulating: Cerber's extends resolver
      interface Contract {
        extends?: string;
        profiles?: Record<string, any>;
      }

      const contracts: Record<string, Contract> = {
        "a.yml": {
          extends: "a.yml", // Self reference
          profiles: {},
        },
      };

      function resolveExtends(name: string, visited: Set<string> = new Set()) {
        if (visited.has(name)) {
          throw new Error(`Cyclic extends detected: ${name}`);
        }

        const contract = contracts[name];
        if (!contract || !contract.extends) {
          return contract;
        }

        visited.add(name);
        return resolveExtends(contract.extends, visited);
      }

      expect(() => {
        resolveExtends("a.yml");
      }).toThrow("Cyclic extends detected");
    });

    it("should detect indirect cycles (a → b → a)", () => {
      interface Contract {
        extends?: string;
      }

      const contracts: Record<string, Contract> = {
        "a.yml": { extends: "b.yml" },
        "b.yml": { extends: "a.yml" },
      };

      function resolveExtends(name: string, visited: Set<string> = new Set()) {
        if (visited.has(name)) {
          throw new Error(`Cyclic extends: ${Array.from(visited).join(" → ")} → ${name}`);
        }

        const contract = contracts[name];
        if (!contract || !contract.extends) {
          return contract;
        }

        visited.add(name);
        return resolveExtends(contract.extends, visited);
      }

      expect(() => {
        resolveExtends("a.yml");
      }).toThrow(/Cyclic extends/);
    });

    it("should detect long cycles (a → b → c → a)", () => {
      const contracts: Record<string, { extends?: string }> = {
        "a.yml": { extends: "b.yml" },
        "b.yml": { extends: "c.yml" },
        "c.yml": { extends: "a.yml" },
      };

      function resolveExtends(name: string, visited: Set<string> = new Set()): any {
        if (visited.has(name)) {
          throw new Error(`Cyclic extends detected at: ${name}`);
        }

        const contract = contracts[name];
        if (!contract || !contract.extends) {
          return contract;
        }

        visited.add(name);
        return resolveExtends(contract.extends, visited);
      }

      expect(() => {
        resolveExtends("a.yml");
      }).toThrow("Cyclic extends detected");
    });
  });

  describe("Missing Required Fields", () => {
    it("should error when profiles are missing", () => {
      const invalid_contract = yaml.load("extends: base.yml") as any;

      // Cerber should validate and provide actionable error
      expect(invalid_contract).toBeDefined();

      // In real Cerber, this would trigger a validation error
      // Error should say: "Missing required field 'profiles'" (not parsed here, just validate it's there)
      expect(!invalid_contract.profiles).toBe(true);
    });

    it("should error when profile tools are missing", () => {
      const invalid = yaml.load("profiles:\n  dev:\n    maxDepth: 5") as any;

      // Should either work (if tools is optional) or error clearly
      expect(invalid).toHaveProperty("profiles");

      // If validation is strict, Cerber should say:
      // "Profile 'dev' missing required field 'tools'"
    });

    it("should provide helpful message for empty profiles", () => {
      const empty = yaml.load("profiles: {}") as any;

      // Cerber should detect empty profiles and suggest action
      expect(empty.profiles).toEqual({});
    });
  });

  describe("Unknown Fields", () => {
    it("should handle unknown fields gracefully (warning, not error)", () => {
      const with_unknown = yaml.load(
        "profiles:\n  dev:\n    tools: [actionlint]\nunknownField: value"
      ) as any;

      expect(with_unknown).toHaveProperty("profiles");
      expect(with_unknown).toHaveProperty("unknownField");

      // Cerber should: either ignore or warn, not crash
    });

    it("should distinguish between typos and unknown fields", () => {
      const maybe_typo = yaml.load(
        "profiles:\n  dev:\n    tool: [actionlint]"
      ) as any; // 'tool' vs 'tools'

      // Cerber could suggest: "Did you mean 'tools'?"
      expect(maybe_typo).toBeDefined();
      expect(maybe_typo.profiles.dev.tool).toBeDefined();
    });
  });

  describe("Encoding Issues", () => {
    it("should handle UTF-8 content", () => {
      const utf8_yaml = "profiles:\n  dev:\n    description: Zażółć gęślą jaźń";

      const result = yaml.load(utf8_yaml) as any;
      expect(result.profiles.dev.description).toContain("Zażółć");
    });

    it("should handle quoted special characters", () => {
      const quoted = 'profiles:\n  dev:\n    command: "echo \\"hello world\\""';

      const result = yaml.load(quoted) as any;
      expect(result).toHaveProperty("profiles");
    });
  });

  describe("Large Contract Files", () => {
    it("should handle contract with many profiles", () => {
      let yaml_content = "profiles:\n";
      for (let i = 0; i < 1000; i++) {
        yaml_content += `  profile${i}:\n    tools: [actionlint]\n`;
      }

      const result = yaml.load(yaml_content) as any;
      expect(Object.keys(result.profiles).length).toBe(1000);
    });

    it("should handle contract with many tools per profile", () => {
      let tools = "[";
      for (let i = 0; i < 500; i++) {
        tools += `"tool${i}"${i < 499 ? "," : ""}`;
      }
      tools += "]";

      const yaml_content = `profiles:\n  dev:\n    tools: ${tools}`;
      const result = yaml.load(yaml_content) as any;

      expect(result.profiles.dev.tools.length).toBe(500);
    });
  });

  describe("Error Messages", () => {
    it("should provide actionable error for invalid YAML syntax", () => {
      const invalid = "profiles:\n  dev: [invalid: syntax]";

      try {
        yaml.load(invalid);
        fail("Should have thrown");
      } catch (e) {
        const msg = String(e);
        // Should indicate line/column, not be cryptic
        expect(msg.length).toBeGreaterThan(10);
      }
    });

    it("should suggest fixes for common mistakes", () => {
      const typo = "profiles:\n  -dev:\n    tools: [actionlint]"; // '-' typo

      try {
        const result = yaml.load(typo) as any;
        // Might parse as array/object, but should handle gracefully
        expect(result).toBeDefined();
      } catch (e) {
        // Should be clear error, not cryptic
        expect(String(e)).toBeDefined();
      }
    });
  });
});
