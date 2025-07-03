using BackendApi.Models.Dtos;

namespace BackendApi.Services.Interfaces;

public interface IPlaylistMemberService
{
    Task<List<PlaylistMemberDto>> GetAllAsync();
    Task<PlaylistMemberDto?> GetByIdAsync(int id);
    Task<PlaylistMemberDto> CreateAsync(PlaylistMemberDto dto);
    Task DeleteAsync(int id);
}