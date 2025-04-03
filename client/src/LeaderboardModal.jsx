import React, { useState, useEffect } from 'react';
import './LeaderboardModal.css';

// Define API base URL - adjust this to match your server location
const API_BASE_URL = import.meta.env.VITE_SERVER_URL; // Change this if your server is on a different port/domain

// Added: Rank data for the info tooltip
const RANK_INFO = [
  { percentile: 99, name: "Urinal Whisperer" },
  { percentile: 95, name: "Personal Space Savant" },
  { percentile: 90, name: "Bathroom Etiquette Professor" },
  { percentile: 85, name: "Social Distance Champion" },
  { percentile: 80, name: "Urinal Chess Grandmaster" },
  { percentile: 75, name: "Peeing Professional" },
  { percentile: 70, name: "Men's Room Mastermind" },
  { percentile: 65, name: "Comfort Zone Connoisseur" },
  { percentile: 60, name: "Privacy Protocol Officer" },
  { percentile: 55, name: "Stall Selection Strategist" },
  { percentile: 50, name: "Middle Urinal Avoider" },
  { percentile: 45, name: "Restroom Rules Follower" },
  { percentile: 40, name: "Respectable Restroom User" },
  { percentile: 35, name: "Public Bathroom Survivor" },
  { percentile: 30, name: "Awkward Bathroom Navigator" },
  { percentile: 25, name: "Urinal Placement Padawan" },
  { percentile: 20, name: "Personal Space Trainee" },
  { percentile: 15, name: "Bathroom Code Learner" },
  { percentile: 10, name: "Eye Contact Maker" },
  { percentile: 5, name: "Urinal Small Talker" },
  { percentile: 0, name: "Small Bladder Energy" }
];

// Added: Special rank cases
const SPECIAL_RANKS = [
  { condition: "score === 0", description: "Score is exactly 0", name: "Bathroom Anxiety Master" },
  { condition: "score >= 60", description: "Score is 60 or higher", name: "Urinal Etiquette Legend" }
];

