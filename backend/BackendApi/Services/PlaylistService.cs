using AutoMapper;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class PlaylistService : IPlaylistService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PlaylistService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<PlaylistDto>> GetAllAsync(string userId)
    {
        var playlists = await _context.Playlists
            .Where(p => p.OwnerId == userId)
            .ToListAsync();

        return _mapper.Map<List<PlaylistDto>>(playlists);
    }

    public async Task<PlaylistDto?> GetByIdAsync(int id, string userId)
    {
        var playlist = await _context.Playlists
            .FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId);

        return playlist == null ? null : _mapper.Map<PlaylistDto>(playlist);
    }

    public async Task<PlaylistDto> CreateAsync(CreatePlaylistDto dto, string userId)
    {
        var entity = new PlaylistEntity
        {
            Title = dto.Title,
            Description = dto.Description,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Playlists.Add(entity);
        await _context.SaveChangesAsync();

        return _mapper.Map<PlaylistDto>(entity);
    }

    public async Task UpdateAsync(int id, PlaylistDto dto, string userId)
    {
        var entity = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId);
        if (entity == null) throw new Exception("Not found");

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var entity = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId);
        if (entity == null) throw new Exception("Not found");

        _context.Playlists.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task AddSongAsync(int playlistId, int songId, string userId)
    {
        var playlist = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == playlistId && p.OwnerId == userId);
        if (playlist == null) throw new Exception("Playlist not found or not owned by user");

        var exists = await _context.PlaylistSongs
            .AnyAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
        if (exists) return;

        _context.PlaylistSongs.Add(new PlaylistSongEntity
        {
            PlaylistId = playlistId,
            SongId = songId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task RemoveSongAsync(int playlistId, int songId, string userId)
    {
        var playlist = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == playlistId && p.OwnerId == userId);
        if (playlist == null) throw new Exception("Playlist not found or not owned by user");

        var entry = await _context.PlaylistSongs
            .FirstOrDefaultAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
        if (entry != null)
        {
            _context.PlaylistSongs.Remove(entry);
            await _context.SaveChangesAsync();
        }
    }
}