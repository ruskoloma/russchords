using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using BackendApi.Services.Interfaces;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StarredController : ControllerBase
{
    private readonly IStarredService _service;

    public StarredController(IStarredService service)
    {
        _service = service;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyStarred()
    {
        var userId = GetUserId();
        var result = await _service.GetAllStarredByUserAsync(userId);
        return Ok(result);
    }

    [HttpPost("{songId}")]
    [Authorize]
    public async Task<IActionResult> StarSong(int songId)
    {
        var userId = GetUserId();
        await _service.StarAsync(songId, userId);
        return NoContent();
    }

    [HttpDelete("{songId}")]
    [Authorize]
    public async Task<IActionResult> UnstarSong(int songId)
    {
        var userId = GetUserId();
        await _service.UnstarAsync(songId, userId);
        return NoContent();
    }
}