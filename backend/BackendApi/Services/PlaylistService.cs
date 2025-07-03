using AutoMapper;
using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class PlaylistService : IPlaylistService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PlaylistService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<PlaylistDto>> GetAllAsync()
    {
        var entities = await _context.Playlists.ToListAsync();
        return _mapper.Map<List<PlaylistDto>>(entities);
    }

    public async Task<PlaylistDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Playlists.FindAsync(id);
        return entity == null ? null : _mapper.Map<PlaylistDto>(entity);
    }

    public async Task<PlaylistDto> CreateAsync(PlaylistDto dto)
    {
        var entity = _mapper.Map<PlaylistEntity>(dto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        _context.Playlists.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<PlaylistDto>(entity);
    }

    public async Task UpdateAsync(int id, PlaylistDto dto)
    {
        var entity = await _context.Playlists.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.Playlists.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _context.Playlists.Remove(entity);
        await _context.SaveChangesAsync();
    }
}