using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface ICachedSongService
{
    Task<CachedSongDto?> GetByIdAsync(int id);
}