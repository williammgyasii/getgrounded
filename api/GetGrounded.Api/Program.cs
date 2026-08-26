using GetGrounded.Api;
using GetGrounded.Api.Http;
using GetGrounded.Application;
using GetGrounded.Infrastructure;

LocalEnv.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

var app = builder.Build();

app.UseRequestLog();
app.MapControllers();

app.Run();
