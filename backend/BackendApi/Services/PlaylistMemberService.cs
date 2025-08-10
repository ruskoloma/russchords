using AutoMapper;
using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Data.Entities;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Services;

public class PlaylistMemberService : IPlaylistMemberService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PlaylistMemberService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<PlaylistMemberDto>> GetAllAsync()
    {
        var entities = await _context.PlaylistMembers.ToListAsync();
        return _mapper.Map<List<PlaylistMemberDto>>(entities);
    }

    public async Task<PlaylistMemberDto?> GetByIdAsync(int id)
    {
        var entity = await _context.PlaylistMembers.FindAsync(id);
        return entity == null ? null : _mapper.Map<PlaylistMemberDto>(entity);
    }

    public async Task<PlaylistMemberDto?> GetByCompositeAsync(int playlistId, string userId)
    {
        var entity = await _context.PlaylistMembers
            .FirstOrDefaultAsync(x => x.PlaylistId == playlistId && x.MemberId == userId);
        return entity == null ? null : _mapper.Map<PlaylistMemberDto>(entity);
    }

    public async Task<PlaylistMemberDto> CreateAsync(PlaylistMemberDto dto)
    {
        var entity = _mapper.Map<PlaylistMemberEntity>(dto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        _context.PlaylistMembers.Add(entity);
        await _context.SaveChangesAsync();
        return _mapper.Map<PlaylistMemberDto>(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.PlaylistMembers.FindAsync(id);
        if (entity == null) throw new Exception("Not found");
        _context.PlaylistMembers.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task SetPinnedAsync(int playlistId, string userId, bool value)
    {
        var entity = await _context.PlaylistMembers
            .FirstOrDefaultAsync(x => x.PlaylistId == playlistId && x.MemberId == userId);

        if (entity == null)
        {
            entity = new PlaylistMemberEntity
            {
                PlaylistId = playlistId,
                MemberId = userId,
                IsPinned = value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.PlaylistMembers.Add(entity);
        }
        else
        {
            entity.IsPinned = value;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}