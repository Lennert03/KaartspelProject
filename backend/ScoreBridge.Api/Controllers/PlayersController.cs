using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScoreBridge.Api.Data;
using ScoreBridge.Api.Models;
using ScoreBridge.Api.Models.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScoreBridge.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PlayersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/players
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlayerDto>>> GetPlayers()
        {
            var players = await _context.Players
                .OrderBy(p => p.Name)
                .Select(p => new PlayerDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(players);
        }

        // GET: api/players/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PlayerDto>> GetPlayer(Guid id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return NotFound(new { message = $"Player with ID {id} not found." });
            }

            return Ok(new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                CreatedAt = player.CreatedAt
            });
        }

        // POST: api/players
        [HttpPost]
        public async Task<ActionResult<PlayerDto>> CreatePlayer([FromBody] CreatePlayerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Spelernaam is verplicht." });
            }

            if (dto.Name.Length > 50)
            {
                return BadRequest(new { message = "Spelernaam mag maximaal 50 karakters lang zijn." });
            }

            // Check if player name already exists (case-insensitive)
            var nameExists = await _context.Players
                .AnyAsync(p => p.Name.ToLower() == dto.Name.Trim().ToLower());
            if (nameExists)
            {
                return BadRequest(new { message = $"Er bestaat al een speler met de naam '{dto.Name}'." });
            }

            var player = new Player
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Players.Add(player);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPlayer), new { id = player.Id }, new PlayerDto
            {
                Id = player.Id,
                Name = player.Name,
                CreatedAt = player.CreatedAt
            });
        }

        // PUT: api/players/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlayer(Guid id, [FromBody] CreatePlayerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Spelernaam is verplicht." });
            }

            if (dto.Name.Length > 50)
            {
                return BadRequest(new { message = "Spelernaam mag maximaal 50 karakters lang zijn." });
            }

            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return NotFound(new { message = $"Player with ID {id} not found." });
            }

            // Check if the new name exists for another player
            var nameExists = await _context.Players
                .AnyAsync(p => p.Id != id && p.Name.ToLower() == dto.Name.Trim().ToLower());
            if (nameExists)
            {
                return BadRequest(new { message = $"Er bestaat al een speler met de naam '{dto.Name}'." });
            }

            player.Name = dto.Name.Trim();
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/players/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlayer(Guid id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return NotFound(new { message = $"Player with ID {id} not found." });
            }

            // Check if player is part of any games
            var hasGames = await _context.GamePlayers.AnyAsync(gp => gp.PlayerId == id);
            if (hasGames)
            {
                return BadRequest(new { message = "Kan speler niet verwijderen omdat deze meespeelt of heeft meegespeeld in actieve games." });
            }

            _context.Players.Remove(player);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
