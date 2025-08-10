namespace BackendApi.Models.Dtos;

public class PlaylistSongDto
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public int PlaylistId { get; set; }
    public int? Order { get; set; }
}