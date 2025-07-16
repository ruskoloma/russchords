namespace BackendApi.Models.Dtos;

public class CachedSongDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Artist { get; set; }
    public string Content { get; set; }
    public string OriginalUrl { get; set; }
}