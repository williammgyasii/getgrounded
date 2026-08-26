using GetGrounded.Application;
using GetGrounded.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

var app = builder.Build();

app.MapControllers();

app.Run();
