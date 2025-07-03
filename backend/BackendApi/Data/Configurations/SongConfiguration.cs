using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BackendApi.Data.Entities;

namespace BackendApi.Data.Configurations;

public class SongConfiguration : IEntityTypeConfiguration<SongEntity>
{
    public void Configure(EntityTypeBuilder<SongEntity> builder)
    {
        builder.ToTable("songs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Content).IsRequired();
        builder.Property(x => x.AuthorId).IsRequired();
        builder.Property(x => x.RootNote).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
    }
}