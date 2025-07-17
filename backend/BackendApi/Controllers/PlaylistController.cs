using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistService _service;

    public PlaylistController(IPlaylistService service)
    {
        _service = service;
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var result = await _service.GetAllAsync(userId);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = GetUserId();
        var result = await _service.GetByIdAsync(id, userId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePlaylistDto dto)
    {
        var userId = GetUserId();
        var created = await _service.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PlaylistDto dto)
    {
        var userId = GetUserId();
        await _service.UpdateAsync(id, dto, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        await _service.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPost("{playlistId}/songs/{songId}")]
    public async Task<IActionResult> AddSong(int playlistId, int songId)
    {
        var userId = GetUserId();
        await _service.AddSongAsync(playlistId, songId, userId);
        return NoContent();
    }

    [HttpDelete("{playlistId}/songs/{songId}")]
    public async Task<IActionResult> RemoveSong(int playlistId, int songId)
    {
        var userId = GetUserId();
        await _service.RemoveSongAsync(playlistId, songId, userId);
        return NoContent();
    }
}