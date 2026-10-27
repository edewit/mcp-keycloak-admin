import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config/config.js";
import { applyDotEnvFile } from "./config/load-dotenv.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  // Local `.env` for `node dist/index.js`; MCP clients usually pass env themselves.
  // Already-set variables (export / mcp.json) always win.
  applyDotEnvFile(process.env);
  const config = loadConfig(process.env);
  const server = createServer(config);
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
