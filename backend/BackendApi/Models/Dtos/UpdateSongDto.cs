namespace BackendApi.Models.Dtos;

public class UpdateSongDto
{
    public string? Name { get; set; }
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? RootNote { get; set; }
}