using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface ISongService
{
    Task<List<SongDto>> GetAllAsync();
    Task<SongDto?> GetByIdAsync(int id);
    Task<SongDto> CreateAsync(SongDto dto);
    Task UpdateAsync(int id, SongDto dto);
    Task DeleteAsync(int id);
}