using System;

namespace BackendApi.Data.Entities;

public class PlaylistSongEntity
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public int PlaylistId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public SongEntity Song { get; set; }
    public PlaylistEntity Playlist { get; set; }
}