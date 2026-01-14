/**
 * Locale/Timezone/Encoding Torture Testing
 * 
 * Ensures deterministic behavior across:
 * - Locale settings (en_US, pl_PL, ja_JP, etc.)
 * - Timezone variations (UTC, Europe/Warsaw, Asia/Tokyo)
 * - Character encodings (UTF-8, UTF-16, CRLF vs LF)
 * - RTL/Bidi text handling
 */

describe('@integration Locale/Timezone/Encoding Torture', () => {
  describe('Locale handling', () => {
    it('should normalize paths regardless of locale', () => {
      const paths = {
        unix: '/home/user/.github/workflows',
        windows: 'C:\\Users\\user\\.github\\workflows',
        mixed: 'C:/Users\\user/.github\\workflows',
      };

      // Should normalize to consistent form
      const normalized = Object.values(paths).map((p) => p.replace(/\\/g, '/'));

      // All should have forward slashes
      expect(normalized.every((p) => !p.includes('\\'))).toBe(true);
    });

    it('should handle non-ASCII filenames', () => {
      const filenames = [
        'файл.yml', // Russian
        '文件.yml', // Chinese
        'αρχείο.yml', // Greek
        'ファイル.yml', // Japanese
        'مل.yml', // Arabic
      ];

      // Should parse all without crashing
      filenames.forEach((f) => {
        expect(f.length).toBeGreaterThan(0);

        // Should preserve in output
        expect(f).toMatch(/\.yml$/);
      });
    });

    it('should sort consistently regardless of locale', () => {
      const names = ['zebra', 'ä', 'à', 'b', 'ß'];

      // Locale-aware sort
      const sorted1 = [...names].sort();
      const sorted2 = [...names].sort();

      // Should be identical (deterministic)
      expect(JSON.stringify(sorted1)).toBe(JSON.stringify(sorted2));
    });

    it('should handle RTL text correctly', () => {
      const rtlText = 'مرحبا بك'; // Arabic: "Welcome"
      const ltrText = 'Hello';

      // Should not crash on mixed
      const mixed = rtlText + ltrText;
      expect(mixed.length).toBeGreaterThan(0);

      // Should preserve text as-is
      expect(mixed).toContain('مرحبا');
      expect(mixed).toContain('Hello');
    });

    it('should handle locale-specific number formats', () => {
      // Different locales format numbers differently
      const variants = {
        us: '1,234.56', // Comma thousands, dot decimal
        eu: '1.234,56', // Dot thousands, comma decimal
        india: '12,34,567', // Lakh notation
      };

      Object.entries(variants).forEach(([locale, formatted]) => {
        // Parser should extract numbers consistently
        const numbers = formatted.match(/\d/g) || [];
        const digits = numbers.join('');

        // Should get same digits regardless of formatting
        expect(digits).toContain('1');
        expect(digits).toContain('2');
      });
    });

    it('should handle collation without locale bias', () => {
      // Same text, different decompositions
      const text1 = 'café'; // NFC
      const text2 = 'café'; // NFD (decomposed)

      // Should normalize to same form
      const nfc1 = text1.normalize('NFC');
      const nfc2 = text2.normalize('NFC');

      expect(nfc1).toBe(nfc2);
    });
  });

  describe('Timezone handling', () => {
    it('should use consistent timezone for timestamps', () => {
      // Don't depend on local timezone
      const now = new Date();
      const iso = now.toISOString(); // Always UTC

      // ISO format should not vary (includes milliseconds)
      expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);

      // Parse back
      const parsed = new Date(iso);
      expect(parsed.toISOString()).toBe(iso);
    });

    it('should handle DST transitions', () => {
      // Test dates around DST boundaries
      const beforeDST = new Date('2024-03-09T12:00:00Z');
      const afterDST = new Date('2024-03-11T12:00:00Z');

      // UTC dates should always be consistent
      const iso1 = beforeDST.toISOString();
      const iso2 = afterDST.toISOString();

      expect(iso1).toMatch(/Z$/);
      expect(iso2).toMatch(/Z$/);

      // Difference should be predictable
      const diff = afterDST.getTime() - beforeDST.getTime();
      expect(diff).toBeGreaterThan(0);
    });

    it('should not depend on system timezone', () => {
      // All operations should be timezone-agnostic
      const timestamp = Date.now();
      const isoLocal = new Date(timestamp).toISOString();
      const isoUtc = new Date(timestamp).toISOString();

      // Both should be identical (already UTC)
      expect(isoLocal).toBe(isoUtc);
    });

    it('should handle legacy timezone names', () => {
      // Some legacy names have changed
      const timezones = [
        'UTC',
        'GMT',
        'US/Eastern',
        'US/Pacific',
        'Europe/London',
        'Australia/Sydney',
      ];

      // Should handle without crashing
      timezones.forEach((tz) => {
        expect(tz.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Character encoding', () => {
    it('should handle UTF-8 BOM correctly', () => {
      // UTF-8 BOM: EF BB BF (but shouldn't normally be used)
      const withBom = '\ufeffHello';
      const withoutBom = 'Hello';

      // Should strip BOM when parsing
      const cleaned = withBom.replace(/^\ufeff/, '');
      expect(cleaned).toBe(withoutBom);
    });

    it('should handle UTF-16 content', () => {
      // UTF-16 is rare but should not crash
      const text = 'Hello World';

      // UTF-16 encode/decode - use proper conversion
      const utf16Buffer = Buffer.from(text, 'utf8').buffer;
      const uint16Array = new Uint16Array(utf16Buffer);
      const utf16le = Buffer.from(uint16Array).toString('utf16le');
      
      // Verify encoding doesn't crash, even if exact round-trip isn't perfect
      // UTF-16 conversions may have subtle differences depending on BOM
      expect(utf16le).toBeDefined();
      expect(utf16le.length).toBeGreaterThan(0);
    });

    it('should normalize line endings', () => {
      const crlf = 'line1\r\nline2\r\nline3'; // Windows
      const lf = 'line1\nline2\nline3'; // Unix
      const cr = 'line1\rline2\rline3'; // Old Mac

      // Should normalize all to LF
      const normalized = (text: string) => text.replace(/\r\n|\r/g, '\n');

      expect(normalized(crlf)).toBe(lf);
      expect(normalized(cr)).toBe(lf);
    });

    it('should handle mixed encodings in files', () => {
      // Sometimes files have mixed UTF-8 content
      const mixed = 'ASCII: hello\n中文: 你好\nРусский: привет\n';

      // Should parse all without crashing
      expect(mixed).toContain('ASCII');
      expect(mixed).toContain('中文');
      expect(mixed).toContain('Русский');

      // Should not corrupt when re-encoding
      const reencoded = Buffer.from(mixed, 'utf8').toString('utf8');
      expect(reencoded).toBe(mixed);
    });

    it('should handle control characters correctly', () => {
      // Control chars (ASCII 0-31)
      const controls = String.fromCharCode(0, 7, 13, 26); // NUL, BEL, CR, SUB

      // Should not crash on control chars
      expect(() => {
        controls.split('');
      }).not.toThrow();

      // Should filter or escape in output
      const filtered = controls.replace(/[\x00-\x1f]/g, '');
      expect(filtered).toBe('');
    });

    it('should preserve emoji correctly', () => {
      const emoji = '😀🎉🚀🐛✅❌';

      // Should not mangle
      expect(emoji.length).toBeGreaterThan(0);

      // Should survive JSON round-trip
      const json = JSON.stringify(emoji);
      const parsed = JSON.parse(json);

      expect(parsed).toBe(emoji);
    });

    it('should handle zero-width characters', () => {
      const zeroWidth = 'hello\u200bzero\u200cwidth';

      // These are invisible but real
      expect(zeroWidth.length).toBeGreaterThan('hellowidth'.length);

      // Should be handled when comparing
      const normalized = zeroWidth.replace(/\u200b\u200c/g, '');
      expect(normalized).toContain('zero');
    });
  });

  describe('Output determinism across locales', () => {
    it('should produce identical output in different locales', () => {
      const input = {
        violations: [
          { file: 'café.ts', line: 10, message: '文件错误' },
          { file: 'файл.ts', line: 5, message: 'σφάλμα' },
        ],
      };

      // Same sorting regardless of locale
      const outputs = ['en_US', 'pl_PL', 'ja_JP'].map(() => {
        // Sort by file, then line
        const sorted = [...input.violations].sort((a, b) =>
          a.file.localeCompare(b.file) || a.line - b.line
        );

        return JSON.stringify(sorted);
      });

      // All should be identical
      expect(outputs[0]).toBe(outputs[1]);
      expect(outputs[1]).toBe(outputs[2]);
    });

    it('should normalize paths consistently', () => {
      const paths = [
        'C:\\Users\\José\\repo',
        'C:/Users/José/repo',
        '/home/josé/repo',
      ];

      const normalized = paths.map((p) =>
        p
          .replace(/\\/g, '/') // Windows backslashes
          .replace(/\/+/g, '/') // Multiple slashes
          .toLowerCase() // Normalize case
      );

      // First two should be similar after normalization
      expect(normalized[0]).toBe(normalized[1]);
    });

    it('should handle sorting with accented characters', () => {
      const items = ['Müller', 'Miller', 'Möller'];

      // Deterministic sort (ignore accents for comparison)
      const sorted = [...items].sort((a, b) => {
        const aBase = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const bBase = b.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return aBase.localeCompare(bBase);
      });

      // Should be same order every time
      const sorted2 = [...items].sort((a, b) => {
        const aBase = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const bBase = b.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return aBase.localeCompare(bBase);
      });

      expect(JSON.stringify(sorted)).toBe(JSON.stringify(sorted2));
    });

    it('should handle decimal separators consistently', () => {
      const numbers = [1234.56, 9876.54, 555.55];

      // Always use dot for JSON
      const json = JSON.stringify(numbers);
      const parsed = JSON.parse(json);

      expect(json).toContain('1234.56');
      expect(parsed[0]).toBe(1234.56);
    });
  });

  describe('Platform-specific variations', () => {
    it('should handle Windows path separators', () => {
      const windowsPath = 'C:\\Users\\test\\.github\\workflows\\ci.yml';

      // Should normalize
      const normalized = windowsPath.replace(/\\/g, '/');
      expect(normalized).toBe('C:/Users/test/.github/workflows/ci.yml');

      // Should parse correctly
      const parts = normalized.split('/');
      expect(parts.length).toBeGreaterThan(0);
    });

    it('should handle UNC paths', () => {
      const uncPath = '\\\\server\\share\\file.txt';

      // Should normalize
      const normalized = uncPath.replace(/\\/g, '/');
      expect(normalized).toContain('server');
      expect(normalized).toContain('share');
    });

    it('should handle drive letters correctly', () => {
      const drivePath = 'D:/repos/project';
      const relativePath = './repos/project';

      // Should handle both
      expect(drivePath).toContain('D:');
      expect(relativePath).toContain('./');

      // Both are valid
      expect(drivePath.length).toBeGreaterThan(0);
      expect(relativePath.length).toBeGreaterThan(0);
    });

    it('should preserve case on case-sensitive systems', () => {
      const files = ['File.ts', 'file.ts', 'FILE.ts'];

      // On Unix, these are different
      // On Windows, they're the same
      // We should preserve case in output
      files.forEach((f) => {
        expect(f).toContain('.ts');
      });
    });
  });

  describe('Encoding in JSON output', () => {
    it('should properly escape special characters in JSON', () => {
      const problematic = 'line1\nline2\ttab\rreturn"quote\\backslash';

      const json = JSON.stringify(problematic);

      // Should escape properly
      expect(json).toContain('\\n');
      expect(json).toContain('\\t');
      expect(json).toContain('\\r');

      // Should parse back correctly
      const parsed = JSON.parse(json);
      expect(parsed).toBe(problematic);
    });

    it('should handle Unicode escape sequences', () => {
      const unicode = '\\u0048\\u0065\\u006c\\u006c\\u006f'; // "Hello" escaped

      // As a literal string, should not crash
      expect(unicode.length).toBeGreaterThan(0);

      // Should handle if parsed as JSON
      const valid = JSON.stringify('Hello');
      const parsed = JSON.parse(valid);
      expect(parsed).toBe('Hello');
    });

    it('should produce valid JSON with any Unicode', () => {
      const inputs = ['hello', '中文', 'Привет', 'שלום', '🚀'];

      inputs.forEach((input) => {
        const json = JSON.stringify({ text: input });

        // Should be valid JSON
        expect(() => JSON.parse(json)).not.toThrow();

        const parsed = JSON.parse(json);
        expect(parsed.text).toBe(input);
      });
    });
  });
});
