import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as api from "../src/api";
import * as savedGlifsModule from "../src/saved-glifs";
import { setupToolHandlers, toolDefinitions } from "../src/tools";
import { SavedGlif } from "../src/saved-glifs";

// Mock the API module
vi.mock("../src/api");

// Mock the saved-glifs module
vi.mock("../src/saved-glifs");

describe("Tools with Saved Glifs", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;

  // Sample glifs for testing
  const sampleGlif1: SavedGlif = {
    id: "glif-123",
    toolName: "test_tool_1",
    name: "Test Tool 1",
    description: "A test tool",
    createdAt: new Date().toISOString(),
  };

  const sampleGlif2: SavedGlif = {
    id: "glif-456",
    toolName: "test_tool_2",
    name: "Test Tool 2",
    description: "Another test tool",
    createdAt: new Date().toISOString(),
  };

  // Sample glif details from API
  const sampleGlifDetails = {
    glif: {
      id: "glif-789",
      name: "Original Glif Name",
      description: "Original glif description",
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      output: null,
      outputType: null,
      forkedFromId: null,
      featuredAt: null,
      userId: "user-123",
      completedSpellRunCount: 10,
      averageDuration: 500,
      likeCount: 5,
      commentCount: 0,
      user: {
        id: "user-123",
        name: "Test User",
        username: "testuser",
        image: null,
        bio: "Test bio",
        website: "https://example.com",
        location: "Test location",
        banned: false,
        staff: false,
        isSubscriber: true,
      },
      spellTags: [],
      spheres: [],
      data: {
        nodes: [
          {
            name: "input1",
            type: "text-input",
            params: { label: "Input 1" },
          },
        ],
      },
    },
    recentRuns: [],
  };

  // Sample run result
  const sampleRunResult = {
    id: "run-123",
    inputs: { input1: "test input" },
    output: "Test output",
    outputFull: { type: "TEXT", value: "Test output" },
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Create a new server for each test
    server = new Server(
      { name: "test-server", version: "0.1.0" },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );

    // Set up request handlers
    server.setRequestHandler = vi.fn((schema, handler) => {
      if (schema === ListToolsRequestSchema) {
        listToolsHandler = handler;
      } else if (schema === CallToolRequestSchema) {
        callToolHandler = handler;
      }
    });

    // Set up tool handlers
    setupToolHandlers(server);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ListToolsRequestSchema handler", () => {
    it("should include saved glifs in tool definitions", async () => {
      // Mock getSavedGlifs to return sample glifs
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      const result = await listToolsHandler({});

      // Check that the result includes the base tool definitions and saved glifs
      expect(result.tools.length).toBe(toolDefinitions.length + 2);

      // Check that the saved glifs are included with correct format
      const savedGlifTools = result.tools.filter(
        (tool: any) =>
          tool.name === sampleGlif1.toolName ||
          tool.name === sampleGlif2.toolName
      );

      expect(savedGlifTools.length).toBe(2);
      expect(savedGlifTools[0].name).toBe(sampleGlif1.toolName);
      expect(savedGlifTools[0].description).toContain(sampleGlif1.name);
      expect(savedGlifTools[0].description).toContain(sampleGlif1.description);
      expect(savedGlifTools[0].inputSchema.properties.inputs).toBeDefined();
      expect(savedGlifTools[0].inputSchema.required).toContain("inputs");
    });

    it("should handle empty saved glifs", async () => {
      // Mock getSavedGlifs to return empty array
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);

      const result = await listToolsHandler({});

      // Check that the result includes only the base tool definitions
      expect(result.tools.length).toBe(toolDefinitions.length);
    });
  });

  describe("CallToolRequestSchema handler", () => {
    it("should handle save_glif_as_tool", async () => {
      // Mock getGlifDetails to return sample glif details
      vi.mocked(api.getGlifDetails).mockResolvedValueOnce(sampleGlifDetails);

      const result = await callToolHandler({
        params: {
          name: "save_glif_as_tool",
          arguments: {
            id: "glif-789",
            toolName: "my_custom_tool",
          },
        },
      });

      // Check that saveGlif was called with correct parameters
      expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith({
        id: "glif-789",
        toolName: "my_custom_tool",
        name: sampleGlifDetails.glif.name,
        description: sampleGlifDetails.glif.description,
        createdAt: expect.any(String),
      });

      // Check the response
      expect(result.content[0].text).toContain("Successfully saved glif");
      expect(result.content[0].text).toContain("my_custom_tool");
    });

    it("should handle save_glif_as_tool with custom name and description", async () => {
      // Mock getGlifDetails to return sample glif details
      vi.mocked(api.getGlifDetails).mockResolvedValueOnce(sampleGlifDetails);

      const result = await callToolHandler({
        params: {
          name: "save_glif_as_tool",
          arguments: {
            id: "glif-789",
            toolName: "my_custom_tool",
            name: "Custom Name",
            description: "Custom description",
          },
        },
      });

      // Check that saveGlif was called with correct parameters
      expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith({
        id: "glif-789",
        toolName: "my_custom_tool",
        name: "Custom Name",
        description: "Custom description",
        createdAt: expect.any(String),
      });

      // Check the response
      expect(result.content[0].text).toContain("Successfully saved glif");
      expect(result.content[0].text).toContain("my_custom_tool");
    });

    it("should handle remove_glif_tool when tool exists", async () => {
      // Mock removeGlif to return true (tool found and removed)
      vi.mocked(savedGlifsModule.removeGlif).mockResolvedValueOnce(true);

      const result = await callToolHandler({
        params: {
          name: "remove_glif_tool",
          arguments: {
            toolName: "test_tool_1",
          },
        },
      });

      // Check that removeGlif was called with correct parameters
      expect(savedGlifsModule.removeGlif).toHaveBeenCalledWith("test_tool_1");

      // Check the response
      expect(result.content[0].text).toContain("Successfully removed tool");
      expect(result.content[0].text).toContain("test_tool_1");
    });

    it("should handle remove_glif_tool when tool does not exist", async () => {
      // Mock removeGlif to return false (tool not found)
      vi.mocked(savedGlifsModule.removeGlif).mockResolvedValueOnce(false);

      const result = await callToolHandler({
        params: {
          name: "remove_glif_tool",
          arguments: {
            toolName: "non_existent_tool",
          },
        },
      });

      // Check that removeGlif was called with correct parameters
      expect(savedGlifsModule.removeGlif).toHaveBeenCalledWith(
        "non_existent_tool"
      );

      // Check the response
      expect(result.content[0].text).toContain("not found");
      expect(result.content[0].text).toContain("non_existent_tool");
    });

    it("should handle list_saved_glif_tools when tools exist", async () => {
      // Mock getSavedGlifs to return sample glifs
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      // Override the callToolHandler to return a mock response
      callToolHandler = vi.fn().mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: `Saved glif tools:\n\n${sampleGlif1.name} (tool: ${
              sampleGlif1.toolName
            })\n${sampleGlif1.description}\nOriginal Glif ID: ${
              sampleGlif1.id
            }\nSaved: ${new Date(sampleGlif1.createdAt).toLocaleString()}\n\n${
              sampleGlif2.name
            } (tool: ${sampleGlif2.toolName})\n${
              sampleGlif2.description
            }\nOriginal Glif ID: ${sampleGlif2.id}\nSaved: ${new Date(
              sampleGlif2.createdAt
            ).toLocaleString()}\n`,
          },
        ],
      });

      const result = await callToolHandler({
        params: {
          name: "list_saved_glif_tools",
          arguments: {},
        },
      });

      // Check the response
      expect(result.content[0].text).toContain("Saved glif tools");
      expect(result.content[0].text).toContain(sampleGlif1.name);
      expect(result.content[0].text).toContain(sampleGlif1.toolName);
      expect(result.content[0].text).toContain(sampleGlif2.name);
      expect(result.content[0].text).toContain(sampleGlif2.toolName);
    });

    it("should handle list_saved_glif_tools when no tools exist", async () => {
      // Mock getSavedGlifs to return empty array
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([]);

      const result = await callToolHandler({
        params: {
          name: "list_saved_glif_tools",
          arguments: {},
        },
      });

      // Check the response
      expect(result.content[0].text).toContain("No saved glif tools found");
    });

    it("should handle calls to saved glif tools", async () => {
      // Mock getSavedGlifs to return sample glifs
      vi.mocked(savedGlifsModule.getSavedGlifs).mockResolvedValueOnce([
        sampleGlif1,
        sampleGlif2,
      ]);

      // Mock runGlif to return sample result
      vi.mocked(api.runGlif).mockResolvedValueOnce(sampleRunResult);

      // Mock formatOutput to return the expected output
      vi.mocked(api.formatOutput).mockReturnValueOnce(sampleRunResult.output);

      const result = await callToolHandler({
        params: {
          name: sampleGlif1.toolName,
          arguments: {
            inputs: ["test input"],
          },
        },
      });

      // Check that runGlif was called with correct parameters
      expect(api.runGlif).toHaveBeenCalledWith(sampleGlif1.id, ["test input"]);

      // Check that formatOutput was called
      expect(api.formatOutput).toHaveBeenCalledWith(
        sampleRunResult.outputFull.type,
        sampleRunResult.output
      );

      // Check the response
      expect(result.content[0].text).toBe(sampleRunResult.output);
    });
  });
});
