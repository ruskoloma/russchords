using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface IPlaylistSongService
{
    Task<List<PlaylistSongDto>> GetAllAsync();
    Task<PlaylistSongDto?> GetByIdAsync(int id);
    Task<PlaylistSongDto> CreateAsync(PlaylistSongDto dto);
    Task DeleteAsync(int id);
}