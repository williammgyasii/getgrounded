# GetGrounded API

```text
GetGrounded.Api             Controllers + Program (HTTP only)
GetGrounded.Application     services (AuthService, HealthService)
GetGrounded.Infrastructure  Firebase + Postgres
GetGrounded.Domain          rules — no HTTP, no SQL
GetGrounded.Tests           failing tests first
```

```bash
dotnet build GetGrounded.Api/GetGrounded.Api.csproj
dotnet test GetGrounded.slnx
dotnet run --project GetGrounded.Api
```

Docker image (Cloud Run):

```bash
docker build -t getgrounded-api .
```
