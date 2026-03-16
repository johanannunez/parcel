import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleLockoutMessage } from "./automations/lockout-handler.js";
import { handleInfoMessage } from "./automations/info-handler.js";
import type { QuoWebhookEvent, QuoWebhookMessageObject } from "./types.js";

const PORT = Number(process.env["PORT"] ?? 3100);

// ─── Request body parser ──────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

// ─── Route handlers ───────────────────────────────────────────────────────────────

async function handleQuoWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);

  let event: QuoWebhookEvent;
  try {
    event = JSON.parse(raw) as QuoWebhookEvent;
  } catch {
    json(res, 400, { error: "Invalid JSON" });
    return;
  }

  console.log(`[webhook] Received event: ${event.type}`);

  if (event.type === "message.received") {
    const msgEvent = event as QuoWebhookEvent<QuoWebhookMessageObject>;

    const lockoutResult = await handleLockoutMessage(msgEvent);
    console.log(`[webhook] Lockout handler: handled=${lockoutResult.handled} reason="${lockoutResult.reason}"`);

    if (!lockoutResult.handled) {
      const infoResult = await handleInfoMessage(msgEvent);
      console.log(`[webhook] Info handler: handled=${infoResult.handled} reason="${infoResult.reason}"`);
    }
  }

  // Always respond 200 quickly so Quo doesn't retry
  json(res, 200, { ok: true });
}

// ─── Server ───────────────────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const { method, url } = req;

  if (method === "GET" && url === "/health") {
    json(res, 200, { status: "ok" });
    return;
  }

  if (method === "POST" && url === "/webhooks/quo") {
    try {
      await handleQuoWebhook(req, res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[webhook] Unhandled error:", message);
      json(res, 500, { error: "Internal server error" });
    }
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`\nQuo webhook server running on http://localhost:${PORT}`);
  console.log(`  POST http://localhost:${PORT}/webhooks/quo  ← Quo sends events here`);
  console.log(`  GET  http://localhost:${PORT}/health        ← health check\n`);
  console.log("Waiting for webhook events...");
});
