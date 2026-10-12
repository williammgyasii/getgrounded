import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

const PORT = 8080;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const CONTAINER_NAME = "api-prod";

function containerEnv(env: Env): Record<string, string> {
  const entries: Record<string, string> = {
    ASPNETCORE_URLS: "http://+:8080",
    ASPNETCORE_ENVIRONMENT: "Production",
    DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE: "false",
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
    DATABASE_URL: env.DATABASE_URL,
  };

  if (env.ELEVENLABS_API_KEY) entries.ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
  if (env.ELEVENLABS_VOICE_ID) entries.ELEVENLABS_VOICE_ID = env.ELEVENLABS_VOICE_ID;
  if (env.OPENAI_API_KEY) entries.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.OPENAI_MODEL) entries.OPENAI_MODEL = env.OPENAI_MODEL;
  if (env.R2_ACCOUNT_ID) entries.R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
  if (env.R2_BUCKET) entries.R2_BUCKET = env.R2_BUCKET;
  if (env.R2_ACCESS_KEY_ID) entries.R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
  if (env.R2_SECRET_ACCESS_KEY) entries.R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;

  return entries;
}

export class GetGroundedApiContainer extends DurableObject<Env> {
  private starting: Promise<void> | undefined;
  private monitoring: Promise<void> | undefined;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const container = ctx.container;
    if (container?.running) {
      void ctx.blockConcurrencyWhile(() =>
        container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS),
      );
      this.observeExit();
    }
  }

  async fetch(request: Request): Promise<Response> {
    this.starting ??= this.startAndWaitForPort().finally(() => {
      this.starting = undefined;
    });
    await this.starting;

    const url = new URL(request.url);
    url.protocol = "http:";
    url.host = "container";
    const forwarded = new Request(url, request);
    forwarded.headers.delete("host");
    return this.ctx.container!.getTcpPort(PORT).fetch(forwarded);
  }

  private async startAndWaitForPort(): Promise<void> {
    const container = this.ctx.container!;
    if (!container.running) {
      container.start({
        image: container.images.base,
        instance: "standard-1",
        enableInternet: true,
        env: containerEnv(this.env),
      });
    }
    this.observeExit();
    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);

    const port = container.getTcpPort(PORT);
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        const response = await port.fetch("http://container/health", {
          signal: AbortSignal.timeout(2000),
        });
        await response.body?.cancel();
        if (response.ok) return;
      } catch {
        // Port not ready yet.
      }
      await scheduler.wait(200);
    }
    throw new Error("API container did not become ready on port 8080");
  }

  private observeExit(): void {
    if (this.monitoring) return;
    this.monitoring = this.ctx
      .container!.monitor()
      .then(() => console.log("API container exited"))
      .catch((error: unknown) => console.error("API container failed:", error))
      .finally(() => {
        this.monitoring = undefined;
      });
    this.ctx.waitUntil(this.monitoring);
  }
}

const app = new Hono<{ Bindings: Env }>();

app.all("*", (c) =>
  c.env.GETGROUNDED_API.getByName(CONTAINER_NAME).fetch(c.req.raw),
);

app.onError((error, c) => {
  console.error("API gateway error:", error);
  return c.text("API unavailable. Retry shortly.", 502);
});

export default app;
