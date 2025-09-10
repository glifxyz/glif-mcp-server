import { describe, it, expect } from "vitest";
import {
  formatGlif,
  formatGlifList,
  formatGlifSearchResults,
  formatMyGlifs,
  formatFeaturedGlifs,
  type GlifFormatOptions,
} from "./glif-formatting.js";
import type { Glif } from "../types.js";

const createMockGlif = (overrides: Partial<Glif> = {}): Glif => ({
  id: "test-glif-123",
  name: "Test Glif",
  imageUrl: "https://example.com/image.png",
  description: "A test glif for testing",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  publishedAt: "2024-01-01T12:00:00Z",
  output: null,
  outputType: null,
  forkedFromId: null,
  featuredAt: null,
  userId: "user-123",
  completedSpellRunCount: 42,
  averageDuration: 1500,
  likeCount: 15,
  commentCount: 3,
  user: {
    id: "user-123",
    name: "Test User",
    image: null,
    username: "testuser",
    bio: "Test bio",
    website: "https://example.com",
    location: "Test City",
    banned: false,
    bannedAt: null,
    rateLimitClass: "default",
    staff: false,
    isSubscriber: false,
  },
  ...overrides,
});

describe("Glif Formatting", () => {
  describe("formatGlif", () => {
    it("should format a basic glif with default options", () => {
      const glif = createMockGlif();
      const result = formatGlif(glif);

      expect(result).toBe(
        "Test Glif (test-glif-123)\n" +
          "A test glif for testing\n" +
          "By: Test User\n" +
          "Runs: 42"
      );
    });

    it("should handle glif without description", () => {
      const glif = createMockGlif({ description: null });
      const result = formatGlif(glif);

      expect(result).toBe(
        "Test Glif (test-glif-123)\n" + "By: Test User\n" + "Runs: 42"
      );
    });

    it("should handle glif without user", () => {
      const glif = createMockGlif();
      glif.user = undefined as any;
      const result = formatGlif(glif);

      expect(result).toBe(
        "Test Glif (test-glif-123)\n" + "A test glif for testing\n" + "Runs: 42"
      );
    });

    it("should include creation date when requested", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = { includeCreatedDate: true };
      const result = formatGlif(glif, options);

      expect(result).toContain("Created:");
      // Check for date components (more flexible than exact year)
      expect(result).toMatch(
        /Created:.*\d{1,2}\/\d{1,2}\/\d{4}|Created:.*\d{4}/
      );
    });

    it("should include likes when requested", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = { includeLikes: true };
      const result = formatGlif(glif, options);

      expect(result).toContain("Likes: 15");
    });

    it("should exclude user when requested", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = { includeUser: false };
      const result = formatGlif(glif, options);

      expect(result).not.toContain("By: Test User");
      expect(result).toBe(
        "Test Glif (test-glif-123)\n" + "A test glif for testing\n" + "Runs: 42"
      );
    });

    it("should exclude runs when requested", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = { includeRuns: false };
      const result = formatGlif(glif, options);

      expect(result).not.toContain("Runs:");
      expect(result).toBe(
        "Test Glif (test-glif-123)\n" +
          "A test glif for testing\n" +
          "By: Test User"
      );
    });

    it("should use ISO date format when requested", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = {
        includeCreatedDate: true,
        dateFormat: "iso",
      };
      const result = formatGlif(glif, options);

      expect(result).toContain("Created: 2024-01-01T00:00:00.000Z");
    });

    it("should handle multiple custom options", () => {
      const glif = createMockGlif();
      const options: GlifFormatOptions = {
        includeUser: false,
        includeRuns: false,
        includeCreatedDate: true,
        includeLikes: true,
        dateFormat: "iso",
      };
      const result = formatGlif(glif, options);

      expect(result).toBe(
        "Test Glif (test-glif-123)\n" +
          "A test glif for testing\n" +
          "Created: 2024-01-01T00:00:00.000Z\n" +
          "Likes: 15"
      );
    });

    it("should handle missing run count gracefully", () => {
      const glif = createMockGlif({ completedSpellRunCount: undefined });
      const result = formatGlif(glif);

      expect(result).not.toContain("Runs:");
    });

    it("should handle missing like count gracefully", () => {
      const glif = createMockGlif({ likeCount: undefined });
      const options: GlifFormatOptions = { includeLikes: true };
      const result = formatGlif(glif, options);

      expect(result).not.toContain("Likes:");
    });
  });

  describe("formatGlifList", () => {
    it("should format multiple glifs with separation", () => {
      const glifs = [
        createMockGlif({ id: "glif-1", name: "First Glif" }),
        createMockGlif({ id: "glif-2", name: "Second Glif" }),
      ];

      const result = formatGlifList(glifs);

      expect(result).toContain("First Glif (glif-1)");
      expect(result).toContain("Second Glif (glif-2)");
      expect(result).toContain("\n\n"); // Double newline separation
    });

    it("should handle empty glif list", () => {
      const result = formatGlifList([]);

      expect(result).toBe("No glifs found.");
    });

    it("should format single glif without extra separators", () => {
      const glifs = [createMockGlif()];
      const result = formatGlifList(glifs);

      expect(result).toBe(formatGlif(glifs[0]));
      expect(result).not.toContain("\n\n");
    });

    it("should pass options to individual glif formatting", () => {
      const glifs = [createMockGlif()];
      const options: GlifFormatOptions = { includeUser: false };
      const result = formatGlifList(glifs, options);

      expect(result).not.toContain("By:");
    });
  });

  describe("Specialized formatting functions", () => {
    describe("formatGlifSearchResults", () => {
      it("should include user and runs by default", () => {
        const glifs = [createMockGlif()];
        const result = formatGlifSearchResults(glifs);

        expect(result).toContain("By: Test User");
        expect(result).toContain("Runs: 42");
        expect(result).not.toContain("Created:");
        expect(result).not.toContain("Likes:");
      });

      it("should handle multiple search results", () => {
        const glifs = [
          createMockGlif({ id: "search-1", name: "Search Result 1" }),
          createMockGlif({ id: "search-2", name: "Search Result 2" }),
        ];
        const result = formatGlifSearchResults(glifs);

        expect(result).toContain("Search Result 1");
        expect(result).toContain("Search Result 2");
        expect(result).toContain("\n\n");
      });
    });

    describe("formatMyGlifs", () => {
      it("should exclude user but include creation date", () => {
        const glifs = [createMockGlif()];
        const result = formatMyGlifs(glifs);

        expect(result).not.toContain("By:");
        expect(result).toContain("Runs: 42");
        expect(result).toContain("Created:");
      });

      it("should use locale date format", () => {
        const glifs = [createMockGlif()];
        const result = formatMyGlifs(glifs);

        // Should contain formatted date but not ISO format
        expect(result).toContain("Created:");
        expect(result).not.toContain("T00:00:00");
      });
    });

    describe("formatFeaturedGlifs", () => {
      it("should include user, runs, and likes", () => {
        const glifs = [createMockGlif()];
        const result = formatFeaturedGlifs(glifs);

        expect(result).toContain("By: Test User");
        expect(result).toContain("Runs: 42");
        expect(result).toContain("Likes: 15");
        expect(result).not.toContain("Created:");
      });

      it("should handle featured glifs without likes", () => {
        const glifs = [createMockGlif({ likeCount: undefined })];
        const result = formatFeaturedGlifs(glifs);

        expect(result).toContain("By: Test User");
        expect(result).toContain("Runs: 42");
        expect(result).not.toContain("Likes:");
      });
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle glifs with minimal data", () => {
      const minimalGlif: Glif = {
        id: "minimal",
        name: "Minimal",
        imageUrl: null,
        description: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        publishedAt: null,
        output: null,
        outputType: null,
        forkedFromId: null,
        featuredAt: null,
        userId: "user-minimal",
        user: {
          id: "user-minimal",
          name: "Minimal User",
          image: null,
          username: "minimal",
        } as any,
      } as Glif;

      const result = formatGlif(minimalGlif);

      expect(result).toBe("Minimal (minimal)\nBy: Minimal User");
    });

    it("should handle very long descriptions gracefully", () => {
      const longDescription = "A".repeat(1000);
      const glif = createMockGlif({ description: longDescription });
      const result = formatGlif(glif);

      expect(result).toContain(longDescription);
      expect(result).toContain("Test Glif (test-glif-123)");
    });

    it("should handle special characters in names and descriptions", () => {
      const glif = createMockGlif({
        name: "Glif with émojis 🎨 and símböls",
        description: "Description with\nnewlines and\ttabs",
      });

      const result = formatGlif(glif);

      expect(result).toContain("Glif with émojis 🎨 and símböls");
      expect(result).toContain("Description with\nnewlines and\ttabs");
    });

    it("should handle zero values correctly", () => {
      const glif = createMockGlif({
        completedSpellRunCount: 0,
        likeCount: 0,
      });

      const result = formatGlif(glif, { includeLikes: true });

      expect(result).toContain("Runs: 0");
      expect(result).toContain("Likes: 0");
    });
  });
});
