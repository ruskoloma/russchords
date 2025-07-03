using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BackendApi.Data.Entities;

namespace BackendApi.Data.Configurations;

public class PlaylistMemberConfiguration : IEntityTypeConfiguration<PlaylistMemberEntity>
{
    public void Configure(EntityTypeBuilder<PlaylistMemberEntity> builder)
    {
        builder.ToTable("playlist_members");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.MemberId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasOne(x => x.Playlist)
            .WithMany(p => p.Members)
            .HasForeignKey(x => x.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}