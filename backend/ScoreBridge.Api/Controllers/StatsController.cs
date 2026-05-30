using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScoreBridge.Api.Data;
using ScoreBridge.Api.Models.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScoreBridge.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/stats/alltime
        [HttpGet("alltime")]
        public async Task<ActionResult<AllTimeStatsDto>> GetAllTimeStats()
        {
            var totalGames = await _context.Games.CountAsync(g => g.IsFinished);
            var totalRounds = await _context.Rounds.CountAsync(r => r.IsCompleted);
            var totalPlayers = await _context.Players.CountAsync();

            if (totalPlayers == 0)
            {
                return Ok(new AllTimeStatsDto());
            }

            // Get all completed round scores
            var completedScores = await _context.RoundScores
                .Include(rs => rs.GamePlayer)
                    .ThenInclude(gp => gp.Player)
                .Include(rs => rs.Round)
                    .ThenInclude(r => r!.Game)
                .Where(rs => rs.Round!.IsCompleted)
                .ToListAsync();

            if (!completedScores.Any())
            {
                return Ok(new AllTimeStatsDto
                {
                    TotalGames = totalGames,
                    TotalRounds = totalRounds,
                    TotalPlayers = totalPlayers
                });
            }

            // Group scores by Player ID
            var playerGroups = completedScores
                .GroupBy(rs => rs.GamePlayer!.PlayerId)
                .ToList();

            var playerPointRankings = new List<PlayerPointRankingDto>();
            var playerAverageRankings = new List<PlayerAverageRankingDto>();

            var players = await _context.Players.ToDictionaryAsync(p => p.Id, p => p.Name);

            foreach (var group in playerGroups)
            {
                var playerId = group.Key;
                var playerName = players.TryGetValue(playerId, out var name) ? name : "Onbekende Speler";

                var totalPoints = group.Sum(rs => rs.Points ?? 0);
                var roundsPlayed = group.Count();
                
                // Get unique games count for this player
                var gamesPlayed = group.Select(rs => rs.GamePlayer!.GameId).Distinct().Count();

                playerPointRankings.Add(new PlayerPointRankingDto
                {
                    PlayerId = playerId,
                    PlayerName = playerName,
                    TotalPoints = totalPoints,
                    GamesPlayed = gamesPlayed
                });

                playerAverageRankings.Add(new PlayerAverageRankingDto
                {
                    PlayerId = playerId,
                    PlayerName = playerName,
                    AveragePoints = Math.Round((double)totalPoints / roundsPlayed, 2),
                    RoundsPlayed = roundsPlayed
                });
            }

            // Sort rankings
            var sortedPointRanking = playerPointRankings.OrderByDescending(r => r.TotalPoints).ToList();
            var sortedAvgRanking = playerAverageRankings.OrderByDescending(r => r.AveragePoints).ToList();

            // Computations for special awards
            var exactCounts = playerGroups.Select(g => new
            {
                PlayerId = g.Key,
                PlayerName = players.GetValueOrDefault(g.Key, "Onbekend"),
                Count = g.Count(rs => rs.PredictedTricks == rs.ActualTricks),
                TotalRounds = g.Count()
            }).ToList();

            var bestExact = exactCounts.OrderByDescending(x => x.Count).FirstOrDefault();
            var bestAccuracy = exactCounts
                .Where(x => x.TotalRounds >= 1) // minimum rounds to qualify
                .Select(x => new
                {
                    x.PlayerId,
                    x.PlayerName,
                    AccuracyPercentage = Math.Round((double)x.Count / x.TotalRounds * 100, 1),
                    RoundsPlayed = x.TotalRounds
                })
                .OrderByDescending(x => x.AccuracyPercentage)
                .ThenByDescending(x => x.RoundsPlayed)
                .FirstOrDefault();

            var overpreds = playerGroups.Select(g => new
            {
                PlayerId = g.Key,
                PlayerName = players.GetValueOrDefault(g.Key, "Onbekend"),
                Count = g.Count(rs => rs.PredictedTricks > (rs.ActualTricks ?? 0))
            }).OrderByDescending(x => x.Count).FirstOrDefault();

            var underpreds = playerGroups.Select(g => new
            {
                PlayerId = g.Key,
                PlayerName = players.GetValueOrDefault(g.Key, "Onbekend"),
                Count = g.Count(rs => rs.PredictedTricks < (rs.ActualTricks ?? 0))
            }).OrderByDescending(x => x.Count).FirstOrDefault();

            // Find biggest and worst single-round scores
            var biggestScore = completedScores
                .Select(rs => new SingleRoundScoreDetailDto
                {
                    PlayerId = rs.GamePlayer!.PlayerId,
                    PlayerName = rs.GamePlayer.Player?.Name ?? "Onbekend",
                    GameId = rs.GamePlayer.GameId,
                    GameName = rs.Round?.Game?.Name ?? "Onbekend Spel",
                    RoundNumber = rs.Round?.RoundNumber ?? 0,
                    Points = rs.Points ?? 0,
                    PredictedTricks = rs.PredictedTricks,
                    ActualTricks = rs.ActualTricks ?? 0
                })
                .OrderByDescending(x => x.Points)
                .FirstOrDefault();

            var worstScore = completedScores
                .Select(rs => new SingleRoundScoreDetailDto
                {
                    PlayerId = rs.GamePlayer!.PlayerId,
                    PlayerName = rs.GamePlayer.Player?.Name ?? "Onbekend",
                    GameId = rs.GamePlayer.GameId,
                    GameName = rs.Round?.Game?.Name ?? "Onbekend Spel",
                    RoundNumber = rs.Round?.RoundNumber ?? 0,
                    Points = rs.Points ?? 0,
                    PredictedTricks = rs.PredictedTricks,
                    ActualTricks = rs.ActualTricks ?? 0
                })
                .OrderBy(x => x.Points)
                .FirstOrDefault();

            var stats = new AllTimeStatsDto
            {
                TotalGames = totalGames,
                TotalRounds = totalRounds,
                TotalPlayers = totalPlayers,
                RankingByTotalPoints = sortedPointRanking,
                RankingByAveragePoints = sortedAvgRanking,
                PlayerWithMostExactPredictions = bestExact != null ? new PlayerStatDetailDto { PlayerId = bestExact.PlayerId, PlayerName = bestExact.PlayerName, Count = bestExact.Count } : null,
                PlayerWithBestPredictionAccuracy = bestAccuracy != null ? new PlayerAccuracyDetailDto { PlayerId = bestAccuracy.PlayerId, PlayerName = bestAccuracy.PlayerName, AccuracyPercentage = bestAccuracy.AccuracyPercentage, RoundsPlayed = bestAccuracy.RoundsPlayed } : null,
                PlayerWithMostOverpredictions = overpreds != null ? new PlayerStatDetailDto { PlayerId = overpreds.PlayerId, PlayerName = overpreds.PlayerName, Count = overpreds.Count } : null,
                PlayerWithMostUnderpredictions = underpreds != null ? new PlayerStatDetailDto { PlayerId = underpreds.PlayerId, PlayerName = underpreds.PlayerName, Count = underpreds.Count } : null,
                BiggestSingleRoundScore = biggestScore,
                WorstSingleRoundScore = worstScore
            };

            return Ok(stats);
        }

        // GET: api/stats/players/{playerId}
        [HttpGet("players/{playerId}")]
        public async Task<ActionResult<PlayerAccuracyDetailDto>> GetPlayerStats(Guid playerId)
        {
            var player = await _context.Players.FindAsync(playerId);
            if (player == null)
            {
                return NotFound(new { message = "Speler niet gevonden." });
            }

            var playerScores = await _context.RoundScores
                .Include(rs => rs.Round)
                .Where(rs => rs.GamePlayer!.PlayerId == playerId && rs.Round!.IsCompleted)
                .ToListAsync();

            var totalRounds = playerScores.Count;
            var exactPredictions = playerScores.Count(rs => rs.PredictedTricks == rs.ActualTricks);
            var accuracy = totalRounds > 0 ? (double)exactPredictions / totalRounds * 100 : 0.0;

            return Ok(new PlayerAccuracyDetailDto
            {
                PlayerId = player.Id,
                PlayerName = player.Name,
                AccuracyPercentage = Math.Round(accuracy, 1),
                RoundsPlayed = totalRounds
            });
        }
    }
}
