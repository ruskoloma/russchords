using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface IStarredService
{
    Task<List<SongDto>> GetAllStarredByUserAsync(string userId);
    Task StarAsync(int songId, string userId);
    Task UnstarAsync(int songId, string userId);
}