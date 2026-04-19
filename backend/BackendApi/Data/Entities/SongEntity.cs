namespace BackendApi.Data.Entities;

public class SongEntity
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Content { get; set; }
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }
    public int? OriginalId { get; set; }
    public string? SourceUrl { get; set; }
    public string AuthorId { get; set; }
    public string? RootNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Free-form user-assigned tags for filtering and grouping. Stored as a
    /// Postgres text[] column for efficient containment queries. Defaults to
    /// an empty list so legacy rows don't require a NULL fallback.
    /// </summary>
    public List<string> Tags { get; set; } = new();

    public ICollection<SongStarEntity>? Stars { get; set; }
    public ICollection<PlaylistSongEntity>? PlaylistSongs { get; set; }
}