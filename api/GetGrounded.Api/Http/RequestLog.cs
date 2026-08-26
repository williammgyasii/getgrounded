using System.Diagnostics;

namespace GetGrounded.Api.Http;

public static class RequestLog
{
    public static IApplicationBuilder UseRequestLog(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            var log = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("GetGrounded.Http");
            log.LogInformation("hit {Method} {Path}", context.Request.Method, context.Request.Path.Value);
            var clock = Stopwatch.StartNew();
            await next();
            log.LogInformation(
                "{Method} {Path} {Status} {Ms}ms",
                context.Request.Method,
                context.Request.Path.Value,
                context.Response.StatusCode,
                clock.ElapsedMilliseconds);
        });
    }
}
