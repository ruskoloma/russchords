using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BackendApi.Data.Entities;

namespace BackendApi.Data.Configurations;

public class PlaylistConfiguration : IEntityTypeConfiguration<PlaylistEntity>
{
    public void Configure(EntityTypeBuilder<PlaylistEntity> builder)
    {
        builder.ToTable("playlists");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
    }
}