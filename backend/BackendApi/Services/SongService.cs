using AutoMapper;
using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class SongService : ISongService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SongService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<SongDto>> GetAllAsync()
    {
        var entities = await _context.Songs.ToListAsync();
        return _mapper.Map<List<SongDto>>(entities);
    }

    public async Task<SongDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Songs.FindAsync(id);
        return entity == null ? null : _mapper.Map<SongDto>(entity);
    }

    public async Task<SongDto> CreateAsync(SongDto dto)
    {
        var entity = _mapper.Map<SongEntity>(dto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        _context.Songs.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<SongDto>(entity);
    }

    public async Task UpdateAsync(int id, SongDto dto)
    {
        var entity = await _context.Songs.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.Songs.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _context.Songs.Remove(entity);
        await _context.SaveChangesAsync();
    }
}