using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Models.Dtos;
using BackendApi.Services.Interfaces;
using System.Security.Claims;

namespace BackendApi.Controllers;

[ApiController]
[Route("[controller]")]
public class SongController : ControllerBase
{
    private readonly ISongService _service;

    public SongController(ISongService service)
    {
        _service = service;
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");
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
    public async Task<IActionResult> Create([FromBody] CreateSongDto dto)
    {
        var created = await _service.CreateAsync(dto, GetUserId());
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, UpdateSongDto dto)
    {
        await _service.UpdateAsync(id, dto, GetUserId());
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetUserId());
        return NoContent();
    }

    [HttpPost("fork/{cachedSongId}")]
    [Authorize]
    public async Task<IActionResult> ForkCached(int cachedSongId)
    {
        var created = await _service.ForkCachedSongAsync(cachedSongId, GetUserId());
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPost("clone/{songId}")]
    [Authorize]
    public async Task<IActionResult> ForkSong(int songId)
    {
        var created = await _service.ForkSongAsync(songId, GetUserId());
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("my/light")]
    [Authorize]
    public async Task<IActionResult> GetMySongsLight()
    {
        var songs = await _service.GetAllLightByUserAsync(GetUserId());
        return Ok(songs);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMySongs()
    {
        var songs = await _service.GetAllByUserAsync(GetUserId());
        return Ok(songs);
    }

    [HttpGet("my/forks/{originalId}")]
    [Authorize]
    public async Task<IActionResult> GetMyForksByOriginalId(int originalId)
    {
        var songs = await _service.GetMyForksByOriginalIdAsync(GetUserId(), originalId);
        return Ok(songs);
    }
}