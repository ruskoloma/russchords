namespace BackendApi.Models.Dtos;

public class PlaylistMemberDto
{
    public int Id { get; set; }
    public int PlaylistId { get; set; }
    public string MemberId { get; set; }
    public bool IsPinned { get; set; }
}