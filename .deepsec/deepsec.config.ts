import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "businessmap-mcp", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
