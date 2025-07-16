namespace BackendApi.Data.Entities;

public class SongEntity
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Content { get; set; }
    public string? Artist { get; set; }
    public int? ParentId { get; set; }
    public int? OriginalId { get; set; }
    public string? SourceUrl { get; set; }
    public string AuthorId { get; set; }
    public string? RootNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SongStarEntity>? Stars { get; set; }
    public ICollection<PlaylistSongEntity>? PlaylistSongs { get; set; }
}