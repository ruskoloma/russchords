namespace BackendApi.Models.Dtos;

public class MyPlaylistDto
{
    public int PlaylistId { get; set; }
    public string OwnerId { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsPinned { get; set; }
    public List<LiteSongDto> Songs { get; set; } = new();
}