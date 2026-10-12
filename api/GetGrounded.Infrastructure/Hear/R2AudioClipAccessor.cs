using System.Net;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using GetGrounded.Application.Hear;
using Microsoft.Extensions.Configuration;

namespace GetGrounded.Infrastructure.Hear;

public sealed class R2AudioClipAccessor : IAudioClipAccessor, IDisposable
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public R2AudioClipAccessor(IConfiguration configuration)
    {
        var accountId = Require(configuration, "R2_ACCOUNT_ID");
        var accessKey = Require(configuration, "R2_ACCESS_KEY_ID");
        var secretKey = Require(configuration, "R2_SECRET_ACCESS_KEY");
        _bucket = Require(configuration, "R2_BUCKET");

        _s3 = new AmazonS3Client(
            new BasicAWSCredentials(accessKey, secretKey),
            new AmazonS3Config
            {
                ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
            });
    }

    public static bool IsConfigured(IConfiguration configuration) =>
        Has(configuration, "R2_ACCOUNT_ID")
        && Has(configuration, "R2_BUCKET")
        && Has(configuration, "R2_ACCESS_KEY_ID")
        && Has(configuration, "R2_SECRET_ACCESS_KEY");

    public async Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken)
    {
        var key = $"{userId:N}/{kind}/{Guid.NewGuid():N}.m4a";
        using var stream = new MemoryStream(clip.Bytes);
        await _s3.PutObjectAsync(
            new PutObjectRequest
            {
                BucketName = _bucket,
                Key = key,
                InputStream = stream,
                ContentType = clip.ContentType,
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true
            },
            cancellationToken);
        return key;
    }

    public async Task<StoredClip?> GetAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _s3.GetObjectAsync(_bucket, key, cancellationToken);
            using var buffer = new MemoryStream();
            await response.ResponseStream.CopyToAsync(buffer, cancellationToken);
            return new StoredClip(buffer.ToArray(), response.Headers.ContentType);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound || ex.ErrorCode == "NoSuchKey")
        {
            return null;
        }
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken) =>
        _s3.DeleteObjectAsync(_bucket, key, cancellationToken);

    public void Dispose() => _s3.Dispose();

    private static bool Has(IConfiguration configuration, string name) =>
        !string.IsNullOrWhiteSpace(configuration[name]);

    private static string Require(IConfiguration configuration, string name)
    {
        var value = configuration[name];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} is required.");
        }

        return value;
    }
}
