using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScoreBridge.Api.Data;
using ScoreBridge.Api.Models;
using ScoreBridge.Api.Models.Dto;
using ScoreBridge.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScoreBridge.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoundsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IScoreCalculationService _scoreCalculator;

        public RoundsController(AppDbContext context, IScoreCalculationService scoreCalculator)
        {
            _context = context;
            _scoreCalculator = scoreCalculator;
        }

        // GET: api/rounds/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<RoundDto>> GetRound(Guid id)
        {
            var round = await _context.Rounds
                .Include(r => r.RoundScores)
                    .ThenInclude(rs => rs.GamePlayer)
                        .ThenInclude(gp => gp.Player)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (round == null)
            {
                return NotFound(new { message = $"Ronde met ID {id} niet gevonden." });
            }

            return Ok(new RoundDto
            {
                Id = round.Id,
                GameId = round.GameId,
                RoundNumber = round.RoundNumber,
                CardsCount = round.CardsCount,
                CreatedAt = round.CreatedAt,
                IsCompleted = round.IsCompleted,
                Scores = round.RoundScores.Select(rs => new RoundScoreDto
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

        // PUT: api/rounds/{id}/predictions
        [HttpPut("{id}/predictions")]
        public async Task<IActionResult> SubmitPredictions(Guid id, [FromBody] SubmitPredictionsDto dto)
        {
            var round = await _context.Rounds
                .Include(r => r.RoundScores)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (round == null)
            {
                return NotFound(new { message = "Ronde niet gevonden." });
            }

            if (round.IsCompleted)
            {
                return BadRequest(new { message = "Kan voorspellingen niet aanpassen voor een afgeronde ronde." });
            }

            foreach (var pred in dto.Predictions)
            {
                if (pred.PredictedTricks < 0)
                {
                    return BadRequest(new { message = "Voorspelde slagen mogen niet negatief zijn." });
                }

                var score = round.RoundScores.FirstOrDefault(rs => rs.GamePlayerId == pred.GamePlayerId);
                if (score != null)
                {
                    score.PredictedTricks = pred.PredictedTricks;
                    score.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            // Check if total predicted tricks equals CardsCount (warning scenario in Boerenbridge)
            int totalPredicted = round.RoundScores.Sum(rs => rs.PredictedTricks);
            bool warning = totalPredicted == round.CardsCount;
            string? warningMessage = null;
            if (warning)
            {
                warningMessage = $"Opgelet: Het totaal aantal voorspelde slagen ({totalPredicted}) is gelijk aan het aantal kaarten ({round.CardsCount}). Er kan dus iemand niet 'poepen/nat gaan' als iedereen correct speelt.";
            }

            return Ok(new 
            { 
                message = "Voorspellingen succesvol opgeslagen.", 
                totalPredictedTricks = totalPredicted,
                warning = warning,
                warningMessage = warningMessage
            });
        }

        // PUT: api/rounds/{id}/results
        [HttpPut("{id}/results")]
        public async Task<IActionResult> SubmitResults(Guid id, [FromBody] SubmitResultsDto dto)
        {
            var round = await _context.Rounds
                .Include(r => r.RoundScores)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (round == null)
            {
                return NotFound(new { message = "Ronde niet gevonden." });
            }

            if (round.IsCompleted)
            {
                return BadRequest(new { message = "Kan resultaten niet aanpassen voor een reeds afgeronde ronde." });
            }

            foreach (var res in dto.Results)
            {
                if (res.ActualTricks < 0)
                {
                    return BadRequest(new { message = "Behaalde slagen mogen niet negatief zijn." });
                }

                var score = round.RoundScores.FirstOrDefault(rs => rs.GamePlayerId == res.GamePlayerId);
                if (score != null)
                {
                    score.ActualTricks = res.ActualTricks;
                    // Calculate points preview on the fly
                    score.Points = _scoreCalculator.CalculatePoints(score.PredictedTricks, res.ActualTricks);
                    score.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Resultaten en punten succesvol berekend." });
        }

        // POST: api/rounds/{id}/complete
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteRound(Guid id)
        {
            var round = await _context.Rounds
                .Include(r => r.RoundScores)
                    .ThenInclude(rs => rs.GamePlayer)
                        .ThenInclude(gp => gp.Player)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (round == null)
            {
                return NotFound(new { message = "Ronde niet gevonden." });
            }

            if (round.IsCompleted)
            {
                return BadRequest(new { message = "Deze ronde is al voltooid." });
            }

            // Validation: check if every player has predictions and results
            foreach (var score in round.RoundScores)
            {
                if (score.ActualTricks == null)
                {
                    var name = score.GamePlayer?.Player?.Name ?? "Onbekend";
                    return BadRequest(new { message = $"Kan de ronde niet voltooien: resultaat ontbreekt voor speler '{name}'." });
                }
            }

            // Validation: Actual total tricks for a round should equal CardsCount
            int totalActual = round.RoundScores.Sum(rs => rs.ActualTricks ?? 0);
            if (totalActual != round.CardsCount)
            {
                return BadRequest(new { 
                    message = $"Fout bij afronding: Het totaal aantal behaalde slagen ({totalActual}) moet exact gelijk zijn aan het aantal kaarten ({round.CardsCount}) van deze ronde." 
                });
            }

            // Lock the round
            round.IsCompleted = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ronde succesvol afgerond en scores vergrendeld!" });
        }
    }
}
