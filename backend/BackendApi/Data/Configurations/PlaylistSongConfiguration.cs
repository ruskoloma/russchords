using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BackendApi.Data.Entities;

namespace BackendApi.Data.Configurations;

public class PlaylistSongConfiguration : IEntityTypeConfiguration<PlaylistSongEntity>
{
    public void Configure(EntityTypeBuilder<PlaylistSongEntity> builder)
    {
        builder.ToTable("playlist_songs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasOne(x => x.Song)
            .WithMany(s => s.PlaylistSongs)
            .HasForeignKey(x => x.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Playlist)
            .WithMany(p => p.Songs)
            .HasForeignKey(x => x.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}