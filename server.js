const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // make sure this file exists in your project root

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://urinals-4ee75-default-rtdb.firebaseio.com"
  });
}

// initialize admin sdk
const database = admin.database();

const app = express();
const PORT = process.env.PORT || 5001;

// Enhanced CORS middleware to handle cross-origin requests
app.use(cors({
  origin: [process.env.CLIENT_URL, 'https://www.knowwheretopee.com', 'https://knowwheretopee.com', 'http://knowwheretopee.com', 'http://www.knowwheretopee.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// // Debug middleware to log all requests
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   console.log('Request body:', req.body);
//   next();
// });

// Test endpoint to verify server is working
app.get('/api/ping', (req, res) => {
  console.log('Ping received');
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// GET /api/leaderboard - Get the leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard data from Firebase...');

    if (!database) {
      console.error('Database not initialized');
      return res.status(500).json({
        message: 'Database not initialized',
        details: 'Firebase database connection is not available'
      });
    }

    const bestScoresRef = database.ref('bestScores');

    try {
      const snapshot = await bestScoresRef.once('value');

      let leaderboard = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        // console.log('Raw best scores data:', data);
        leaderboard = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        leaderboard.sort((a, b) => b.score - a.score);
      } else {
        console.log('No leaderboard data found');
      }

      // console.log(`Returning leaderboard with ${leaderboard.length} entries`);
      res.json({ leaderboard });
    } catch (dbError) {
      // console.error('Firebase error getting leaderboard:', dbError);
      res.status(500).json({
        message: 'Database error',
        details: dbError.message || 'Error accessing Firebase database'
      });
    }
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      message: 'Server error',
      details: error.toString()
    });
  }
});

// POST /api/leaderboard - Update a user's score
app.post('/api/leaderboard', async (req, res) => {
  try {
    const { userName, score } = req.body;
    console.log(`Updating score for ${userName}: ${score}`);

    if (!userName || score === undefined) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'userName and score are required',
        details: 'Both userName and score must be provided in the request body'
      });
    }

    if (userName.startsWith('Guest')) {
      console.log('Guest user, not saving score to leaderboard');
      return res.json({
        message: 'Guest scores are not saved to the leaderboard',
        isNewHighScore: false,
        isGuest: true
      });
    }

    if (!database) {
      console.error('Database not initialized');
      return res.status(500).json({
        message: 'Database not initialized',
        details: 'Firebase database connection is not available'
      });
    }

    try {
      const bestScoresRef = database.ref('bestScores');
      const snapshot = await bestScoresRef.once('value');

      let userBestScore = null;
      let isNewHighScore = false;

      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const key in data) {
          if (data[key].userName === userName) {
            userBestScore = {
              id: key,
              ...data[key]
            };
            break;
          }
        }
      }

      const timestamp = new Date().toISOString();

      if (userBestScore) {
        // console.log(`Found existing best score for ${userName}: ${userBestScore.score}`);
        if (score > userBestScore.score) {
          isNewHighScore = true;
          console.log(`New high score for ${userName}: ${score} (previous: ${userBestScore.score})`);
          await database.ref(`bestScores/${userBestScore.id}`).set({
            userName,
            score,
            updatedAt: timestamp,
            createdAt: userBestScore.createdAt,
            gamesPlayed: (userBestScore.gamesPlayed || 0) + 1
          });
          console.log('Updated best score');
        } else {
          console.log(`Score not higher than best (${userBestScore.score}), just updating games played`);
          await database.ref(`bestScores/${userBestScore.id}`).set({
            userName,
            score: userBestScore.score,
            updatedAt: timestamp,
            createdAt: userBestScore.createdAt,
            gamesPlayed: (userBestScore.gamesPlayed || 0) + 1
          });
          // console.log('Updated games played count');
        }
      } else {
        isNewHighScore = true;
        console.log(`First score for ${userName}: ${score}`);
        const newScoreRef = database.ref('bestScores').push();
        await newScoreRef.set({
          userName,
          score,
          createdAt: timestamp,
          updatedAt: timestamp,
          gamesPlayed: 1
        });
        console.log('Created new best score entry');
      }

      const gameHistoryRef = database.ref('gameHistory').push();
      await gameHistoryRef.set({
        userName,
        score,
        playedAt: timestamp,
        isHighScore: isNewHighScore
      });
      console.log('Added game to history');

      res.json({
        message: 'Score processed successfully',
        isNewHighScore,
        isGuest: false
      });
    } catch (dbError) {
      console.error('Error updating score:', dbError);
      res.status(500).json({
        message: 'Database error',
        details: dbError.message || 'Error accessing Firebase database'
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({
      message: 'Server error',
      details: error.toString()
    });
  }
});

