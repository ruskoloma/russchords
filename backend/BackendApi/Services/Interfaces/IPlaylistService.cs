using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface IPlaylistService
{
    Task<List<PlaylistDto>> GetAllAsync();
    Task<PlaylistDto?> GetByIdAsync(int id);
    Task<PlaylistDto> CreateAsync(PlaylistDto dto);
    Task UpdateAsync(int id, PlaylistDto dto);
    Task DeleteAsync(int id);
}