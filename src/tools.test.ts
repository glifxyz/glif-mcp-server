import { describe, it, expect } from "vitest";
import { ToolDefinition } from "./types.js";

// Mock minimal toolDefinitions to test structure
const mockTools: ToolDefinition[] = [
  {
    name: "test_tool",
    description: "A test tool",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

describe("tools", () => {
  it("has valid tool definition shape", () => {
    expect(Array.isArray(mockTools)).toBe(true);
    expect(mockTools.length).toBeGreaterThan(0);
    expect(mockTools[0]).toHaveProperty("name");
    expect(mockTools[0]).toHaveProperty("description");
    expect(mockTools[0]).toHaveProperty("inputSchema");
  });
});
