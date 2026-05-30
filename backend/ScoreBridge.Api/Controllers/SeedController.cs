using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using ScoreBridge.Api.Data;
using ScoreBridge.Api.Models;
using ScoreBridge.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScoreBridge.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IScoreCalculationService _scoreCalculator;

        public SeedController(AppDbContext context, IWebHostEnvironment env, IScoreCalculationService scoreCalculator)
        {
            _context = context;
            _env = env;
            _scoreCalculator = scoreCalculator;
        }

        // POST: api/seed
        [HttpPost]
        public async Task<IActionResult> SeedDemoData()
        {
            // Strict environment check
            if (!_env.IsDevelopment())
            {
                return BadRequest(new { message = "Seeding is alleen toegestaan in Development omgeving." });
            }

            // Clean database tables except players if we want, or do a full reset
            // Let's keep it safe: just add demo data if it doesn't exist yet, or reset.
            // Resetting is usually best for demo endpoints. Let's delete existing data first to guarantee clean slate!
            await _context.Database.EnsureCreatedAsync();

            // Clear all data
            _context.RoundScores.RemoveRange(_context.RoundScores);
            _context.Rounds.RemoveRange(_context.Rounds);
            _context.GamePlayers.RemoveRange(_context.GamePlayers);
            _context.Games.RemoveRange(_context.Games);
            _context.Players.RemoveRange(_context.Players);
            await _context.SaveChangesAsync();

            // 1. Create Players
            var lennert = new Player { Id = Guid.NewGuid(), Name = "Lennert", CreatedAt = DateTime.UtcNow.AddDays(-5) };
            var sarah = new Player { Id = Guid.NewGuid(), Name = "Sarah", CreatedAt = DateTime.UtcNow.AddDays(-5) };
            var thomas = new Player { Id = Guid.NewGuid(), Name = "Thomas", CreatedAt = DateTime.UtcNow.AddDays(-5) };
            var marie = new Player { Id = Guid.NewGuid(), Name = "Marie", CreatedAt = DateTime.UtcNow.AddDays(-5) };

            _context.Players.AddRange(lennert, sarah, thomas, marie);
            await _context.SaveChangesAsync();

            // 2. Create Finished Game: "Wekelijkse Kaartavond"
            var game = new Game
            {
                Id = Guid.NewGuid(),
                Name = "Wekelijkse Kaartavond",
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                FinishedAt = DateTime.UtcNow.AddHours(-1),
                IsFinished = true
            };
            _context.Games.Add(game);

            var gpLennert = new GamePlayer { Id = Guid.NewGuid(), GameId = game.Id, PlayerId = lennert.Id, SeatOrder = 1 };
            var gpSarah = new GamePlayer { Id = Guid.NewGuid(), GameId = game.Id, PlayerId = sarah.Id, SeatOrder = 2 };
            var gpThomas = new GamePlayer { Id = Guid.NewGuid(), GameId = game.Id, PlayerId = thomas.Id, SeatOrder = 3 };
            var gpMarie = new GamePlayer { Id = Guid.NewGuid(), GameId = game.Id, PlayerId = marie.Id, SeatOrder = 4 };

            _context.GamePlayers.AddRange(gpLennert, gpSarah, gpThomas, gpMarie);
            await _context.SaveChangesAsync();

            // 3. Create completed rounds (e.g. 3 rounds: Round 1 (5 cards), Round 2 (4 cards), Round 3 (3 cards))
            var roundsData = new[]
            {
                new { RoundNum = 1, Cards = 5, Preds = new[] { 2, 1, 1, 1 }, Acts = new[] { 2, 0, 2, 1 } }, // Total tricks = 5
                new { RoundNum = 2, Cards = 4, Preds = new[] { 1, 2, 0, 1 }, Acts = new[] { 1, 2, 0, 1 } }, // Total tricks = 4 (All exact!)
                new { RoundNum = 3, Cards = 3, Preds = new[] { 0, 1, 2, 0 }, Acts = new[] { 1, 0, 2, 0 } }  // Total tricks = 3
            };

            foreach (var rData in roundsData)
            {
                var round = new Round
                {
                    Id = Guid.NewGuid(),
                    GameId = game.Id,
                    RoundNumber = rData.RoundNum,
                    CardsCount = rData.Cards,
                    CreatedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(rData.RoundNum * 20),
                    IsCompleted = true
                };
                _context.Rounds.Add(round);

                var gps = new[] { gpLennert, gpSarah, gpThomas, gpMarie };
                for (int i = 0; i < gps.Length; i++)
                {
                    var pred = rData.Preds[i];
                    var act = rData.Acts[i];
                    var points = _scoreCalculator.CalculatePoints(pred, act);

                    var roundScore = new RoundScore
                    {
                        Id = Guid.NewGuid(),
                        RoundId = round.Id,
                        GamePlayerId = gps[i].Id,
                        PredictedTricks = pred,
                        ActualTricks = act,
                        Points = points,
                        UpdatedAt = DateTime.UtcNow.AddHours(-3).AddMinutes(rData.RoundNum * 20 + 10)
                    };
                    _context.RoundScores.Add(roundScore);
                }
            }

            // 4. Create an active game in progress: "Boerenbridge Café"
            var activeGame = new Game
            {
                Id = Guid.NewGuid(),
                Name = "Boerenbridge Café",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                IsFinished = false
            };
            _context.Games.Add(activeGame);

            var gpActiveLennert = new GamePlayer { Id = Guid.NewGuid(), GameId = activeGame.Id, PlayerId = lennert.Id, SeatOrder = 1 };
            var gpActiveSarah = new GamePlayer { Id = Guid.NewGuid(), GameId = activeGame.Id, PlayerId = sarah.Id, SeatOrder = 2 };
            var gpActiveThomas = new GamePlayer { Id = Guid.NewGuid(), GameId = activeGame.Id, PlayerId = thomas.Id, SeatOrder = 3 };

            _context.GamePlayers.AddRange(gpActiveLennert, gpActiveSarah, gpActiveThomas);
            await _context.SaveChangesAsync();

            // Create Round 1 in progress (already completed)
            var activeRound1 = new Round
            {
                Id = Guid.NewGuid(),
                GameId = activeGame.Id,
                RoundNumber = 1,
                CardsCount = 8,
                CreatedAt = DateTime.UtcNow.AddMinutes(-25),
                IsCompleted = true
            };
            _context.Rounds.Add(activeRound1);

            var activeGps = new[] { gpActiveLennert, gpActiveSarah, gpActiveThomas };
            var activeRound1Preds = new[] { 3, 2, 3 };
            var activeRound1Acts = new[] { 3, 3, 2 }; // total = 8

            for (int i = 0; i < activeGps.Length; i++)
            {
                var pred = activeRound1Preds[i];
                var act = activeRound1Acts[i];
                var points = _scoreCalculator.CalculatePoints(pred, act);

                var roundScore = new RoundScore
                {
                    Id = Guid.NewGuid(),
                    RoundId = activeRound1.Id,
                    GamePlayerId = activeGps[i].Id,
                    PredictedTricks = pred,
                    ActualTricks = act,
                    Points = points,
                    UpdatedAt = DateTime.UtcNow.AddMinutes(-15)
                };
                _context.RoundScores.Add(roundScore);
            }

            // Create Round 2 which is new (only predictions entered)
            var activeRound2 = new Round
            {
                Id = Guid.NewGuid(),
                GameId = activeGame.Id,
                RoundNumber = 2,
                CardsCount = 7,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                IsCompleted = false
            };
            _context.Rounds.Add(activeRound2);

            var activeRound2Preds = new[] { 2, 4, 1 };
            for (int i = 0; i < activeGps.Length; i++)
            {
                var roundScore = new RoundScore
                {
                    Id = Guid.NewGuid(),
                    RoundId = activeRound2.Id,
                    GamePlayerId = activeGps[i].Id,
                    PredictedTricks = activeRound2Preds[i],
                    ActualTricks = null,
                    Points = null,
                    UpdatedAt = DateTime.UtcNow.AddMinutes(-3)
                };
                _context.RoundScores.Add(roundScore);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Database succesvol gereset en gevuld met demo data!",
                players = new[] { "Lennert", "Sarah", "Thomas", "Marie" },
                finishedGame = "Wekelijkse Kaartavond (3 rondes)",
                activeGame = "Boerenbridge Café (Ronde 2 actief)"
            });
        }
    }
}
