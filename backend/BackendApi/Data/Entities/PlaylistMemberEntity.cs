using System;

namespace BackendApi.Data.Entities;

public class PlaylistMemberEntity
{
    public int Id { get; set; }
    public int PlaylistId { get; set; }
    public string MemberId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public PlaylistEntity Playlist { get; set; }
    public bool IsPinned { get; set; }
}