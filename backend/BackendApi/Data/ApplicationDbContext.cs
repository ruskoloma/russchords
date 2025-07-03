using Microsoft.EntityFrameworkCore;
using BackendApi.Data.Entities;
using BackendApi.Data.Configurations;

namespace BackendApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<SongEntity> Songs { get; set; }
    public DbSet<SongStarEntity> SongStars { get; set; }
    public DbSet<PlaylistEntity> Playlists { get; set; }
    public DbSet<PlaylistSongEntity> PlaylistSongs { get; set; }
    public DbSet<PlaylistMemberEntity> PlaylistMembers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new SongConfiguration());
        modelBuilder.ApplyConfiguration(new SongStarConfiguration());
        modelBuilder.ApplyConfiguration(new PlaylistConfiguration());
        modelBuilder.ApplyConfiguration(new PlaylistSongConfiguration());
        modelBuilder.ApplyConfiguration(new PlaylistMemberConfiguration());
    }
}