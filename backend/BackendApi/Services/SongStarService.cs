using AutoMapper;
using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class SongStarService : ISongStarService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SongStarService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<SongStarDto>> GetAllAsync()
    {
        var entities = await _context.SongStars.ToListAsync();
        return _mapper.Map<List<SongStarDto>>(entities);
    }

    public async Task<SongStarDto?> GetByIdAsync(int id)
    {
        var entity = await _context.SongStars.FindAsync(id);
        return entity == null ? null : _mapper.Map<SongStarDto>(entity);
    }

    public async Task<SongStarDto> CreateAsync(SongStarDto dto)
    {
        var entity = _mapper.Map<SongStarEntity>(dto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        _context.SongStars.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<SongStarDto>(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.SongStars.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _context.SongStars.Remove(entity);
        await _context.SaveChangesAsync();
    }
}