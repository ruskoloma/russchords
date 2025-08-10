using AutoMapper;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

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

    public async Task<List<PlaylistDto>> GetAllAsync(string userId)
    {
        var playlists = await _context.PlaylistMembers
            .Where(pm => pm.MemberId == userId)
            .Join(
                _context.Playlists,
                pm => pm.PlaylistId,
                p => p.Id,
                (pm, p) => p
            )
            .Distinct()
            .ToListAsync();

        return _mapper.Map<List<PlaylistDto>>(playlists);
    }

    public async Task<PlaylistDto?> GetByIdAsync(int id, string? userId)
    {
        var playlist = await _context.Playlists
            .FirstOrDefaultAsync(p => p.Id == id);

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

        var ownerMember = new PlaylistMemberEntity
        {
            PlaylistId = entity.Id,
            MemberId = userId,
            IsPinned = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.PlaylistMembers.Add(ownerMember);
        await _context.SaveChangesAsync();

        return _mapper.Map<PlaylistDto>(entity);
    }

    public async Task UpdateAsync(int id, UpdatePlaylistDto dto, string userId)
    {
        var entity = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId);
        if (entity == null) throw new Exception("Not found or not owned");

        if (dto.Title != null) entity.Title = dto.Title;
        if (dto.Description != null) entity.Description = dto.Description;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var entity = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == userId);
        if (entity == null) throw new Exception("Not found or not owned");

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

    public async Task<List<MyPlaylistDto>> GetMyPlaylistsWithDetailsAsync(string userId)
    {
        var query =
            from m in _context.PlaylistMembers
            where m.MemberId == userId
            join p in _context.Playlists on m.PlaylistId equals p.Id
            select new MyPlaylistDto
            {
                PlaylistId = p.Id,
                OwnerId = p.OwnerId,
                Title = p.Title,
                Description = p.Description,
                IsPinned = m.IsPinned,
                Songs = (
                    from ps in _context.PlaylistSongs
                    where ps.PlaylistId == p.Id
                    join s in _context.Songs on ps.SongId equals s.Id
                    orderby (ps.Order == null), ps.Order, s.Name
                    select new LiteSongDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Artist = s.Artist,
                        SourceUrl = s.SourceUrl,
                        RootNote = s.RootNote,
                        Order = ps.Order
                    }
                ).ToList()
            };

        var result = await query
            .OrderByDescending(x => x.IsPinned)
            .ThenBy(x => x.Title)
            .ToListAsync();

        return result;
    }

    public async Task ReorderSongsAsync(int playlistId, string userId, IReadOnlyList<int> songIds)
    {
        var playlist = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == playlistId && p.OwnerId == userId);
        if (playlist == null) throw new Exception("Playlist not found or not owned by user");

        var items = await _context.PlaylistSongs
            .Where(ps => ps.PlaylistId == playlistId)
            .ToListAsync();

        var indexById = new Dictionary<int, int>();
        for (int i = 0; i < songIds.Count; i++)
        {
            indexById[songIds[i]] = i + 1;
        }

        var now = DateTime.UtcNow;
        foreach (var ps in items)
        {
            if (indexById.TryGetValue(ps.SongId, out var order))
            {
                ps.Order = order;
                ps.UpdatedAt = now;
            }
            else
            {
                ps.Order = null;
                ps.UpdatedAt = now;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<MyPlaylistDto?> GetPlaylistFullAsync(int id, string? userId)
    {
        var playlist = await _context.Playlists.FirstOrDefaultAsync(p => p.Id == id);
        if (playlist == null) return null;

        bool isPinned = false;
        if (!string.IsNullOrEmpty(userId))
        {
            isPinned = await _context.PlaylistMembers
                .AnyAsync(m => m.PlaylistId == id && m.MemberId == userId && m.IsPinned);
        }

        var songsQuery =
            from ps in _context.PlaylistSongs
            where ps.PlaylistId == id
            join s in _context.Songs on ps.SongId equals s.Id
            orderby (ps.Order == null), ps.Order, s.Name
            select new LiteSongDto
            {
                Id = s.Id,
                Name = s.Name,
                Artist = s.Artist,
                SourceUrl = s.SourceUrl,
                RootNote = s.RootNote,
                Order = ps.Order
            };

        var songs = await songsQuery.ToListAsync();

        return new MyPlaylistDto
        {
            PlaylistId = playlist.Id,
            OwnerId = playlist.OwnerId,
            Title = playlist.Title,
            Description = playlist.Description,
            IsPinned = isPinned,
            Songs = songs
        };
    }
}