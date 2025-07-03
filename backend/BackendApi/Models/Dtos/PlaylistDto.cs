namespace BackendApi.Models.Dtos;

public class PlaylistDto
{
    public int Id { get; set; }
    public string OwnerId { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
}