namespace GetGrounded.Api.Identity;

internal static class Bearer
{
    public static string? Read(HttpRequest request)
    {
        var header = request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var token = header["Bearer ".Length..].Trim();
        return string.IsNullOrEmpty(token) ? null : token;
    }
}
