using GetGrounded.Application.Identity;
using GetGrounded.Domain.Identity;
using GetGrounded.Infrastructure.Data;
using GetGrounded.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GetGrounded.Infrastructure.Identity;

public sealed class PostgresAuthUserAccessor(IDbContextFactory<GroundedDbContext> dbFactory) : IAuthUserAccessor
{
    public async Task<User> FindOrCreateAsync(string loginId, CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);

        var existing = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.FirebaseUid == loginId, cancellationToken);
        if (existing is not null)
        {
            return MapUser(existing);
        }

        var candidate = new UserRow
        {
            Id = Guid.CreateVersion7(),
            FirebaseUid = loginId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Users.Add(candidate);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return User.Open(candidate.Id, candidate.FirebaseUid);
        }
        catch (DbUpdateException)
        {
            var raced = await db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(user => user.FirebaseUid == loginId, cancellationToken)
                ?? throw new InvalidOperationException("User upsert race lost.");
            return MapUser(raced);
        }
    }

    private static User MapUser(UserRow row) =>
        row.DeletedAt is null
            ? User.Open(row.Id, row.FirebaseUid)
            : User.Tombstone(row.Id, row.FirebaseUid, row.DeletedAt.Value);
}
