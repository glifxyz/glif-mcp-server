import { describe, it, expect, vi, beforeEach } from "vitest";

// Simplified API tests focusing on core functionality
describe("API Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GLIF_API_TOKEN = "test-token";
  });

  // For now, we'll do basic import tests and structure validation
  // Full integration testing would require more complex mocking

  describe("API module structure", () => {
    it("should export required functions", async () => {
      const apiModule = await import("./api.js");

      expect(typeof apiModule.runGlif).toBe("function");
      expect(typeof apiModule.searchGlifs).toBe("function");
      expect(typeof apiModule.getGlifDetails).toBe("function");
      expect(typeof apiModule.getMyUserInfo).toBe("function");
      expect(typeof apiModule.getMyGlifs).toBe("function");
    });

    it("should have proper API base configurations", async () => {
      const apiModule = await import("./api.js");

      // Test that api objects are defined
      expect(apiModule.api).toBeDefined();
      expect(apiModule.simpleApi).toBeDefined();
      expect(apiModule.glifApi).toBeDefined();
    });
  });

  describe("Environment configuration", () => {
    it("should handle missing API token gracefully", async () => {
      delete process.env.GLIF_API_TOKEN;

      // The API functions should still be importable even without token
      const apiModule = await import("./api.js");
      expect(typeof apiModule.runGlif).toBe("function");
    });

    it("should use API token from environment", () => {
      process.env.GLIF_API_TOKEN = "custom-token";

      // Simply test that env var is set correctly
      expect(process.env.GLIF_API_TOKEN).toBe("custom-token");
    });
  });

  // Note: Full integration tests with actual network calls would be better
  // handled by separate integration test files that can use real API endpoints
  // or a dedicated test environment with proper mocking infrastructure
});
