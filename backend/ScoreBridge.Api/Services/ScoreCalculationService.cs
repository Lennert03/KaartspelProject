using System;

namespace ScoreBridge.Api.Services
{
    public interface IScoreCalculationService
    {
        /// <summary>
        /// Calculates points earned by a player for a round.
        /// </summary>
        /// <param name="predictedTricks">Number of tricks predicted by the player.</param>
        /// <param name="actualTricks">Number of tricks actually won by the player.</param>
        /// <returns>Calculated points.</returns>
        int CalculatePoints(int predictedTricks, int actualTricks);
    }

    public class ScoreCalculationService : IScoreCalculationService
    {
        public int CalculatePoints(int predictedTricks, int actualTricks)
        {
            if (predictedTricks < 0)
                throw new ArgumentException("Predicted tricks cannot be negative.", nameof(predictedTricks));
            if (actualTricks < 0)
                throw new ArgumentException("Actual tricks cannot be negative.", nameof(actualTricks));

            if (predictedTricks == actualTricks)
            {
                // If prediction matches actual tricks: points = 10 + actual
                return 10 + actualTricks;
            }
            else
            {
                // If prediction does not match: points = -abs(predicted - actual)
                return -Math.Abs(predictedTricks - actualTricks);
            }
        }
    }
}
