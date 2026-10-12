using GetGrounded.Application.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace GetGrounded.Infrastructure.Identity;

public sealed class FirebaseAuthTokenAccessor : IAuthTokenAccessor
{
    private readonly string _projectId;
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configuration;

    public FirebaseAuthTokenAccessor(IConfiguration configuration)
    {
        _projectId = configuration["FIREBASE_PROJECT_ID"]
            ?? throw new InvalidOperationException("FIREBASE_PROJECT_ID is not configured.");
        _configuration = new ConfigurationManager<OpenIdConnectConfiguration>(
            $"https://securetoken.google.com/{_projectId}/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever());
    }

    public async Task<string?> VerifyLoginIdAsync(string token, CancellationToken cancellationToken = default)
    {
        if (token.Count(c => c == '.') != 2)
        {
            return null;
        }

        try
        {
            var oidc = await _configuration.GetConfigurationAsync(cancellationToken);
            var claims = new JwtSecurityTokenHandler().ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidIssuer = $"https://securetoken.google.com/{_projectId}",
                    ValidAudience = _projectId,
                    IssuerSigningKeys = oidc.SigningKeys,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                },
                out _);

            return claims.FindFirst("user_id")?.Value ?? claims.FindFirst("sub")?.Value;
        }
        catch (Exception)
        {
            return null;
        }
    }
}
