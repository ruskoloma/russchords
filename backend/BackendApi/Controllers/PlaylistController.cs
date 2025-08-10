using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistService _playlists;
    private readonly IPlaylistMemberService _members;
    private readonly IPlaylistSongService _songs;

    public PlaylistController(
        IPlaylistService playlists,
        IPlaylistMemberService members,
        IPlaylistSongService songs)
    {
        _playlists = playlists;
        _members = members;
        _songs = songs;
    }

    private string GetUserIdRequired()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
    }

    // ---------------------------
    // Playlists (list/CRUD)
    // ---------------------------

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserIdRequired();
        var result = await _playlists.GetAllAsync(userId);
        return Ok(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetAllUserPlaylists()
    {
        var userId = GetUserIdRequired();
        var result = await _playlists.GetMyPlaylistsWithDetailsAsync(userId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        string? userId = User?.Identity?.IsAuthenticated == true
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var result = await _playlists.GetPlaylistFullAsync(id, userId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePlaylistDto dto)
    {
        var userId = GetUserIdRequired();
        var created = await _playlists.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdatePlaylistDto dto)
    {
        var userId = GetUserIdRequired();
        await _playlists.UpdateAsync(id, dto, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserIdRequired();
        await _playlists.DeleteAsync(id, userId);
        return NoContent();
    }

    // ---------------------------
    // Songs in playlist
    // ---------------------------

    [HttpPost("{playlistId}/songs/{songId}")]
    public async Task<IActionResult> AddSong(int playlistId, int songId)
    {
        var userId = GetUserIdRequired();
        await _playlists.AddSongAsync(playlistId, songId, userId);
        return NoContent();
    }

    [HttpDelete("{playlistId}/songs/{songId}")]
    public async Task<IActionResult> RemoveSong(int playlistId, int songId)
    {
        var userId = GetUserIdRequired();
        await _playlists.RemoveSongAsync(playlistId, songId, userId);
        return NoContent();
    }

    [HttpGet("songs")]
    public async Task<IActionResult> GetAllPlaylistSongs()
    {
        var result = await _songs.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("songs/{id}")]
    public async Task<IActionResult> GetPlaylistSong(int id)
    {
        var result = await _songs.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("songs")]
    public async Task<IActionResult> CreatePlaylistSong(PlaylistSongDto dto)
    {
        var created = await _songs.CreateAsync(dto);
        return CreatedAtAction(nameof(GetPlaylistSong), new { id = created.Id }, created);
    }

    [HttpDelete("songs/{id}")]
    public async Task<IActionResult> DeletePlaylistSong(int id)
    {
        await _songs.DeleteAsync(id);
        return NoContent();
    }

    // ---------------------------
    // Members (+ personal pin)
    // ---------------------------

    [HttpGet("members")]
    public async Task<IActionResult> GetAllMembers()
    {
        var result = await _members.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("members/{id}")]
    public async Task<IActionResult> GetMember(int id)
    {
        var result = await _members.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("members")]
    public async Task<IActionResult> CreateMember(PlaylistMemberDto dto)
    {
        if (dto.MemberId != GetUserIdRequired()) return Forbid();
        var created = await _members.CreateAsync(dto);
        return CreatedAtAction(nameof(GetMember), new { id = created.Id }, created);
    }

    [HttpDelete("members/{id}")]
    public async Task<IActionResult> DeleteMember(int id)
    {
        await _members.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{playlistId}/reorder")]
    public async Task<IActionResult> Reorder(int playlistId, [FromBody] PlaylistSongOrderDto dto)
    {
        var userId = GetUserIdRequired();
        await _playlists.ReorderSongsAsync(playlistId, userId, dto.SongIds);
        return NoContent();
    }

    [HttpPut("{playlistId}/members/pin")]
    public async Task<IActionResult> SetPinned(int playlistId, [FromQuery] bool value)
    {
        var userId = GetUserIdRequired();
        await _members.SetPinnedAsync(playlistId, userId, value);
        return NoContent();
    }
}