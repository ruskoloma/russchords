using Microsoft.AspNetCore.Mvc;
using BackendApi.Services.Interfaces;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CachedSongController : ControllerBase
{
    private readonly ICachedSongService _service;

    public CachedSongController(ICachedSongService service)
    {
        _service = service;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }
}