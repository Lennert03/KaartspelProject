using Microsoft.EntityFrameworkCore;
using ScoreBridge.Api.Models;

namespace ScoreBridge.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Player> Players => Set<Player>();
        public DbSet<Game> Games => Set<Game>();
        public DbSet<GamePlayer> GamePlayers => Set<GamePlayer>();
        public DbSet<Round> Rounds => Set<Round>();
        public DbSet<RoundScore> RoundScores => Set<RoundScore>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Player
            modelBuilder.Entity<Player>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            });

            // Configure Game
            modelBuilder.Entity<Game>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            });

            // Configure GamePlayer
            modelBuilder.Entity<GamePlayer>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(d => d.Game)
                    .WithMany(p => p.GamePlayers)
                    .HasForeignKey(d => d.GameId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Player)
                    .WithMany(p => p.GamePlayers)
                    .HasForeignKey(d => d.PlayerId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascading delete of players when gameplayer is deleted, or keep it restrict to avoid multiple cascade paths.
            });

            // Configure Round
            modelBuilder.Entity<Round>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(d => d.Game)
                    .WithMany(p => p.Rounds)
                    .HasForeignKey(d => d.GameId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure RoundScore
            modelBuilder.Entity<RoundScore>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(d => d.Round)
                    .WithMany(p => p.RoundScores)
                    .HasForeignKey(d => d.RoundId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.GamePlayer)
                    .WithMany(p => p.RoundScores)
                    .HasForeignKey(d => d.GamePlayerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