const LeaderboardModal = ({ isOpen, onClose, currentScore, userName = "Guest", isGuest = false }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [rankName, setRankName] = useState('');
  const [isHighScore, setIsHighScore] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [serverStatus, setServerStatus] = useState("unknown");
  const [currentRank, setCurrentRank] = useState(null);
  // Added: State for showing the rank info tooltip
  const [showRankInfo, setShowRankInfo] = useState(false);
  // Added: State for showing the full leaderboard
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  // Added: Current user's best entry from the leaderboard
  const [userBestEntry, setUserBestEntry] = useState(null);
  // Added: User's position in the global leaderboard
  const [userPosition, setUserPosition] = useState(null);

  // Fetch leaderboard data and update if necessary when modal opens
  useEffect(() => {
    if (isOpen) {
      checkServerStatus();
      fetchLeaderboardAndUpdateScore();
    }
  }, [isOpen, currentScore]);

  // Check if server is running
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ping`);
      if (response.ok) {
        const data = await response.json();
        console.log("Server status:", data);
        setServerStatus("online");
      } else {
        console.error("Server ping failed:", response.status);
        setServerStatus("error");
      }
    } catch (err) {
      console.error("Server ping error:", err);
      setServerStatus("offline");
    }
  };

  const fetchLeaderboardAndUpdateScore = async () => {
    setLoading(true);
    setError(null);
    setScoreSubmitted(false);
    // Reset state
    setIsHighScore(false);
    setShowRankInfo(false);
    setShowFullLeaderboard(false);
    setUserBestEntry(null);
    setUserPosition(null);

    try {
      // First, get current rank for this score (works for guests and logged-in users)
      if (currentScore > 0) {
        await fetchCurrentRank();
      }

      // Then update the user's score if needed (only for logged-in users)
      if (!isGuest && currentScore > 0) {
        console.log("Updating user score for:", userName, "Score:", currentScore);
        const updateResponse = await updateUserScore();
        console.log("Update response:", updateResponse);

        if (updateResponse && updateResponse.isNewHighScore) {
          setIsHighScore(true);
          setScoreSubmitted(true);
        }
      }

      // Then fetch the updated leaderboard (for all users)
      console.log("Fetching leaderboard...");
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);

      if (!response.ok) {
        console.error("Leaderboard fetch failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Leaderboard data:", data);
      setLeaderboard(data.leaderboard || []);

      // Find the current user's entry and position in the leaderboard
      if (!isGuest && data.leaderboard && data.leaderboard.length > 0) {
        const userEntry = data.leaderboard.find(entry => entry.userName === userName);
        const userPos = data.leaderboard.findIndex(entry => entry.userName === userName);

        if (userEntry) {
          setUserBestEntry(userEntry);
          setUserPosition(userPos + 1); // +1 because array is 0-indexed
        }
      }

      // Fetch user stats for logged-in users
      if (!isGuest) {
        await fetchUserStats();
      }

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(`Could not load leaderboard. ${err.message}. Server status: ${serverStatus}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentRank = async () => {
    try {
      console.log("Fetching current rank for score:", currentScore);
      const response = await fetch(`${API_BASE_URL}/api/current-rank/${currentScore}`);

      if (!response.ok) {
        console.error("Current rank fetch failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to fetch current rank');
      }

      const data = await response.json();
      console.log("Current rank data:", data);
      setCurrentRank(data);

      // Set percentile and rank for display
      setUserRank(data.rank);
      setPercentile(data.percentile);

      // Set rank name based on percentile
      setRankName(getRankName(data.percentile, currentScore));

    } catch (err) {
      console.error('Error fetching current rank:', err);
      // Continue even if current rank fetch fails
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log("Fetching user stats for:", userName);
      const response = await fetch(`${API_BASE_URL}/api/user-stats/${encodeURIComponent(userName)}`);

      if (!response.ok) {
        console.error("User stats fetch failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();
      console.log("User stats:", data);
      setUserStats(data);

    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Continue even if stats fetch fails
    }
  };

  const updateUserScore = async () => {
    try {
      console.log("POST request to:", `${API_BASE_URL}/api/leaderboard`);
      console.log("Request body:", JSON.stringify({
        userName,
        score: currentScore,
      }));

      const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          score: currentScore,
        }),
      });

      if (!response.ok) {
        console.error("Score update failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to update score');
      }

      return await response.json();
    } catch (err) {
      console.error('Error updating score:', err);
      // We'll still try to fetch the leaderboard even if update fails
      return null;
    }
  };

  const getRankName = (percentileValue, score) => {
    // Special case for zero score
    if (score === 0) return "Bathroom Anxiety Master";

    // Special case for top score
    if (score >= 60) return "Urinal Etiquette Legend";

    // Base ranks on percentile
    if (percentileValue >= 99) return "Urinal Whisperer";
    if (percentileValue >= 95) return "Personal Space Savant";
    if (percentileValue >= 90) return "Bathroom Etiquette Professor";
    if (percentileValue >= 85) return "Social Distance Champion";
    if (percentileValue >= 80) return "Urinal Chess Grandmaster";
    if (percentileValue >= 75) return "Peeing Professional";
    if (percentileValue >= 70) return "Men's Room Mastermind";
    if (percentileValue >= 65) return "Comfort Zone Connoisseur";
    if (percentileValue >= 60) return "Privacy Protocol Officer";
    if (percentileValue >= 55) return "Stall Selection Strategist";
    if (percentileValue >= 50) return "Middle Urinal Avoider";
    if (percentileValue >= 45) return "Restroom Rules Follower";
    if (percentileValue >= 40) return "Respectable Restroom User";
    if (percentileValue >= 35) return "Public Bathroom Survivor";
    if (percentileValue >= 30) return "Awkward Bathroom Navigator";
    if (percentileValue >= 25) return "Urinal Placement Padawan";
    if (percentileValue >= 20) return "Personal Space Trainee";
    if (percentileValue >= 15) return "Bathroom Code Learner";
    if (percentileValue >= 10) return "Eye Contact Maker";
    if (percentileValue >= 5) return "Urinal Small Talker";

    return "Small Bladder Energy";
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Results copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy results. Please try again.');
      });
  };

  // Toggle the rank info tooltip
  const toggleRankInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRankInfo(!showRankInfo);
    // Close the other popup if open
    if (showFullLeaderboard) setShowFullLeaderboard(false);
  };

  // Toggle the full leaderboard popup
  const toggleFullLeaderboard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullLeaderboard(!showFullLeaderboard);
    // Close the other popup if open
    if (showRankInfo) setShowRankInfo(false);
  };

  // Close both popups
  const closeAllPopups = () => {
    setShowRankInfo(false);
    setShowFullLeaderboard(false);
  };

  // Handle modal close
  const handleClose = () => {
    setIsHighScore(false);
    closeAllPopups();
    onClose();
  };

  // Function to check if a rank is the current user's rank
  const isCurrentRank = (name) => {
    return name === rankName;
  };

  // Check if the current user is in the top 3
  const isUserInTop3 = () => {
    if (isGuest || !userPosition) return false;
    return userPosition <= 3;
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal">
        <button className="close-button" onClick={handleClose}>×</button>

        <h2 className="leaderboard-title">Did You Cook?</h2>

        {loading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            {isGuest && (
              <div className="guest-alert">
                <span className="guest-icon">👋</span>
                Playing as guest - score not saved to leaderboard
              </div>
            )}

            {isHighScore && !isGuest && (
              <div className="high-score-alert">
                <span className="high-score-icon">🏆</span>
                New personal best!
              </div>
            )}

            <div className="user-stats">
              <h3 className="your-score">Your Score: <span className="score-value">{currentScore}</span></h3>

              {/* Current attempt stats */}
              {currentRank && (
                <div className="current-score-stats">
                  <h4>Current Attempt</h4>
                  <p className="rank">Rank: <strong>#{currentRank.rank} of {currentRank.totalPlayers + 1} players</strong> (including guest)</p>
                  <p className="percentile">Top {currentRank.percentile}% of all scores</p>

                  {/* Rank name with info icon */}
                  <div className="rank-name-container">
                    <p className="rank-name">{rankName}</p>
                    <button
                      className="rank-info-button"
                      onClick={toggleRankInfo}
                      aria-label="Show rank information"
                    >
                      ?
                    </button>

                    {/* Rank info tooltip */}
                    {showRankInfo && (
                      <div className="rank-info-popup">
                        <div className="popup-header">
                          <h4>Bathroom Ranks</h4>
                          <button className="popup-close" onClick={closeAllPopups}>×</button>
                        </div>

                        <div className="rank-info-section">
                          <h5>Special Ranks</h5>
                          <ul className="rank-list">
                            {SPECIAL_RANKS.map((rank, index) => (
                              <li
                                key={`special-${index}`}
                                className={isCurrentRank(rank.name) ? 'current-rank' : ''}
                              >
                                <span className="rank-name-info">{rank.name}</span>
                                <span className="rank-criteria">{rank.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rank-info-section">
                          <h5>Percentile Ranks</h5>
                          <ul className="rank-list">
                            {RANK_INFO.map((rank, index) => (
                              <li
                                key={`percentile-${index}`}
                                className={isCurrentRank(rank.name) ? 'current-rank' : ''}
                              >
                                <span className="rank-name-info">{rank.name}</span>
                                <span className="rank-criteria">
                                  {index === RANK_INFO.length - 1
                                    ? `Below 5th percentile`
                                    : `${rank.percentile}${getOrdinalSuffix(rank.percentile)} percentile and above`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Logged-in user personal stats */}
              {!isGuest && userStats && (
                <div className="personal-stats">
                  <h4>Personal Stats</h4>
                  <div className="stats-grid">
                    <div className="stats-item">
                      <span className="stats-label">Personal Best:</span>
                      <span className="stats-value highlight">{userStats.highScore}</span>
                    </div>
                    <div className="stats-item">
                      <span className="stats-label">Total Games:</span>
                      <span className="stats-value highlight">{userStats.totalGames}</span>
                    </div>
                    <div className="stats-item">
                      <span className="stats-label">Best Rank:</span>
                      <span className="stats-value highlight">#{userStats.rank}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="leaderboard-container">
              <h3>Global Leaderboard</h3>


              {leaderboard.length === 0 ? (
                <p className="no-scores">No scores yet. You could be the first!</p>
              ) : (
                <div className="leaderboard-wrapper">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Top 3 entries */}
                      {leaderboard.slice(0, 3).map((entry, index) => (
                        <tr
                          key={`top-${index}`}
                          className={
                            entry.userName === userName
                              ? 'current-user'
                              : ''
                          }
                        >
                          <td className={`rank-cell rank-${index + 1}`}>
                            {index === 0 && <span className="rank-medal gold">🥇</span>}
                            {index === 1 && <span className="rank-medal silver">🥈</span>}
                            {index === 2 && <span className="rank-medal bronze">🥉</span>}
                            #{index + 1}
                          </td>
                          <td>{entry.userName}</td>
                          <td>{entry.score}</td>
                          {/* <td>{entry.gamesPlayed || 1}</td> */}
                          {entry.userName === userName ? (
                          <td className="games-cell">
                            {userBestEntry?.gamesPlayed || entry.gamesPlayed || 1}
                            <button
                              className="leaderboard-info-button"
                              onClick={toggleFullLeaderboard}
                              aria-label="Show full leaderboard"
                            >
                              ?
                            </button>
                          </td>
                        ) : (
                          <td>{entry.gamesPlayed || 1}</td>
                        )}
                        </tr>
                      ))}

                      {/* Current user row (if not in top 3) */}
                      {!isGuest && userBestEntry && !isUserInTop3() && (
                        <tr className="current-user user-position-row">
                          <td className="rank-cell">
                            <span className="you-badge">YOU</span>
                            #{userPosition}
                          </td>
                          <td>{userBestEntry.userName}</td>
                          <td>{userBestEntry.score}</td>
                          <td className="games-cell">
                            {userBestEntry.gamesPlayed || 1}
                            <button
                              className="leaderboard-info-button"
                              onClick={toggleFullLeaderboard}
                              aria-label="Show full leaderboard"
                            >
                              ?
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Full Leaderboard Popup */}
                  {showFullLeaderboard && (
                    <div className="full-leaderboard-popup">
                      <div className="popup-header">
                        <h4>Complete Leaderboard</h4>
                        <button className="popup-close" onClick={closeAllPopups}>×</button>
                      </div>

                      <div className="full-leaderboard-content">
                        <table className="full-leaderboard-table">
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Player</th>
                              <th>Score</th>
                              <th>Games</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboard.map((entry, index) => (
                              <tr
                                key={`full-${index}`}
                                className={
                                  entry.userName === userName
                                    ? 'current-user'
                                    : ''
                                }
                              >
                                <td className={`rank-cell ${index < 3 ? `rank-${index + 1}` : ''}`}>
                                  {index === 0 && <span className="rank-medal gold">🥇</span>}
                                  {index === 1 && <span className="rank-medal silver">🥈</span>}
                                  {index === 2 && <span className="rank-medal bronze">🥉</span>}
                                  #{index + 1}
                                </td>
                                <td>{entry.userName}</td>
                                <td>{entry.score}</td>
                                <td>{entry.gamesPlayed || 1}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {serverStatus === "offline" && (
              <div className="server-error">
                <p>Server connection issue. Scores can't be saved at this time.</p>
              </div>
            )}

            {isGuest && (
              <div className="guest-message">
                <p>Want to save your scores? <a href="#" onClick={() => handleClose()}>Log in or create an account</a> to join the global leaderboard!</p>
              </div>
            )}

            {!isGuest && !isHighScore && currentScore > 0 && (
              <div className="score-status">
                <p>Your personal best is {userStats?.highScore || 0}. Keep playing to improve your rank!</p>
              </div>
            )}

            <div className="leaderboard-buttons">
              <button
                className="share-leaderboard-button"
                onClick={() => {
                  // Prepare more detailed share text based on available stats
                  let shareText = `I scored ${currentScore} points in "Only Real Men Know Where to Pee"`;

                  // Add rank info if available
                  if (rankName) {
                    shareText += ` and earned the rank "${rankName}"!`;
                  } else {
                    shareText += `!`;
                  }

                  // Add percentile if available
                  if (currentRank && currentRank.percentile) {
                    shareText += ` Top ${currentRank.percentile}% of all players.`;
                  }

                  // Add personal achievement context if user is logged in
                  if (!isGuest && userStats) {
                    // If this is a personal best or close
                    if (isHighScore) {
                      shareText += ` 🏆 That's my new personal best!`;
                    } else if (currentScore > userStats.highScore * 0.8) { // If score is at least 80% of personal best
                      shareText += ` Getting closer to my personal best of ${userStats.highScore}!`;
                    }

                    // If they have a significant number of games
                    if (userStats.totalGames > 10) {
                      shareText += ` I've played ${userStats.totalGames} games so far.`;
                    }
                  }

                  // Add challenge and URL
                  shareText += ` Think you know urinal etiquette? Try to beat my score!`;

                  // Try Web Share API first
                  if (navigator.share) {
                    navigator.share({
                      title: 'My Urinal Game Stats',
                      text: shareText,
                      url: window.location.href,
                    })
                    .then(() => {
                      // Successfully shared
                      console.log('Successfully shared results');
                    })
                    .catch(error => {
                      console.error('Error sharing:', error);
                      // Fallback to clipboard
                      copyToClipboard(shareText);
                    });
                  } else {
                    // Fallback to clipboard
                    copyToClipboard(shareText);
                  }
                }}
              >
                Share Results
              </button>
              <button className="close-leaderboard-button" onClick={handleClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to add ordinal suffixes (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num) {
  const j = num % 10,
        k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

export default LeaderboardModal;