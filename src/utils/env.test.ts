import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { env } from "./env.js";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear all relevant env vars
    delete process.env.IGNORE_DISCOVERY_TOOLS;
    delete process.env.IGNORE_METASKILL_TOOLS;
    delete process.env.IGNORE_SAVED_GLIFS;
    delete process.env.AGENT_TOOLS;
    delete process.env.BOT_TOOLS;
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

  describe("metaskill tools", () => {
    it("should be enabled by default", () => {
      expect(env.metaskill.enabled()).toBe(true);
    });

    it("should be disabled when IGNORE_METASKILL_TOOLS=true", () => {
      process.env.IGNORE_METASKILL_TOOLS = "true";
      expect(env.metaskill.enabled()).toBe(false);
    });
  });

  describe("saved glifs", () => {
    it("should be enabled by default", () => {
      expect(env.savedGlifs.enabled()).toBe(true);
    });

    it("should be disabled when IGNORE_SAVED_GLIFS=true", () => {
      process.env.IGNORE_SAVED_GLIFS = "true";
      expect(env.savedGlifs.enabled()).toBe(false);
    });
  });

  describe("agent tools (backward compatibility)", () => {
    it("should be disabled by default", () => {
      expect(env.agents.enabled()).toBe(false);
    });

    it("should be enabled with AGENT_TOOLS=true", () => {
      process.env.AGENT_TOOLS = "true";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should be enabled with AGENT_TOOLS=1", () => {
      process.env.AGENT_TOOLS = "1";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should be enabled with AGENT_TOOLS=yes", () => {
      process.env.AGENT_TOOLS = "yes";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should be enabled with BOT_TOOLS=true (backward compat)", () => {
      process.env.BOT_TOOLS = "true";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should be enabled with BOT_TOOLS=1 (backward compat)", () => {
      process.env.BOT_TOOLS = "1";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should prefer AGENT_TOOLS over BOT_TOOLS when both set", () => {
      process.env.AGENT_TOOLS = "true";
      process.env.BOT_TOOLS = "false";
      expect(env.agents.enabled()).toBe(true);
    });

    it("should work with case-insensitive values", () => {
      process.env.AGENT_TOOLS = "TRUE";
      expect(env.agents.enabled()).toBe(true);

      process.env.AGENT_TOOLS = "True";
      expect(env.agents.enabled()).toBe(true);

      process.env.AGENT_TOOLS = "YES";
      expect(env.agents.enabled()).toBe(true);
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
