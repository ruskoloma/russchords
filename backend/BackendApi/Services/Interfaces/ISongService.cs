using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface ISongService
{
    Task<List<SongDto>> GetAllAsync();
    Task<SongDto?> GetByIdAsync(int id);
    Task<SongDto> CreateAsync(SongDto dto);
    Task UpdateAsync(int id, SongDto dto, string userId);
    Task DeleteAsync(int id, string userId);
    Task<SongDto> ForkCachedSongAsync(int cachedSongId, string userId);
    Task<SongDto> ForkSongAsync(int songId, string userId);
    Task<List<SongDto>> GetAllByUserAsync(string userId);
}