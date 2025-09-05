namespace BackendApi.Models.Dtos;

public class CreateSongDto
{
    public string Name { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? RootNote { get; set; }
}