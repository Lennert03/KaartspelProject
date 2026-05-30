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
    public class GamesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GamesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/games
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GameDto>>> GetGames()
        {
            var games = await _context.Games
                .Include(g => g.GamePlayers)
                    .ThenInclude(gp => gp.Player)
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => new GameDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    CreatedAt = g.CreatedAt,
                    FinishedAt = g.FinishedAt,
                    IsFinished = g.IsFinished,
                    Players = g.GamePlayers
                        .OrderBy(gp => gp.SeatOrder)
                        .Select(gp => new GamePlayerDto
                        {
                            Id = gp.Id,
                            PlayerId = gp.PlayerId,
                            PlayerName = gp.Player != null ? gp.Player.Name : "Onbekende Speler",
                            SeatOrder = gp.SeatOrder
                        }).ToList()
                })
                .ToListAsync();

            return Ok(games);
        }

        // GET: api/games/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GameDto>> GetGame(Guid id)
        {
            var game = await _context.Games
                .Include(g => g.GamePlayers)
                    .ThenInclude(gp => gp.Player)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
            {
                return NotFound(new { message = $"Game met ID {id} niet gevonden." });
            }

            var dto = new GameDto
            {
                Id = game.Id,
                Name = game.Name,
                CreatedAt = game.CreatedAt,
                FinishedAt = game.FinishedAt,
                IsFinished = game.IsFinished,
                Players = game.GamePlayers
                    .OrderBy(gp => gp.SeatOrder)
                    .Select(gp => new GamePlayerDto
                    {
                        Id = gp.Id,
                        PlayerId = gp.PlayerId,
                        PlayerName = gp.Player != null ? gp.Player.Name : "Onbekende Speler",
                        SeatOrder = gp.SeatOrder
                    }).ToList()
            };

            return Ok(dto);
        }

        // POST: api/games
        [HttpPost]
        public async Task<ActionResult<GameDto>> CreateGame([FromBody] CreateGameDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Spelnaam is verplicht." });
            }

            if (dto.Name.Length > 100)
            {
                return BadRequest(new { message = "Spelnaam mag maximaal 100 karakters lang zijn." });
            }

            var game = new Game
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsFinished = false
            };

            _context.Games.Add(game);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGame), new { id = game.Id }, new GameDto
            {
                Id = game.Id,
                Name = game.Name,
                CreatedAt = game.CreatedAt,
                IsFinished = game.IsFinished
            });
        }

        // POST: api/games/{id}/players
        [HttpPost("{id}/players")]
        public async Task<IActionResult> AddPlayerToGame(Guid id, [FromBody] AddGamePlayerDto dto)
        {
            var game = await _context.Games
                .Include(g => g.GamePlayers)
                .Include(g => g.Rounds)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
            {
                return NotFound(new { message = $"Game met ID {id} niet gevonden." });
            }

            if (game.IsFinished)
            {
                return BadRequest(new { message = "Kan geen spelers toevoegen aan een voltooid spel." });
            }

            if (game.Rounds.Any())
            {
                return BadRequest(new { message = "Kan geen spelers toevoegen nadat het spel reeds is gestart (rondes aanwezig)." });
            }

            var player = await _context.Players.FindAsync(dto.PlayerId);
            if (player == null)
            {
                return BadRequest(new { message = "Geselecteerde speler bestaat niet." });
            }

            // Check if player already in game
            if (game.GamePlayers.Any(gp => gp.PlayerId == dto.PlayerId))
            {
                return BadRequest(new { message = "Speler is al toegevoegd aan dit spel." });
            }

            // Determine SeatOrder if not provided or if duplicate
            int seatOrder = dto.SeatOrder;
            if (game.GamePlayers.Any(gp => gp.SeatOrder == seatOrder))
            {
                seatOrder = game.GamePlayers.Count > 0 ? game.GamePlayers.Max(gp => gp.SeatOrder) + 1 : 1;
            }

            var gamePlayer = new GamePlayer
            {
                Id = Guid.NewGuid(),
                GameId = id,
                PlayerId = dto.PlayerId,
                SeatOrder = seatOrder
            };

            _context.GamePlayers.Add(gamePlayer);
            await _context.SaveChangesAsync();

            return Ok(new GamePlayerDto
            {
                Id = gamePlayer.Id,
                PlayerId = gamePlayer.PlayerId,
                PlayerName = player.Name,
                SeatOrder = gamePlayer.SeatOrder
            });
        }

        // DELETE: api/games/{gameId}/players/{playerId}
        [HttpDelete("{gameId}/players/{playerId}")]
        public async Task<IActionResult> RemovePlayerFromGame(Guid gameId, Guid playerId)
        {
            var game = await _context.Games
                .Include(g => g.GamePlayers)
                .Include(g => g.Rounds)
                .FirstOrDefaultAsync(g => g.Id == gameId);

            if (game == null)
            {
                return NotFound(new { message = "Spel niet gevonden." });
            }

            if (game.IsFinished)
            {
                return BadRequest(new { message = "Kan geen spelers verwijderen uit een voltooid spel." });
            }

            if (game.Rounds.Any())
            {
                return BadRequest(new { message = "Kan geen spelers verwijderen nadat het spel reeds is gestart (rondes aanwezig)." });
            }

            var gamePlayer = game.GamePlayers.FirstOrDefault(gp => gp.PlayerId == playerId);
            if (gamePlayer == null)
            {
                return NotFound(new { message = "Speler maakt geen deel uit van dit spel." });
            }

            _context.GamePlayers.Remove(gamePlayer);
            await _context.SaveChangesAsync();

            // Re-order remaining players' seat order
            var remainingPlayers = game.GamePlayers
                .Where(gp => gp.PlayerId != playerId)
                .OrderBy(gp => gp.SeatOrder)
                .ToList();

            for (int i = 0; i < remainingPlayers.Count; i++)
            {
                remainingPlayers[i].SeatOrder = i + 1;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/games/{id}/rounds
        [HttpPost("{id}/rounds")]
        public async Task<ActionResult<RoundDto>> CreateRound(Guid id, [FromBody] CreateRoundDto dto)
        {
            var game = await _context.Games
                .Include(g => g.GamePlayers)
                .Include(g => g.Rounds)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
            {
                return NotFound(new { message = "Spel niet gevonden." });
            }

            if (game.IsFinished)
            {
                return BadRequest(new { message = "Kan geen nieuwe ronde starten in een voltooid spel." });
            }

            if (game.GamePlayers.Count < 2)
            {
                return BadRequest(new { message = "Een spel heeft minimaal 2 spelers nodig om te kunnen starten." });
            }

            // Check if there is an active/uncompleted round
            var activeRound = game.Rounds.FirstOrDefault(r => !r.IsCompleted);
            if (activeRound != null)
            {
                return BadRequest(new { message = $"Ronde {activeRound.RoundNumber} is nog niet afgerond. Rondes moeten na elkaar gespeeld en voltooid worden." });
            }

            if (dto.CardsCount < 1)
            {
                return BadRequest(new { message = "Het aantal kaarten voor een ronde moet minimaal 1 zijn." });
            }

            int nextRoundNumber = game.Rounds.Count > 0 ? game.Rounds.Max(r => r.RoundNumber) + 1 : 1;

            var round = new Round
            {
                Id = Guid.NewGuid(),
                GameId = id,
                RoundNumber = nextRoundNumber,
                CardsCount = dto.CardsCount,
                CreatedAt = DateTime.UtcNow,
                IsCompleted = false
            };

            _context.Rounds.Add(round);

            // Initialize empty RoundScores for all players in the game
            foreach (var gp in game.GamePlayers)
            {
                var roundScore = new RoundScore
                {
                    Id = Guid.NewGuid(),
                    RoundId = round.Id,
                    GamePlayerId = gp.Id,
                    PredictedTricks = 0, // default, will be updated via predictions endpoint
                    ActualTricks = null,
                    Points = null,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.RoundScores.Add(roundScore);
            }

            await _context.SaveChangesAsync();

            // Fetch the round with scores to return
            var createdRound = await _context.Rounds
                .Include(r => r.RoundScores)
                    .ThenInclude(rs => rs.GamePlayer)
                        .ThenInclude(gp => gp.Player)
                .FirstAsync(r => r.Id == round.Id);

            return Ok(new RoundDto
            {
                Id = createdRound.Id,
                GameId = createdRound.GameId,
                RoundNumber = createdRound.RoundNumber,
                CardsCount = createdRound.CardsCount,
                CreatedAt = createdRound.CreatedAt,
                IsCompleted = createdRound.IsCompleted,
                Scores = createdRound.RoundScores.Select(rs => new RoundScoreDto
                {
                    Id = rs.Id,
                    GamePlayerId = rs.GamePlayerId,
                    PlayerId = rs.GamePlayer?.PlayerId ?? Guid.Empty,
                    PlayerName = rs.GamePlayer?.Player?.Name ?? "Onbekend",
                    PredictedTricks = rs.PredictedTricks,
                    ActualTricks = rs.ActualTricks,
                    Points = rs.Points,
                    UpdatedAt = rs.UpdatedAt
                }).ToList()
            });
        }

        // GET: api/games/{id}/scoreboard
        [HttpGet("{id}/scoreboard")]
        public async Task<ActionResult<ScoreboardDto>> GetScoreboard(Guid id)
        {
            var game = await _context.Games
                .Include(g => g.GamePlayers)
                    .ThenInclude(gp => gp.Player)
                .Include(g => g.Rounds)
                    .ThenInclude(r => r.RoundScores)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
            {
                return NotFound(new { message = "Spel niet gevonden." });
            }

            // Create scoreboard
            var scoreboard = new ScoreboardDto
            {
                GameId = game.Id,
                GameName = game.Name,
                CreatedAt = game.CreatedAt,
                FinishedAt = game.FinishedAt,
                IsFinished = game.IsFinished,
                PlayerSummaries = new List<PlayerScoreSummaryDto>(),
                RoundsTable = new List<RoundTableRowDto>()
            };

            // Pre-fill summaries for each player in game
            foreach (var gp in game.GamePlayers.OrderBy(gp => gp.SeatOrder))
            {
                var gpScores = game.Rounds
                    .SelectMany(r => r.RoundScores)
                    .Where(rs => rs.GamePlayerId == gp.Id)
                    .ToList();

                var roundsPlayed = gpScores.Count(s => s.Round?.IsCompleted == true);
                var exactPredictions = gpScores.Count(s => s.Round?.IsCompleted == true && s.PredictedTricks == s.ActualTricks);
                var totalPredicted = gpScores.Sum(s => s.PredictedTricks);
                var totalActual = gpScores.Sum(s => s.ActualTricks ?? 0);
                var totalPoints = gpScores.Sum(s => s.Points ?? 0);
                var accuracy = roundsPlayed > 0 ? (double)exactPredictions / roundsPlayed * 100 : 0.0;

                scoreboard.PlayerSummaries.Add(new PlayerScoreSummaryDto
                {
                    PlayerId = gp.PlayerId,
                    GamePlayerId = gp.Id,
                    PlayerName = gp.Player?.Name ?? "Onbekend",
                    SeatOrder = gp.SeatOrder,
                    TotalPoints = totalPoints,
                    RoundsPlayed = roundsPlayed,
                    ExactPredictions = exactPredictions,
                    TotalPredictedTricks = totalPredicted,
                    TotalActualTricks = totalActual,
                    PredictionAccuracyPercentage = Math.Round(accuracy, 1)
                });
            }

            // Sort summaries by descending total points, then seat order
            scoreboard.PlayerSummaries = scoreboard.PlayerSummaries
                .OrderByDescending(ps => ps.TotalPoints)
                .ToList();

            // Fill round-by-round table rows
            foreach (var round in game.Rounds.OrderBy(r => r.RoundNumber))
            {
                var row = new RoundTableRowDto
                {
                    RoundId = round.Id,
                    RoundNumber = round.RoundNumber,
                    CardsCount = round.CardsCount,
                    IsCompleted = round.IsCompleted,
                    PlayerCells = new List<RoundScoreCellDto>()
                };

                foreach (var gp in game.GamePlayers.OrderBy(gp => gp.SeatOrder))
                {
                    var score = round.RoundScores.FirstOrDefault(rs => rs.GamePlayerId == gp.Id);
                    row.PlayerCells.Add(new RoundScoreCellDto
                    {
                        GamePlayerId = gp.Id,
                        PlayerId = gp.PlayerId,
                        PredictedTricks = score?.PredictedTricks ?? 0,
                        ActualTricks = score?.ActualTricks,
                        Points = score?.Points
                    });
                }

                scoreboard.RoundsTable.Add(row);
            }

            return Ok(scoreboard);
        }

        // POST: api/games/{id}/finish
        [HttpPost("{id}/finish")]
        public async Task<IActionResult> FinishGame(Guid id)
        {
            var game = await _context.Games
                .Include(g => g.Rounds)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (game == null)
            {
                return NotFound(new { message = "Spel niet gevonden." });
            }

            if (game.IsFinished)
            {
                return BadRequest(new { message = "Dit spel is al beëindigd." });
            }

            // Allow finishing only if there are rounds played, and no uncompleted round
            if (!game.Rounds.Any())
            {
                return BadRequest(new { message = "Kan spel niet beëindigen zonder gespeelde rondes." });
            }

            if (game.Rounds.Any(r => !r.IsCompleted))
            {
                return BadRequest(new { message = "Kan het spel niet beëindigen terwijl er nog een onvoltooide ronde actief is." });
            }

            game.IsFinished = true;
            game.FinishedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Spel succesvol beëindigd.", finishedAt = game.FinishedAt });
        }
    }
}
