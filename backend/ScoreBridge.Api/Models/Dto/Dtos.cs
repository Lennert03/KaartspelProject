using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ScoreBridge.Api.Models.Dto
{
    // --- Player DTOs ---
    public class CreatePlayerDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class PlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // --- Game DTOs ---
    public class CreateGameDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }

    public class GameDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public bool IsFinished { get; set; }
        public List<GamePlayerDto> Players { get; set; } = new();
    }

    public class GamePlayerDto
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int SeatOrder { get; set; }
    }

    public class AddGamePlayerDto
    {
        [Required]
        public Guid PlayerId { get; set; }
        
        [Required]
        public int SeatOrder { get; set; }
    }

    // --- Round DTOs ---
    public class CreateRoundDto
    {
        [Required]
        [Range(1, 100)]
        public int CardsCount { get; set; }
    }

    public class RoundDto
    {
        public Guid Id { get; set; }
        public Guid GameId { get; set; }
        public int RoundNumber { get; set; }
        public int CardsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsCompleted { get; set; }
        public List<RoundScoreDto> Scores { get; set; } = new();
    }

    public class RoundScoreDto
    {
        public Guid Id { get; set; }
        public Guid GamePlayerId { get; set; }
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int PredictedTricks { get; set; }
        public int? ActualTricks { get; set; }
        public int? Points { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SubmitPredictionsDto
    {
        [Required]
        public List<PredictionEntryDto> Predictions { get; set; } = new();
    }

    public class PredictionEntryDto
    {
        [Required]
        public Guid GamePlayerId { get; set; }
        
        [Required]
        [Range(0, 100)]
        public int PredictedTricks { get; set; }
    }

    public class SubmitResultsDto
    {
        [Required]
        public List<ResultEntryDto> Results { get; set; } = new();
    }

    public class ResultEntryDto
    {
        [Required]
        public Guid GamePlayerId { get; set; }
        
        [Required]
        [Range(0, 100)]
        public int ActualTricks { get; set; }
    }

    // --- Scoreboard DTOs ---
    public class ScoreboardDto
    {
        public Guid GameId { get; set; }
        public string GameName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public bool IsFinished { get; set; }
        public List<PlayerScoreSummaryDto> PlayerSummaries { get; set; } = new();
        public List<RoundTableRowDto> RoundsTable { get; set; } = new();
    }

    public class PlayerScoreSummaryDto
    {
        public Guid PlayerId { get; set; }
        public Guid GamePlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int SeatOrder { get; set; }
        public int TotalPoints { get; set; }
        public int RoundsPlayed { get; set; }
        public int ExactPredictions { get; set; }
        public int TotalPredictedTricks { get; set; }
        public int TotalActualTricks { get; set; }
        public double PredictionAccuracyPercentage { get; set; }
    }

    public class RoundTableRowDto
    {
        public Guid RoundId { get; set; }
        public int RoundNumber { get; set; }
        public int CardsCount { get; set; }
        public bool IsCompleted { get; set; }
        public List<RoundScoreCellDto> PlayerCells { get; set; } = new();
    }

    public class RoundScoreCellDto
    {
        public Guid GamePlayerId { get; set; }
        public Guid PlayerId { get; set; }
        public int PredictedTricks { get; set; }
        public int? ActualTricks { get; set; }
        public int? Points { get; set; }
    }

    // --- All-time Stats DTOs ---
    public class AllTimeStatsDto
    {
        public int TotalGames { get; set; }
        public int TotalRounds { get; set; }
        public int TotalPlayers { get; set; }
        public List<PlayerPointRankingDto> RankingByTotalPoints { get; set; } = new();
        public List<PlayerAverageRankingDto> RankingByAveragePoints { get; set; } = new();
        public PlayerStatDetailDto? PlayerWithMostExactPredictions { get; set; }
        public PlayerAccuracyDetailDto? PlayerWithBestPredictionAccuracy { get; set; }
        public PlayerStatDetailDto? PlayerWithMostOverpredictions { get; set; }
        public PlayerStatDetailDto? PlayerWithMostUnderpredictions { get; set; }
        public SingleRoundScoreDetailDto? BiggestSingleRoundScore { get; set; }
        public SingleRoundScoreDetailDto? WorstSingleRoundScore { get; set; }
    }

    public class PlayerPointRankingDto
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int GamesPlayed { get; set; }
    }

    public class PlayerAverageRankingDto
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public double AveragePoints { get; set; }
        public int RoundsPlayed { get; set; }
    }

    public class PlayerStatDetailDto
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class PlayerAccuracyDetailDto
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public double AccuracyPercentage { get; set; }
        public int RoundsPlayed { get; set; }
    }

    public class SingleRoundScoreDetailDto
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public Guid GameId { get; set; }
        public string GameName { get; set; } = string.Empty;
        public int RoundNumber { get; set; }
        public int Points { get; set; }
        public int PredictedTricks { get; set; }
        public int ActualTricks { get; set; }
    }
}
