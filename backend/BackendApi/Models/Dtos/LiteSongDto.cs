namespace BackendApi.Models.Dtos;

public class LiteSongDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Artist { get; set; }
    public string? SourceUrl { get; set; }
    public string? RootNote { get; set; }
    public int? Order { get; set; }
}