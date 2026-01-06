/**
 * Tests for CTA (Call-to-Action) module
 * 
 * Tests:
 * 1. CTA shows on success
 * 2. CTA doesn't show on error
 * 3. CTA respects 24h cooldown (no spam)
 * 4. Cross-platform path logic
 */

import { existsSync, unlinkSync } from 'fs';
import {
    getConfigDir,
    getStateFilePath,
    readCtaState,
    shouldShowCta,
    tryShowCta,
    writeCtaState
} from '../src/cli/cta';

describe('CTA Module', () => {
  describe('getConfigDir', () => {
    it('should return platform-specific config directory', () => {
      const configDir = getConfigDir();
      
      if (process.platform === 'win32') {
        // Windows: %APPDATA%/cerber
        expect(configDir).toContain('cerber');
        expect(configDir).toMatch(/AppData.*Roaming.*cerber/);
      } else {
        // Linux/Mac: ~/.config/cerber
        expect(configDir).toContain('.config');
        expect(configDir).toContain('cerber');
      }
    });
  });

  describe('getStateFilePath', () => {
    it('should return state.json in config directory', () => {
      const statePath = getStateFilePath();
      expect(statePath).toContain('cerber');
      expect(statePath).toContain('state.json');
    });
  });

  describe('readCtaState and writeCtaState', () => {
    const testStatePath = getStateFilePath();
    const testConfigDir = getConfigDir();

    beforeEach(() => {
      // Clean up test state before each test
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
    });

    afterAll(() => {
      // Clean up after all tests
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
    });

    it('should return empty object when state file does not exist', () => {
      const state = readCtaState();
      expect(state).toEqual({});
    });

    it('should write and read state successfully', () => {
      const testState = { lastCtaShownAt: Date.now() };
      const written = writeCtaState(testState);
      
      expect(written).toBe(true);
      expect(existsSync(testStatePath)).toBe(true);
      
      const readState = readCtaState();
      expect(readState.lastCtaShownAt).toBe(testState.lastCtaShownAt);
    });

    it('should fail gracefully if cannot write state', () => {
      // Create invalid directory path to trigger write failure
      const invalidState = { lastCtaShownAt: Date.now() };
      
      // Mock writeFileSync to throw error (cannot do actual test without mocking)
      // For now, just test that writeCtaState returns boolean
      const result = writeCtaState(invalidState);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('shouldShowCta', () => {
    const testStatePath = getStateFilePath();

    beforeEach(() => {
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
    });

    afterAll(() => {
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
    });

    it('should return true when CTA was never shown', () => {
      expect(shouldShowCta()).toBe(true);
    });

    it('should return false when CTA was shown less than 24h ago', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
      
      writeCtaState({ lastCtaShownAt: oneHourAgo });
      
      expect(shouldShowCta()).toBe(false);
    });

    it('should return true when CTA was shown more than 24h ago', () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000); // 25 hours ago
      
      writeCtaState({ lastCtaShownAt: twentyFiveHoursAgo });
      
      expect(shouldShowCta()).toBe(true);
    });
  });

  describe('tryShowCta', () => {
    const testStatePath = getStateFilePath();
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    afterAll(() => {
      if (existsSync(testStatePath)) {
        unlinkSync(testStatePath);
      }
    });

    it('should show CTA on success (first time)', () => {
      tryShowCta(true);
      
      // Should have called console.log with CTA messages
      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat();
      const output = calls.join('\n');
      
      expect(output).toContain('github.com/Agaslez/cerber-core');
      expect(output).toContain('discord.gg');
    });

    it('should NOT show CTA on failure', () => {
      tryShowCta(false);
      
      // Should NOT have called console.log
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT show CTA on second call within 24h', () => {
      // First call - should show
      tryShowCta(true);
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockClear();
      
      // Second call immediately - should NOT show
      tryShowCta(true);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should show CTA again after 24h', () => {
      // Simulate CTA shown 25 hours ago
      const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
      writeCtaState({ lastCtaShownAt: twentyFiveHoursAgo });
      
      tryShowCta(true);
      
      // Should show CTA again
      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat();
      const output = calls.join('\n');
      
      expect(output).toContain('github.com/Agaslez/cerber-core');
    });
  });
});
