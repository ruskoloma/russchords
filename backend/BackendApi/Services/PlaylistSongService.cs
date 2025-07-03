using AutoMapper;
using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class PlaylistSongService : IPlaylistSongService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PlaylistSongService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<PlaylistSongDto>> GetAllAsync()
    {
        var entities = await _context.PlaylistSongs.ToListAsync();
        return _mapper.Map<List<PlaylistSongDto>>(entities);
    }

    public async Task<PlaylistSongDto?> GetByIdAsync(int id)
    {
        var entity = await _context.PlaylistSongs.FindAsync(id);
        return entity == null ? null : _mapper.Map<PlaylistSongDto>(entity);
    }

    public async Task<PlaylistSongDto> CreateAsync(PlaylistSongDto dto)
    {
        var entity = _mapper.Map<PlaylistSongEntity>(dto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        _context.PlaylistSongs.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<PlaylistSongDto>(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.PlaylistSongs.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _context.PlaylistSongs.Remove(entity);
        await _context.SaveChangesAsync();
    }
}