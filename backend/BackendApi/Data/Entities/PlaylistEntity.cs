using System;

namespace BackendApi.Data.Entities;

public class PlaylistEntity
{
    public int Id { get; set; }
    public string OwnerId { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<PlaylistSongEntity>? Songs { get; set; }
    public ICollection<PlaylistMemberEntity>? Members { get; set; }
}