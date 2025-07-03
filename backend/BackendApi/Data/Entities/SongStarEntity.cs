using System;

namespace BackendApi.Data.Entities;

public class SongStarEntity
{
    public int Id { get; set; }
    public string StarredBy { get; set; }
    public int SongId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public SongEntity Song { get; set; }
}