using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ScoreBridge.Api.Models
{
    public class Player
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        [JsonIgnore]
        public ICollection<GamePlayer> GamePlayers { get; set; } = new List<GamePlayer>();
    }

    public class Game
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public bool IsFinished { get; set; }

        // Navigation properties
        public ICollection<GamePlayer> GamePlayers { get; set; } = new List<GamePlayer>();
        public ICollection<Round> Rounds { get; set; } = new List<Round>();
    }

    public class GamePlayer
    {
        public Guid Id { get; set; }
        public Guid GameId { get; set; }
        public Guid PlayerId { get; set; }
        public int SeatOrder { get; set; }

        // Navigation properties
        [JsonIgnore]
        public Game? Game { get; set; }
        
        public Player? Player { get; set; }
        
        [JsonIgnore]
        public ICollection<RoundScore> RoundScores { get; set; } = new List<RoundScore>();
    }

    public class Round
    {
        public Guid Id { get; set; }
        public Guid GameId { get; set; }
        public int RoundNumber { get; set; }
        public int CardsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsCompleted { get; set; }

        // Navigation properties
        [JsonIgnore]
        public Game? Game { get; set; }
        
        public ICollection<RoundScore> RoundScores { get; set; } = new List<RoundScore>();
    }

    public class RoundScore
    {
        public Guid Id { get; set; }
        public Guid RoundId { get; set; }
        public Guid GamePlayerId { get; set; }
        public int PredictedTricks { get; set; }
        public int? ActualTricks { get; set; }
        public int? Points { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [JsonIgnore]
        public Round? Round { get; set; }
        
        public GamePlayer? GamePlayer { get; set; }
    }
}
