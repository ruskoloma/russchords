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

        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Content).IsRequired();
        builder.Property(x => x.AuthorId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.Artist).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.SourceUrl).HasMaxLength(500);
        builder.Property(x => x.RootNote).HasMaxLength(20);

        // Free-form user-assigned tags. Stored as a Postgres text[] array so
        // filter queries can use the `@>` / `&&` containment operators
        // efficiently once we start hitting the column from SQL directly.
        builder.Property(x => x.Tags)
            .HasColumnType("text[]")
            .IsRequired()
            .HasDefaultValueSql("'{}'::text[]");
    }
}