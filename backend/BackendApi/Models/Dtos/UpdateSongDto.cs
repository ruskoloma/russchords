namespace BackendApi.Models.Dtos;

public class UpdateSongDto
{
    public string? Name { get; set; }
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? RootNote { get; set; }
    /// <summary>
    /// Full replacement list of tags. Null means "no change"; an empty list
    /// means "remove all tags". Anything else is the new canonical set.
    /// </summary>
    public List<string>? Tags { get; set; }
}