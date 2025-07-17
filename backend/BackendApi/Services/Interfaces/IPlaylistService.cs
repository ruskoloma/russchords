using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface IPlaylistService
{
    Task<List<PlaylistDto>> GetAllAsync(string userId);
    Task<PlaylistDto?> GetByIdAsync(int id, string userId);
    Task<PlaylistDto> CreateAsync(CreatePlaylistDto dto, string userId);
    Task UpdateAsync(int id, PlaylistDto dto, string userId);
    Task DeleteAsync(int id, string userId);
    Task AddSongAsync(int playlistId, int songId, string userId);
    Task RemoveSongAsync(int playlistId, int songId, string userId);
}