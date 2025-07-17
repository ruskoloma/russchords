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
    private readonly ICachedSongService _cachedSongService;

    public SongService(ApplicationDbContext context, IMapper mapper, ICachedSongService cachedSongService)
    {
        _context = context;
        _mapper = mapper;
        _cachedSongService = cachedSongService;
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

    public async Task UpdateAsync(int id, SongDto dto, string userId)
    {
        var entity = await _context.Songs.FindAsync(id);
        if (entity == null)
            throw new Exception("Not found");

        if (entity.AuthorId != userId)
            throw new Exception("You are not the owner of this song");

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var entity = await _context.Songs.FindAsync(id);
        if (entity == null)
            throw new Exception("Not found");

        if (entity.AuthorId != userId)
            throw new Exception("You are not the owner of this song");

        _context.Songs.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<SongDto> ForkCachedSongAsync(int cachedSongId, string userId)
    {
        var cachedSong = await _cachedSongService.GetByIdAsync(cachedSongId);
        if (cachedSong == null)
            throw new Exception("Cached song not found");

        var newSong = new SongEntity
        {
            Name = cachedSong.Name,
            Content = cachedSong.Content,
            Artist = cachedSong.Artist,
            AuthorId = userId,
            RootNote = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            SourceUrl = cachedSong.OriginalUrl,
            OriginalId = cachedSong.Id,
            ParentId = null
        };

        _context.Songs.Add(newSong);
        await _context.SaveChangesAsync();

        return _mapper.Map<SongDto>(newSong);
    }

    public async Task<SongDto> ForkSongAsync(int songId, string userId)
    {
        var existingSong = await _context.Songs.FindAsync(songId);
        if (existingSong == null)
            throw new Exception("Original song not found");

        var newSong = new SongEntity
        {
            Name = existingSong.Name,
            Content = existingSong.Content,
            Artist = existingSong.Artist,
            AuthorId = userId,
            RootNote = existingSong.RootNote,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            SourceUrl = existingSong.SourceUrl,
            ParentId = existingSong.Id,
            OriginalId = existingSong.OriginalId ?? existingSong.Id
        };

        _context.Songs.Add(newSong);
        await _context.SaveChangesAsync();

        return _mapper.Map<SongDto>(newSong);
    }

    public async Task<List<SongDto>> GetAllByUserAsync(string userId)
    {
        var entities = await _context.Songs
            .Where(x => x.AuthorId == userId)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();

        return _mapper.Map<List<SongDto>>(entities);
    }
}