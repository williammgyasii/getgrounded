using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GetGrounded.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialBook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    firebase_uid = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "days",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    local_date = table.Column<DateOnly>(type: "date", nullable: false),
                    timezone = table.Column<string>(type: "text", nullable: false),
                    showed_up = table.Column<bool>(type: "boolean", nullable: false),
                    title = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_days", x => x.Id);
                    table.ForeignKey(
                        name: "FK_days_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "commitments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    planned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    planned_duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    actual_duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    life_area = table.Column<string>(type: "text", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Confidence = table.Column<float>(type: "real", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commitments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_commitments_days_day_id",
                        column: x => x.day_id,
                        principalTable: "days",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "voice_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Transcript = table.Column<string>(type: "text", nullable: false),
                    processing_status = table.Column<string>(type: "text", nullable: false),
                    conversation_id = table.Column<string>(type: "text", nullable: true),
                    storage_key = table.Column<string>(type: "text", nullable: true),
                    words = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_voice_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_voice_sessions_days_day_id",
                        column: x => x.day_id,
                        principalTable: "days",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "wins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    life_area = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_wins_days_day_id",
                        column: x => x.day_id,
                        principalTable: "days",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_commitments_day_id",
                table: "commitments",
                column: "day_id");

            migrationBuilder.CreateIndex(
                name: "IX_days_user_id_local_date",
                table: "days",
                columns: new[] { "user_id", "local_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "users_firebase_uid_living_uidx",
                table: "users",
                column: "firebase_uid",
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_voice_sessions_day_id",
                table: "voice_sessions",
                column: "day_id");

            migrationBuilder.CreateIndex(
                name: "IX_wins_day_id",
                table: "wins",
                column: "day_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "commitments");

            migrationBuilder.DropTable(
                name: "voice_sessions");

            migrationBuilder.DropTable(
                name: "wins");

            migrationBuilder.DropTable(
                name: "days");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
