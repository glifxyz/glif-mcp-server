import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { env } from "./env.js";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.IGNORE_DISCOVERY_TOOLS;
    delete process.env.DEBUG;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("discovery tools", () => {
    it("should be enabled by default", () => {
      expect(env.discovery.enabled()).toBe(true);
    });

    it("should be disabled when IGNORE_DISCOVERY_TOOLS=true", () => {
      process.env.IGNORE_DISCOVERY_TOOLS = "true";
      expect(env.discovery.enabled()).toBe(false);
    });
  });

  describe("debug", () => {
    it("should be disabled by default", () => {
      expect(env.debug.enabled()).toBe(false);
    });

    it("should be enabled with DEBUG=true", () => {
      process.env.DEBUG = "true";
      expect(env.debug.enabled()).toBe(true);
    });
  });
});