// GET /api/user-stats/:userName - Get user stats
app.get('/api/user-stats/:userName', async (req, res) => {
  try {
    const { userName } = req.params;
    console.log(`Getting stats for user: ${userName}`);

    if (userName.startsWith('Guest')) {
      console.log('Guest user, returning default stats');
      return res.json({
        highScore: 0,
        totalGames: 0,
        percentile: null,
        rank: null,
        isGuest: true
      });
    }

    if (!database) {
      console.error('Database not initialized');
      return res.status(500).json({
        message: 'Database not initialized',
        details: 'Firebase database connection is not available'
      });
    }

    try {
      const bestScoresRef = database.ref('bestScores');
      const snapshot = await bestScoresRef.once('value');

      if (!snapshot.exists()) {
        console.log('No leaderboard entries found');
        return res.json({
          highScore: 0,
          totalGames: 0,
          percentile: null,
          rank: null,
          isGuest: false
        });
      }

      const data = snapshot.val();
      const allScores = [];
      let userScore = null;

      for (const key in data) {
        const entry = {
          id: key,
          ...data[key]
        };
        allScores.push(entry);
        if (entry.userName === userName) {
          userScore = entry;
        }
      }

      console.log(`Found ${allScores.length} total scores`);

      if (!userScore) {
        console.log('No entries found for user');
        return res.json({
          highScore: 0,
          totalGames: 0,
          percentile: null,
          rank: null,
          isGuest: false
        });
      }

      console.log(`User's best score: ${userScore.score}, Games played: ${userScore.gamesPlayed || 0}`);

      const sortedScores = [...allScores].sort((a, b) => b.score - a.score);
      const userRank = sortedScores.findIndex(entry => entry.id === userScore.id) + 1;
      console.log(`User's rank: ${userRank} of ${sortedScores.length}`);
      const percentile = Math.round((1 - ((userRank - 1) / sortedScores.length)) * 100);
      console.log(`User's percentile: ${percentile}`);

      res.json({
        highScore: userScore.score,
        totalGames: userScore.gamesPlayed || 0,
        percentile,
        rank: userRank,
        isGuest: false
      });
    } catch (dbError) {
      console.error('Firebase error getting user stats:', dbError);
      res.status(500).json({
        message: 'Database error',
        details: dbError.message || 'Error accessing Firebase database'
      });
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      message: 'Server error',
      details: error.toString()
    });
  }
});

// GET /api/current-rank/:score - Get rank for a given score
app.get('/api/current-rank/:score', async (req, res) => {
  try {
    const score = parseInt(req.params.score);

    if (isNaN(score)) {
      return res.status(400).json({
        message: 'Invalid score parameter',
        details: 'Score must be a valid number'
      });
    }

    // console.log(`Calculating rank for score: ${score}`);

    if (!database) {
      console.error('Database not initialized');
      return res.status(500).json({
        message: 'Database not initialized',
        details: 'Firebase database connection is not available'
      });
    }

    try {
      const bestScoresRef = database.ref('bestScores');
      const snapshot = await bestScoresRef.once('value');

      if (!snapshot.exists()) {
        // console.log('No leaderboard entries found');
        return res.json({
          rank: 1,
          percentile: 100,
          totalPlayers: 0
        });
      }

      const data = snapshot.val();
      const allScores = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));

      // console.log(`Found ${allScores.length} total scores`);

      const sortedScores = [...allScores].sort((a, b) => b.score - a.score);
      let rank = sortedScores.findIndex(entry => entry.score < score) + 1;
      if (rank === 0) {
        rank = sortedScores.length + 1;
      }

      console.log(`Rank for score ${score}: ${rank} of ${sortedScores.length + 1}`);
      const percentile = Math.round((1 - ((rank - 1) / (sortedScores.length + 1))) * 100);
      console.log(`Percentile: ${percentile}`);

      res.json({
        rank,
        percentile,
        totalPlayers: sortedScores.length
      });
    } catch (dbError) {
      console.error('Firebase error calculating rank:', dbError);
      res.status(500).json({
        message: 'Database error',
        details: dbError.message || 'Error accessing Firebase database'
      });
    }
  } catch (error) {
    console.error('Error calculating rank:', error);
    res.status(500).json({
      message: 'Server error',
      details: error.toString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    details: err.message || 'An unexpected error occurred'
  });
});

// Production static assets
app.use(express.static("./client/dist"));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app; // For testing purposes
