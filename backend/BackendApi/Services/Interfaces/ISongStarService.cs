using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface ISongStarService
{
    Task<List<SongStarDto>> GetAllAsync();
    Task<SongStarDto?> GetByIdAsync(int id);
    Task<SongStarDto> CreateAsync(SongStarDto dto);
    Task DeleteAsync(int id);
}