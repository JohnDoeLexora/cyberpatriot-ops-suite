import { createServer } from "./server.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const app = createServer();

app.listen(port, host, () => {
  console.log(`cp-ops-api listening on http://${host}:${port}`);
  console.log("GET /health  GET /ops  POST /ops/:id/run  (default mode=demo)");
});
