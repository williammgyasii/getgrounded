using GetGrounded.Application;
using GetGrounded.Infrastructure;
using GetGrounded.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

GetGrounded.Api.LocalEnv.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment()
    && !string.IsNullOrWhiteSpace(builder.Configuration["DATABASE_URL"]))
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<GroundedDbContext>>();
    await using var db = await dbFactory.CreateDbContextAsync();
    await db.Database.MigrateAsync();
}

app.MapControllers();

app.Run();
