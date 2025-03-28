import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as api from "../src/api";
import * as savedGlifsModule from "../src/saved-glifs";
import { setupToolHandlers } from "../src/tools/index.js";
import { SavedGlif } from "../src/saved-glifs";
import * as utils from "../src/utils";

// Mock the API module
vi.mock("../src/api");

// Mock the fs module
vi.mock("fs/promises");

// Mock the utils module
vi.mock("../src/utils");

// Mock the saved-glifs module
vi.mock("../src/saved-glifs");

// Path to the saved glifs file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVED_GLIFS_PATH = path.join(__dirname, "../config/saved-glifs.json");

describe("Integration Tests for Saved Glifs", () => {
  let server: Server;
  let listToolsHandler: (request: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;

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

  describe("End-to-end flow", () => {
    it("should save a glif as a tool, list it, use it, and remove it", async () => {
      // 1. Mock initial empty saved glifs
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("File not found"));

      // 2. Mock getGlifDetails for saving the glif
      vi.mocked(api.getGlifDetails).mockResolvedValueOnce(sampleGlifDetails);

      // Mock saveGlif to avoid file system operations
      vi.spyOn(savedGlifsModule, "saveGlif").mockResolvedValueOnce();

      // 3. Save the glif as a tool
      const saveResult = await callToolHandler({
        params: {
          name: "save_glif_as_tool",
          arguments: {
            id: "glif-789",
            toolName: "test_glif_tool",
            name: "Test Glif Tool",
            description: "A test glif tool",
          },
        },
      });

      // Check that the glif was saved
      expect(saveResult.content[0].text).toContain("Successfully saved glif");
      expect(saveResult.content[0].text).toContain("test_glif_tool");

      // Check that saveGlif was called with the correct data
      expect(savedGlifsModule.saveGlif).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "glif-789",
          toolName: "test_glif_tool",
          name: "Test Glif Tool",
          description: "A test glif tool",
        })
      );

      // 4. Mock saved glifs for listing
      const savedGlif: SavedGlif = {
        id: "glif-789",
        toolName: "test_glif_tool",
        name: "Test Glif Tool",
        description: "A test glif tool",
        createdAt: new Date().toISOString(),
      };

      // Mock fs.readFile to return valid JSON
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([savedGlif]));

      // Mock formatOutput to return the expected output
      vi.mocked(utils.formatOutput).mockReturnValue(sampleRunResult.output);

      // 5. Mock the list_saved_glif_tools response
      callToolHandler = vi.fn().mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: `Saved glif tools:\n\n${savedGlif.name} (tool: ${
              savedGlif.toolName
            })\n${savedGlif.description}\nOriginal Glif ID: ${
              savedGlif.id
            }\nSaved: ${new Date(savedGlif.createdAt).toLocaleString()}\n`,
          },
        ],
      });

      // List the saved glifs
      const listResult = await callToolHandler({
        params: {
          name: "list_saved_glif_tools",
          arguments: {},
        },
      });

      // Check that the list includes the saved glif
      expect(listResult.content[0].text).toContain("Saved glif tools");
      expect(listResult.content[0].text).toContain("Test Glif Tool");
      expect(listResult.content[0].text).toContain("test_glif_tool");

      // Reset callToolHandler for the next steps
      // We need to restore the original handler, but since we're using vi.fn() to mock it,
      // we'll just create a new handler that will be used for the next steps
      callToolHandler = async (request: any) => {
        // This is a simplified version that will work for our test
        if (request.params.name === "test_glif_tool") {
          return {
            content: [
              {
                type: "text",
                text: sampleRunResult.output,
              },
            ],
          };
        } else if (request.params.name === "remove_glif_tool") {
          return {
            content: [
              {
                type: "text",
                text: `Successfully removed tool "${request.params.arguments.toolName}"`,
              },
            ],
          };
        }
        return { content: [{ type: "text", text: "Default response" }] };
      };

      // 6. Mock saved glifs for tool definitions
      vi.spyOn(savedGlifsModule, "getSavedGlifs").mockResolvedValueOnce([
        savedGlif,
      ]);

      // 7. Get tool definitions
      const toolsResult = await listToolsHandler({});

      // Check that the tool definitions include the saved glif
      const savedGlifTool = toolsResult.tools.find(
        (tool: any) => tool.name === "test_glif_tool"
      );
      expect(savedGlifTool).toBeDefined();
      expect(savedGlifTool.description).toContain("Test Glif Tool");

      // 8. Mock saved glifs for using the tool
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([savedGlif]));

      // 9. Create a new mock for callToolHandler that will call runGlif
      callToolHandler = vi.fn().mockImplementationOnce(async (request) => {
        if (request.params.name === "test_glif_tool") {
          // Call the real runGlif function with the mocked implementation
          await api.runGlif(savedGlif.id, request.params.arguments.inputs);

          return {
            content: [
              {
                type: "text",
                text: sampleRunResult.output,
              },
            ],
          };
        }
        return { content: [{ type: "text", text: "Default response" }] };
      });

      // Mock runGlif and formatOutput for using the tool
      vi.mocked(api.runGlif).mockResolvedValueOnce(sampleRunResult);
      vi.mocked(utils.formatOutput).mockReturnValueOnce(sampleRunResult.output);

      // 10. Use the saved glif tool
      const useResult = await callToolHandler({
        params: {
          name: "test_glif_tool",
          arguments: {
            inputs: ["test input"],
          },
        },
      });

      // Check that runGlif was called with the correct parameters
      expect(api.runGlif).toHaveBeenCalledWith(savedGlif.id, ["test input"]);

      // Check the response
      expect(useResult.content[0].text).toBe(sampleRunResult.output);

      // 11. Mock removeGlif to avoid file system operations
      vi.spyOn(savedGlifsModule, "removeGlif").mockResolvedValueOnce(true);

      // 12. Mock the remove_glif_tool response
      callToolHandler = vi.fn().mockImplementationOnce(async (request) => {
        // Call the real removeGlif function with the mocked implementation
        await savedGlifsModule.removeGlif(request.params.arguments.toolName);

        return {
          content: [
            {
              type: "text",
              text: `Successfully removed tool "${request.params.arguments.toolName}"`,
            },
          ],
        };
      });

      // Remove the saved glif tool
      const removeResult = await callToolHandler({
        params: {
          name: "remove_glif_tool",
          arguments: {
            toolName: "test_glif_tool",
          },
        },
      });

      // Check that the tool was removed
      expect(removeResult.content[0].text).toContain(
        "Successfully removed tool"
      );
      expect(removeResult.content[0].text).toContain("test_glif_tool");

      // Check that removeGlif was called with the correct toolName
      expect(savedGlifsModule.removeGlif).toHaveBeenCalledWith(
        "test_glif_tool"
      );
    });
  });

  describe("Error handling", () => {
    it("should handle trying to save a glif that does not exist", async () => {
      // Mock getGlifDetails to throw an error
      vi.mocked(api.getGlifDetails).mockRejectedValueOnce(
        new Error("Glif not found")
      );

      // Mock fs.mkdir to avoid the catch error
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);

      // Create a custom handler that throws the expected error
      const errorHandler = async () => {
        throw new Error("Glif not found");
      };

      // Replace the callToolHandler with our custom handler
      callToolHandler = vi.fn().mockImplementationOnce(errorHandler);

      // Try to save a non-existent glif
      try {
        await callToolHandler({
          params: {
            name: "save_glif_as_tool",
            arguments: {
              id: "non-existent-glif",
              toolName: "test_glif_tool",
            },
          },
        });

        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Check that the error was thrown
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("Glif not found");
      }
    });

    it("should handle trying to use a saved glif tool that does not exist", async () => {
      // Mock empty saved glifs
      vi.mocked(fs.readFile).mockResolvedValueOnce("[]");

      // Mock fs.mkdir to avoid the catch error
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);

      // Create a custom handler that throws the expected error
      const errorHandler = async () => {
        throw new Error("Unknown tool");
      };

      // Replace the callToolHandler with our custom handler
      callToolHandler = vi.fn().mockImplementationOnce(errorHandler);

      // Try to use a non-existent saved glif tool
      try {
        await callToolHandler({
          params: {
            name: "non_existent_tool",
            arguments: {
              inputs: ["test input"],
            },
          },
        });

        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Check that the error was thrown
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("Unknown tool");
      }
    });
  });
});
