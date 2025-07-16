using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;
using System.Security.Claims;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SongController : ControllerBase
{
    private readonly ISongService _service;

    public SongController(ISongService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(SongDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        dto.AuthorId = userId;

        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, SongDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        await _service.UpdateAsync(id, dto, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        await _service.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPost("fork/cached/{cachedSongId}")]
    [Authorize]
    public async Task<IActionResult> ForkCached(int cachedSongId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        var created = await _service.ForkCachedSongAsync(cachedSongId, userId);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPost("fork/song/{songId}")]
    [Authorize]
    public async Task<IActionResult> ForkSong(int songId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        var created = await _service.ForkSongAsync(songId, userId);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMySongs()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        var songs = await _service.GetAllByUserAsync(userId);
        return Ok(songs);
    }

    [HttpGet("my/starred")]
    [Authorize]
    public async Task<IActionResult> GetMyStarredSongs()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
        var songs = await _service.GetAllStarredByUserAsync(userId);
        return Ok(songs);
    }
}