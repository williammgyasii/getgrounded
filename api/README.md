# GetGrounded API

```text
GetGrounded.Domain   rules and entities — no HTTP, no EF, no AI SDKs
GetGrounded.Api      HTTP + adapters
GetGrounded.Tests    failing tests first
```

```bash
dotnet build GetGrounded.Api/GetGrounded.Api.csproj
dotnet test GetGrounded.slnx
dotnet run --project GetGrounded.Api
```

Docker image (used later on Render):

```bash
docker build -t getgrounded-api .
```
