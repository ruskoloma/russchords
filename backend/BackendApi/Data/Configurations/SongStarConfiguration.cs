using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BackendApi.Data.Entities;

namespace BackendApi.Data.Configurations;

public class SongStarConfiguration : IEntityTypeConfiguration<SongStarEntity>
{
    public void Configure(EntityTypeBuilder<SongStarEntity> builder)
    {
        builder.ToTable("song_stars");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StarredBy).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasOne(x => x.Song)
            .WithMany(s => s.Stars)
            .HasForeignKey(x => x.SongId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}