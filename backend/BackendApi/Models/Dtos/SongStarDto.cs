namespace BackendApi.Models.Dtos;

public class SongStarDto
{
    public int Id { get; set; }
    public string StarredBy { get; set; }
    public int SongId { get; set; }
}