namespace BackendApi.Models.Dtos;

public class SongDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Content { get; set; }
    public int? ParentId { get; set; }
    public int? OriginalId { get; set; }
    public string? SourceUrl { get; set; }
    public string AuthorId { get; set; }
    public string RootNote { get; set; }
}