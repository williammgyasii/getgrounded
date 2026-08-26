# Cloudflare

CLI: `wrangler`

```text
workers/     reminder + orchestration workers
r2/          private audio bucket notes
workflows/   morning / evening accountability sequences
queues/      retries and background jobs
```

Workers stay thin. They wait, queue, and call the .NET API. They do not decide streaks, permissions, or whether a reflection is complete.

Docs: https://developers.cloudflare.com/workers/wrangler/
