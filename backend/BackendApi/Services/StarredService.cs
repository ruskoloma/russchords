using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;
using AutoMapper;

namespace BackendApi.Services;

public class StarredService : IStarredService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public StarredService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<SongDto>> GetAllStarredByUserAsync(string userId)
    {
        var starred = await _context.SongStars
            .Where(x => x.StarredBy == userId)
            .Include(x => x.Song)
            .Select(x => x.Song)
            .ToListAsync();

        return _mapper.Map<List<SongDto>>(starred);
    }

    public async Task StarAsync(int songId, string userId)
    {
        var already = await _context.SongStars
            .AnyAsync(x => x.SongId == songId && x.StarredBy == userId);

        if (already) return;

        var songExists = await _context.Songs.AnyAsync(s => s.Id == songId);
        if (!songExists) throw new Exception("Song not found");

        _context.SongStars.Add(new Data.Entities.SongStarEntity
        {
            SongId = songId,
            StarredBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task UnstarAsync(int songId, string userId)
    {
        var songExists = await _context.Songs.AnyAsync(s => s.Id == songId);
        if (!songExists) throw new Exception("Song not found");

        var entity = await _context.SongStars
            .FirstOrDefaultAsync(x => x.SongId == songId && x.StarredBy == userId);

        if (entity != null)
        {
            _context.SongStars.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}