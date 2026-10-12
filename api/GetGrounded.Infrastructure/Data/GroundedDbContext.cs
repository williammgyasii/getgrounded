using GetGrounded.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GetGrounded.Infrastructure.Data;

public sealed class GroundedDbContext(DbContextOptions<GroundedDbContext> options) : DbContext(options)
{
    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<DayRow> Days => Set<DayRow>();
    public DbSet<CommitmentRow> Commitments => Set<CommitmentRow>();
    public DbSet<VoiceSessionRow> VoiceSessions => Set<VoiceSessionRow>();
    public DbSet<WinRow> Wins => Set<WinRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserRow>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(row => row.Id);
            entity.Property(row => row.FirebaseUid).HasColumnName("firebase_uid").IsRequired();
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.Property(row => row.DeletedAt).HasColumnName("deleted_at");
            entity.HasIndex(row => row.FirebaseUid)
                .IsUnique()
                .HasFilter("deleted_at IS NULL")
                .HasDatabaseName("users_firebase_uid_living_uidx");
        });

        modelBuilder.Entity<DayRow>(entity =>
        {
            entity.ToTable("days");
            entity.HasKey(row => row.Id);
            entity.Property(row => row.UserId).HasColumnName("user_id");
            entity.Property(row => row.LocalDate).HasColumnName("local_date");
            entity.Property(row => row.Timezone).HasColumnName("timezone");
            entity.Property(row => row.ShowedUp).HasColumnName("showed_up");
            entity.Property(row => row.Title).HasColumnName("title");
            entity.Property(row => row.CoachNote).HasColumnName("coach_note");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.Property(row => row.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(row => new { row.UserId, row.LocalDate }).IsUnique();
            entity.HasOne(row => row.User)
                .WithMany(user => user.Days)
                .HasForeignKey(row => row.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CommitmentRow>(entity =>
        {
            entity.ToTable("commitments");
            entity.HasKey(row => row.Id);
            entity.Property(row => row.UserId).HasColumnName("user_id");
            entity.Property(row => row.DayId).HasColumnName("day_id");
            entity.Property(row => row.PlannedAt).HasColumnName("planned_at");
            entity.Property(row => row.PlannedDurationMinutes).HasColumnName("planned_duration_minutes");
            entity.Property(row => row.ActualDurationMinutes).HasColumnName("actual_duration_minutes");
            entity.Property(row => row.LifeArea).HasColumnName("life_area");
            entity.Property(row => row.SortOrder).HasColumnName("sort_order");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.Property(row => row.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(row => row.Day)
                .WithMany(day => day.Commitments)
                .HasForeignKey(row => row.DayId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VoiceSessionRow>(entity =>
        {
            entity.ToTable("voice_sessions");
            entity.HasKey(row => row.Id);
            entity.Property(row => row.UserId).HasColumnName("user_id");
            entity.Property(row => row.DayId).HasColumnName("day_id");
            entity.Property(row => row.ProcessingStatus).HasColumnName("processing_status");
            entity.Property(row => row.ConversationId).HasColumnName("conversation_id");
            entity.Property(row => row.StorageKey).HasColumnName("storage_key");
            entity.Property(row => row.WordsJson).HasColumnName("words").HasColumnType("jsonb");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.HasOne(row => row.Day)
                .WithMany(day => day.VoiceSessions)
                .HasForeignKey(row => row.DayId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WinRow>(entity =>
        {
            entity.ToTable("wins");
            entity.HasKey(row => row.Id);
            entity.Property(row => row.UserId).HasColumnName("user_id");
            entity.Property(row => row.DayId).HasColumnName("day_id");
            entity.Property(row => row.LifeArea).HasColumnName("life_area");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.HasOne(row => row.Day)
                .WithMany(day => day.Wins)
                .HasForeignKey(row => row.DayId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
