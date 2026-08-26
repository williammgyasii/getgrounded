using Google.Apis.Auth.OAuth2;

namespace GetGrounded.Infrastructure.Voice;

internal static class GoogleAccess
{
    public static async Task<string> BearerAsync(CancellationToken cancellationToken)
    {
        var credential = await GoogleCredential.GetApplicationDefaultAsync();
        var scoped = credential.CreateScoped("https://www.googleapis.com/auth/cloud-platform");
        return await scoped.UnderlyingCredential.GetAccessTokenForRequestAsync(
            cancellationToken: cancellationToken);
    }
}
