using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GetGrounded.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DayCoachNote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "coach_note",
                table: "days",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "coach_note",
                table: "days");
        }
    }
}
