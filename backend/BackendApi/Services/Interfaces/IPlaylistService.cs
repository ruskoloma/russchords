using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces
{
    public interface IPlaylistService
    {
        Task<List<PlaylistDto>> GetAllAsync(string userId);
        Task<PlaylistDto?> GetByIdAsync(int id, string? userId);
        Task<MyPlaylistDto?> GetPlaylistFullAsync(int id, string? userId);
        Task<PlaylistDto> CreateAsync(CreatePlaylistDto dto, string userId);
        Task UpdateAsync(int id, UpdatePlaylistDto dto, string userId);
        Task DeleteAsync(int id, string userId);
        Task AddSongAsync(int playlistId, int songId, string userId);
        Task RemoveSongAsync(int playlistId, int songId, string userId);
        Task ReorderSongsAsync(int playlistId, string userId, IReadOnlyList<int> songIds);
        Task<List<MyPlaylistDto>> GetMyPlaylistsWithDetailsAsync(string userId);
    }
}