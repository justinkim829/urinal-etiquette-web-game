import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import LeaderboardModal from './LeaderboardModal';

// Import Firebase app instance
import firebaseApp from './firebase';

// Import Firebase auth functions AFTER importing the app
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

import { getDatabase, ref, get, set } from "firebase/database";

// Import your mp3 files (assumes they're in ./assets)
import homeMusicFile from './assets/homeMusic.mp3';
import gameMusicFile from './assets/gameMusic.mp3';
import clickSoundFile from './assets/clickSound.mp3';
// import { getFunctions, httpsCallable } from "firebase/functions";

// // Initialize functions using your firebaseApp (from firebase.js)
// const functions = getFunctions(firebaseApp);
// const checkDisplayName = httpsCallable(functions, 'checkDisplayName');

// Initialize Firebase Auth with our app instance
const auth = getAuth(firebaseApp);

// SVG Icons components
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47 1-1.05 1H8"></path>
    <path d="M14 14.66V17c0 .55.47 1 1.05 1H16"></path>
    <path d="M12 16v6"></path>
    <path d="M8 6h8v8a4 4 0 0 1-8 0V6z"></path>
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const LoginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// New: Sound control icons for mute/unmute button
const SoundOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const SoundOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

// New: Flush handle icon for urinals
const FlushIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="#a0a0a0" />
    <circle cx="12" cy="12" r="6" fill="#c0c0c0" />
    <rect x="11" y="7" width="2" height="10" rx="1" fill="#808080" />
  </svg>
);

// New: Water drop icon for animation effects
const WaterDropIcon = ({ size = 8, opacity = 0.7 }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg" opacity={opacity}>
    <path d="M4 0C4 0 0 4 0 8C0 10.2 1.8 12 4 12C6.2 12 8 10.2 8 8C8 4 4 0 4 0Z" fill="#95c2db" />
  </svg>
);

// New: Leaderboard icon for the homepage button
const LeaderboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="18" y="3" width="4" height="18"></rect>
    <rect x="10" y="8" width="4" height="13"></rect>
    <rect x="2" y="13" width="4" height="8"></rect>
  </svg>
);

const UrinalGame = () => {
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds game time
  const [score, setScore] = useState({ correct: 0, blocked: 0 });
  const [urinals, setUrinals] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [canWait, setCanWait] = useState(false);
  const [pushCounter, setPushCounter] = useState(0); // Track how many times user pushed someone
  const [validUrinalSpots, setValidUrinalSpots] = useState([]);
  const [hoveredUrinal, setHoveredUrinal] = useState(null); // For hover effects

  // New: Review phase state
  const [inReviewPhase, setInReviewPhase] = useState(false);

  // New: Sound control state
  const [isMuted, setIsMuted] = useState(false);

  // Audio refs for background and click sounds
  const homeMusicRef = useRef(new Audio(homeMusicFile));
  const gameMusicRef = useRef(new Audio(gameMusicFile));
  const clickSoundRef = useRef(new Audio(clickSoundFile));

  // Auth state
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // UI state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authError, setAuthError] = useState(null);

  // Form refs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const displayNameRef = useRef(null);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Constants
  const URINAL_COUNT = 9;
  const BLOCK_DURATION = 3;
  const REVIEW_DURATION = 2500; // 2.5 seconds for review phase

  // Funny messages for pushing someone - UPDATED: Removed "Blocked for 3 seconds"
  const pushMessages = [
    "You are now a certified asshole!",
    "Bold move! Everyone's judging you now.",
    "Social etiquette has left the chat.",
    "That's how you make enemies in bathrooms!",
    "Congratulations! You're that guy everyone avoids."
  ];

  // Special messages for repeat pushers - UPDATED: Removed "Blocked for 3 seconds"
  const repeatedPushMessages = [
    "Serial pusher alert!",
    "You REALLY enjoy chaos, don't you?",
    "Bathroom terrorist spotted!",
    "Your bathroom karma is terrible now.",
    "Are you the urinal police??"
  ];

  // Set up audio settings - volume 50% and looping
  useEffect(() => {
    // Set volume to 50%
    homeMusicRef.current.volume = 0.3;
    gameMusicRef.current.volume = 0.3;
    clickSoundRef.current.volume = 0.3;

    // Set looping
    homeMusicRef.current.loop = true;
    gameMusicRef.current.loop = true;
  }, []);

  // Handle mute toggle
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    homeMusicRef.current.muted = newMutedState;
    gameMusicRef.current.muted = newMutedState;
    clickSoundRef.current.muted = newMutedState;
  };

  // Listen for the first user interaction to start home music (resolves NotAllowedError)
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!gameActive && homeMusicRef.current.paused) {
        homeMusicRef.current.play().catch(err => console.error("Home music play error:", err));
      }
      document.removeEventListener('click', handleUserInteraction);
    };
    document.addEventListener('click', handleUserInteraction);
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [gameActive]);

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized");
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("User logged in:", currentUser.email);
        setUser(currentUser);
        setDisplayName(currentUser.displayName || currentUser.email.split('@')[0]);
        setIsGuest(false);
      } else {
        console.log("No user logged in");
        setUser(null);
        setDisplayName("");
      }
    });

    return () => unsubscribe();
  }, []);


  // Switch background music based on game state changes
  useEffect(() => {
    if (gameActive && !gameOver) {
      // When game is active, ensure home music is stopped and game music plays
      homeMusicRef.current.pause();
      gameMusicRef.current.currentTime = 0;
      gameMusicRef.current.play().catch((err) => console.error("Game music play error:", err));
    } else {
      // When on home screen or game over, stop game music and play home music
      gameMusicRef.current.pause();
      homeMusicRef.current.currentTime = 0;
      homeMusicRef.current.play().catch((err) => console.error("Home music play error:", err));
    }
  }, [gameActive, gameOver]);

  // Determine valid urinal choices based on the refined algorithm
  const findValidUrinalChoices = useCallback((urinalLayout) => {
    // Phase 1: Identify all empty positions and classify by neighbor count
    const emptyPositions = [];
    const positionsByNeighborCount = {
      0: [], // positions with zero occupied neighbors
      1: [], // positions with one occupied neighbor
      2: []  // positions with two occupied neighbors
    };

    for (let i = 0; i < urinalLayout.length; i++) {
      if (urinalLayout[i] === 'empty') {
        emptyPositions.push(i);

        // Count occupied neighbors
        let occupiedNeighborCount = 0;
        const leftNeighbor = i > 0 ? urinalLayout[i-1] : null;
        const rightNeighbor = i < urinalLayout.length-1 ? urinalLayout[i+1] : null;

        if (leftNeighbor === 'taken') occupiedNeighborCount++;
        if (rightNeighbor === 'taken') occupiedNeighborCount++;

        positionsByNeighborCount[occupiedNeighborCount].push(i);
      }
    }

    // Phase 2: No empty spots? Return wait instruction
    if (emptyPositions.length === 0) {
      return { validSpots: [], shouldWait: true };
    }

    // Phase 3: Get positions with minimum number of neighbors
    let candidatePositions = [];
    if (positionsByNeighborCount[0].length > 0) {
      candidatePositions = positionsByNeighborCount[0];
    } else if (positionsByNeighborCount[1].length > 0) {
      candidatePositions = positionsByNeighborCount[1];
    } else {
      candidatePositions = positionsByNeighborCount[2];
    }

    // If only one candidate or no zero-neighbor positions, return all candidates
    if (candidatePositions.length === 1 || positionsByNeighborCount[0].length === 0) {
      return { validSpots: candidatePositions, shouldWait: false };
    }

    // Phase 4: Future impact analysis (only for zero-neighbor positions)
    const futureImpactAnalysis = [];

    for (const position of candidatePositions) {
      // Simulate choosing this position
      const simulatedLayout = [...urinalLayout];
      simulatedLayout[position] = 'taken';

      // Count zero-neighbor positions for next user
      const futureZeroNeighborPositions = [];
      for (let i = 0; i < simulatedLayout.length; i++) {
        if (simulatedLayout[i] === 'empty') {
          const leftNeighbor = i > 0 ? simulatedLayout[i-1] : null;
          const rightNeighbor = i < simulatedLayout.length-1 ? simulatedLayout[i+1] : null;

          if ((!leftNeighbor || leftNeighbor === 'empty') &&
              (!rightNeighbor || rightNeighbor === 'empty')) {
            futureZeroNeighborPositions.push(i);
          }
        }
      }

      // Further analysis: how good are the options for the third user
      let bestThirdUserOptions = 0;

      if (futureZeroNeighborPositions.length > 0) {
        for (const futurePosition of futureZeroNeighborPositions) {
          const thirdLayout = [...simulatedLayout];
          thirdLayout[futurePosition] = 'taken';

          let thirdUserZeroNeighbors = 0;
          for (let i = 0; i < thirdLayout.length; i++) {
            if (thirdLayout[i] === 'empty') {
              const leftNeighbor = i > 0 ? thirdLayout[i-1] : null;
              const rightNeighbor = i < thirdLayout.length-1 ? thirdLayout[i+1] : null;

              if ((!leftNeighbor || leftNeighbor === 'empty') &&
                  (!rightNeighbor || rightNeighbor === 'empty')) {
                thirdUserZeroNeighbors++;
              }
            }
          }

          if (thirdUserZeroNeighbors > bestThirdUserOptions) {
            bestThirdUserOptions = thirdUserZeroNeighbors;
          }
        }
      }

      futureImpactAnalysis.push({
        position,
        futureZeroNeighborCount: futureZeroNeighborPositions.length,
        bestThirdUserOptions,
        distanceFromEdge: Math.min(position, urinalLayout.length - 1 - position)
      });
    }

    // Sort by future impact metrics
    futureImpactAnalysis.sort((a, b) => {
      if (a.futureZeroNeighborCount !== b.futureZeroNeighborCount) {
        return b.futureZeroNeighborCount - a.futureZeroNeighborCount;
      }
      if (a.bestThirdUserOptions !== b.bestThirdUserOptions) {
        return b.bestThirdUserOptions - a.bestThirdUserOptions;
      }
      return a.distanceFromEdge - b.distanceFromEdge;
    });

    const bestFutureZeroNeighborCount = futureImpactAnalysis[0].futureZeroNeighborCount;
    const bestThirdUserOptions = futureImpactAnalysis[0].bestThirdUserOptions;

    const validPositions = futureImpactAnalysis
      .filter(analysis =>
        analysis.futureZeroNeighborCount === bestFutureZeroNeighborCount &&
        analysis.bestThirdUserOptions === bestThirdUserOptions
      )
      .map(analysis => analysis.position);

    return { validSpots: validPositions, shouldWait: false };
  }, []);

  // Generate a new urinal configuration
  const generateUrinals = useCallback(() => {
    const newUrinals = Array(URINAL_COUNT).fill('empty');

    // Randomly occupy 3-9 urinals
    const occupiedCount = Math.floor(Math.random() * 7) + 2; // 2 to 9
    const positions = [];

    while (positions.length < occupiedCount) {
      const pos = Math.floor(Math.random() * URINAL_COUNT);
      if (!positions.includes(pos)) {
        positions.push(pos);
        newUrinals[pos] = 'taken';
      }
    }

    const { validSpots, shouldWait } = findValidUrinalChoices(newUrinals);
    setValidUrinalSpots(validSpots);
    setCanWait(shouldWait);
    setUrinals(newUrinals);
  }, [findValidUrinalChoices]);

  // Start the game (resets state and restarts game music)
  const startGame = () => {
    // Restart game music from the beginning
    if (gameMusicRef.current) {
      gameMusicRef.current.pause();
      gameMusicRef.current.currentTime = 0;
      gameMusicRef.current.play().catch(err => console.error("Game music play error:", err));
    }
    // Pause home music so only game music plays
    if (homeMusicRef.current) {
      homeMusicRef.current.pause();
    }
    setUrinals([]);  // Clear urinals first
    setGameActive(true);
    setGameOver(false);
    setTimeRemaining(30);
    setScore({ correct: 0, blocked: 0 });
    setTotalAnswered(0);
    setBlocked(false);
    setBlockTimer(0);
    setPushCounter(0); // Reset push counter
    setValidUrinalSpots([]);
    setHoveredUrinal(null);
    setInReviewPhase(false);
  };

  // Start game as guest
  const playAsGuest = () => {
    const guestId = `Guest${Math.floor(Math.random() * 10000)}`;
    setDisplayName(guestId);
    setIsGuest(true);
    setUser(null);
    startGame();
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!auth) {
      setAuthError("Authentication not available");
      return;
    }

    signInWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value)
      .then((userCredential) => {
        console.log("Login successful");
        setShowAuthModal(false);
        // startGame();
      })
      .catch((error) => {
        console.error("Login error:", error);
        setAuthError(error.message);
      });
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!auth) {
      setAuthError("Authentication not available");
      return;
    }

    const chosenDisplayName = displayNameRef.current.value;
    // Get a reference to the Realtime Database
    const db = getDatabase(firebaseApp);
    const usernameRef = ref(db, 'usernames/' + chosenDisplayName);

    // Check if the display name is already taken
    const snapshot = await get(usernameRef);
    if (snapshot.exists()) {
      setAuthError("Display name already taken. Please choose another one.");
      return;
    }

    // Create the user since the display name is unique
    createUserWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value)
      .then((userCredential) => {
        console.log("Signup successful, updating profile");
        return updateProfile(userCredential.user, {
          displayName: chosenDisplayName
        }).then(() => {
          // Write the new display name into the Realtime Database with the user's uid
          return set(usernameRef, userCredential.user.uid);
        }).then(() => {
          setDisplayName(chosenDisplayName);
          setShowAuthModal(false);
          startGame();
        });
      })
      .catch((error) => {
        console.error("Signup error:", error);
        setAuthError(error.message);
      });
  };

  // Handle logout
  const handleLogout = () => {
    if (!auth) {
      console.error("Authentication not available");
      return;
    }

    signOut(auth).then(() => {
      // console.log("Logout successful");
      setUser(null);
      setDisplayName("");
      setIsGuest(false);
      if (gameActive || gameOver) {
        setGameActive(false);
        setGameOver(false);
      }
    }).catch((error) => {
      console.error("Logout error:", error);
    });
  };

  // Open auth modal
  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthError(null);
    setShowAuthModal(true);
  };

  // Close auth modal
  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError(null);
  };

  // End the game
  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
  };

  // Open leaderboard
  const openLeaderboard = () => {
    setShowLeaderboard(true);
  };

  // Close leaderboard
  const closeLeaderboard = () => {
    setShowLeaderboard(false);
  };

  // Share results
  const shareResults = () => {
    const { percentile, genderGuess } = calculateResults();
    const shareText = `I scored ${score.correct} points in Only Real Men Know Where to Pee and ranked in the ${percentile}! The game says I'm "${genderGuess}". Can you beat my score?`;

    if (navigator.share) {
      navigator.share({
        title: 'My Urinal Game Score',
        text: shareText,
        url: window.location.href,
      })
      .catch(error => {
        console.log('Error sharing:', error);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showFeedback('success', 'Results copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        showFeedback('error', 'Couldn\'t copy to clipboard');
      });
  };

  // UPDATED: Handle urinal selection with click sound
  const handleUrinalClick = (index) => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch((err) => console.error("Click sound error:", err));
    }

    // Don't allow clicking during review phase or if game not active
    if (inReviewPhase || !gameActive) return;

    const urinalStatus = urinals[index];
    if (urinalStatus === 'taken') {
      showFeedback('error', "That's already occupied!");
      return;
    }

    if (validUrinalSpots.includes(index)) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      showFeedback('success', "Good choice! Maximum privacy");
      setTotalAnswered(prev => prev + 1);
      generateUrinals(); // Generate new urinals immediately for correct answers
    } else {
      // Start review phase
      setInReviewPhase(true);

      // Reduce time
      setTimeRemaining(prev => Math.max(1, prev - 2)); // Reduce time by 2 seconds, but never below 1
      setScore(prev => ({ ...prev, blocked: prev.blocked + 1 }));

      // Show feedback with information about valid spots - keep the 'error' type
      const validSpotsMessage = validUrinalSpots.length > 0
        ? `Optimal spot(s): urinal ${validUrinalSpots.map(i => i + 1).join(' or ')}`
        : "You should have waited - no good spots available!";

      showFeedback('error', `Not the best choice! ${validSpotsMessage}`);

      // Increment total answered
      setTotalAnswered(prev => prev + 1);

      // Set a timeout to generate new urinals after review phase
      setTimeout(() => {
        setInReviewPhase(false);
        generateUrinals();
      }, REVIEW_DURATION);
    }
  };

  // Urinal hover handlers
  const handleUrinalMouseEnter = (index) => {
    if (gameActive && !inReviewPhase && urinals[index] === 'empty') {
      setHoveredUrinal(index);
    }
  };

  const handleUrinalMouseLeave = () => {
    setHoveredUrinal(null);
  };

  // Similarly ensure the handleWait function keeps the error type
  const handleWait = () => {
    // Don't allow waiting during review phase or if game not active
    if (inReviewPhase || !gameActive) return;

    if (canWait) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      showFeedback('success', "Smart choice to wait!");
      setTotalAnswered(prev => prev + 1);
      generateUrinals(); // Generate new urinals immediately for correct answers
    } else {
      // Start review phase
      setInReviewPhase(true);

      // Reduce time
      setTimeRemaining(prev => Math.max(1, prev - 2)); // Reduce time by 2 seconds, but never below 1
      setScore(prev => ({ ...prev, blocked: prev.blocked + 1 }));

      const validSpotsMessage = validUrinalSpots.length > 0
        ? `Optimal spot(s): urinal ${validUrinalSpots.map(i => i + 1).join(' or ')}`
        : "There weren't any good spots (this shouldn't happen)";

      // Keep the error type for consistent styling
      showFeedback('error', `There was a good spot! ${validSpotsMessage}`);

      // Increment total answered
      setTotalAnswered(prev => prev + 1);

      // Set a timeout to generate new urinals after review phase
      setTimeout(() => {
        setInReviewPhase(false);
        generateUrinals();
      }, REVIEW_DURATION);
    }
  };

  // UPDATED: Handle push button click (just for fun)
  const handlePush = () => {
    // Don't allow pushing during review phase or if game not active
    if (inReviewPhase || !gameActive) return;

    // Start review phase
    setInReviewPhase(true);

    // Reduce time
    setTimeRemaining(prev => Math.max(1, prev - 3)); // Reduce time by 3 seconds for pushing
    setScore(prev => ({ ...prev, blocked: prev.blocked + 1 }));

    const newPushCount = pushCounter + 1;
    setPushCounter(newPushCount);

    let message;
    if (newPushCount >= 5) {
      message = repeatedPushMessages[Math.min(newPushCount - 5, repeatedPushMessages.length - 1)];
    } else {
      message = pushMessages[Math.min(newPushCount - 1, pushMessages.length - 1)];
    }

    showFeedback('warning', message);

    // Increment total answered
    setTotalAnswered(prev => prev + 1);

    // Set a timeout to generate new urinals after review phase
    setTimeout(() => {
      setInReviewPhase(false);
      generateUrinals();
    }, REVIEW_DURATION);
  };

  // Show feedback message
  const showFeedback = (type, message) => {
    setFeedback({ type, message });

    // If not in review phase, clear feedback after timeout
    if (!inReviewPhase) {
      setTimeout(() => setFeedback(null), 2500);
    }
    // For review phase, feedback will remain until the phase ends
  };

  // Calculate final results
  const calculateResults = () => {
    const correctAnswers = score.correct;
    const pusherRatio = pushCounter / (totalAnswered || 1);

    let percentile = "Bottom 50%";
    if (correctAnswers > 15) percentile = "Top 1%";
    else if (correctAnswers > 10) percentile = "Top 10%";
    else if (correctAnswers > 5) percentile = "Top 50%";

    let genderGuess;
    if (pusherRatio > 0.5) {
      genderGuess = "Chaotic Evil Bathroom Menace";
    } else if (pusherRatio > 0.3) {
      genderGuess = "Urinal Boundary Tester";
    } else if (pushCounter > 5) {
      genderGuess = "Personal Space Invader";
    } else {
      if (correctAnswers >= 12) genderGuess = "Definitely male";
      else if (correctAnswers >= 7) genderGuess = "Probably male";
      else genderGuess = "Either confused or you read the meme";
    }

    return { percentile, genderGuess };
  };

  // Timer effect
  useEffect(() => {
    let timerInterval = null;
    if (gameActive && timeRemaining > 0 && !inReviewPhase) {
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && gameActive) {
      endGame();
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [gameActive, timeRemaining, inReviewPhase]);

  // Block timer effect (keep for legacy support but not actively used anymore)
  useEffect(() => {
    let blockInterval = null;
    if (blocked && blockTimer > 0) {
      blockInterval = setInterval(() => {
        setBlockTimer(prev => prev - 1);
      }, 1000);
    } else if (blockTimer === 0 && blocked) {
      setBlocked(false);
    }
    return () => {
      if (blockInterval) clearInterval(blockInterval);
    };
  }, [blocked, blockTimer]);

  // Generate urinals only when needed
  useEffect(() => {
    if (gameActive && urinals.length === 0) {
      generateUrinals();
    }
  }, [gameActive, urinals.length, generateUrinals]);

  // Animation helper for water drops
  const renderWaterDrops = (count = 3) => {
    if (!gameActive) return null;
    return Array(count).fill(0).map((_, i) => (
      <div
        key={`drop-${i}`}
        className={`water-drop drop-${i + 1}`}
        style={{ left: `${50 + (i - 1) * 30}%` }}
      >
        <WaterDropIcon size={6 + i * 2} opacity={0.5 + i * 0.1} />
      </div>
    ));
  };

  // UPDATED: Render urinals
  const renderUrinals = () => {
    return urinals.map((status, index) => {
      const isHovered = hoveredUrinal === index;
      const isValid = validUrinalSpots.includes(index);
      // Highlight correct answers during review phase
      const showCorrectAnswer = (inReviewPhase && isValid) ||
                                (feedback && feedback.type === 'error' && isValid);

      return (
        <div
          key={index}
          onClick={() => handleUrinalClick(index)}
          onMouseEnter={() => handleUrinalMouseEnter(index)}
          onMouseLeave={handleUrinalMouseLeave}
          className={`urinal
            ${status === 'taken' ? 'urinal-taken' : 'urinal-empty'}
            ${isHovered && status !== 'taken' ? 'urinal-hovered' : ''}
            ${isHovered && isValid && status !== 'taken' ? 'urinal-valid' : ''}
            ${isHovered && !isValid && status !== 'taken' ? 'urinal-invalid' : ''}
            ${showCorrectAnswer ? 'urinal-correct-answer' : ''}`}
        >
          <div className="urinal-bowl">
            <div className="urinal-interior"></div>
            <div className="urinal-drain"></div>
            {status === 'taken' && renderWaterDrops()}
            <div className="urinal-flush">
              <FlushIcon />
            </div>
          </div>
          <div className="urinal-divider urinal-divider-left"></div>
          <div className="urinal-divider urinal-divider-right"></div>
          {status === 'taken' && (
            <div className="person">
              <div className="person-shadow"></div>
              <div className="person-body">
                <div className="person-head"></div>
                <div className="person-arms">
                  <div className="person-arm person-arm-left"></div>
                  <div className="person-arm person-arm-right"></div>
                </div>
                <div className="person-legs">
                  <div className="person-leg person-leg-left"></div>
                  <div className="person-leg person-leg-right"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const results = gameOver ? calculateResults() : { percentile: "", genderGuess: "" };

  return (
    <div className="game-container">
      {/* New: Sound control button (persistent throughout the site) */}
      <button onClick={toggleMute} className={`sound-control-button ${isMuted ? 'muted' : ''}`}>
        {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
        <span className="button-text">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>

      <div className="persistent-buttons">
        {user && !isGuest && (
          <button onClick={handleLogout} className="top-logout-button">
            <LogOutIcon /> <span className="button-text">Logout ({displayName})</span>
          </button>
        )}
        {gameActive && (
          <button onClick={startGame} className="top-new-game-button">
            <PlayIcon /> <span className="button-text">New Game</span>
          </button>
        )}
      </div>

      {(user || isGuest) && !gameActive && !gameOver && (
        <div className="auth-status">
          {/* {!isGuest && (
            <button onClick={handleLogout} className="logout-button">
              <LogOutIcon /> Logout
            </button>
          )} */}
        </div>
      )}

      {!gameActive && !gameOver ? (
        <div className="start-screen">
          <h1 className="game-title">Only Real Men Know Where to Pee</h1>
          <p className="game-subtitle">Test your knowledge of the unwritten bathroom code!</p>

          {/* Game buttons section */}
          {!user && !isGuest ? (
            <>
              <button onClick={playAsGuest} className="start-button guest-play-button">
                <span className="icon-margin"><PlayIcon /></span> Play as Guest
              </button>
              <button onClick={() => openAuthModal('login')} className="start-button login-button">
                <span className="icon-margin"><LoginIcon /></span> Login
              </button>
              <button onClick={() => openAuthModal('signup')} className="start-button signup-button">
                <span className="icon-margin"><UserIcon /></span> Sign Up
              </button>
            </>
          ) : (
            <>
              <button onClick={startGame} className="start-button play-button">
                <span className="icon-margin"><PlayIcon /></span> Start Game
              </button>
              {isGuest ? (
                <>
                  <button onClick={() => openAuthModal('login')} className="start-button login-button">
                    <span className="icon-margin"><LoginIcon /></span> Login
                  </button>
                  <button onClick={() => openAuthModal('signup')} className="start-button signup-button">
                    <span className="icon-margin"><UserIcon /></span> Sign Up
                  </button>
                </>
              ) : (
                <button onClick={handleLogout} className="start-button logout-button">
                  <span className="icon-margin"><LogOutIcon /></span> Logout
                </button>
              )}
            </>
          )}

          {/* New: Leaderboard button on homepage */}
          <button onClick={openLeaderboard} className="leaderboard-button start-button">
            <span className="icon-margin"><LeaderboardIcon /></span> Global Leaderboard
          </button>

          {/* <div className="bathroom-decoration">
            <div className="bathroom-decoration-urinal bathroom-decoration-urinal-1"></div>
            <div className="bathroom-decoration-urinal bathroom-decoration-urinal-2"></div>
            <div className="bathroom-decoration-urinal bathroom-decoration-urinal-3"></div>
          </div> */}
        </div>
      ) : gameOver ? (
        <div className="end-screen">
          <h1 className="end-title">Game Over!</h1>
          <div className="score-box">
            <h2 className="score-title">Final Score</h2>
            <p className="final-score">{score.correct}</p>
            <p className="score-details">Correct: {score.correct} | Blocked: {score.blocked}</p>
          </div>
          <div>
            <p className="result-rank">Your Rank: <span className="rank-highlight">{results.percentile}</span></p>
            <p className="result-gender">"{results.genderGuess}"</p>
          </div>
          <div className="button-container">
            <button onClick={startGame} className="play-again-button">Play Again</button>
            <button onClick={openLeaderboard} className="did-i-cook-button">
              <span className="icon-margin"><TrophyIcon /></span> Did I Cook?
            </button>
            <button onClick={shareResults} className="share-button">
              <span className="icon-margin"><ShareIcon /></span> Share Results
            </button>
          </div>
          {isGuest && (
            <div className="guest-notice">
              <p>Playing as guest. Login or sign up to save your scores to the leaderboard!</p>
              <div className="guest-auth-buttons">
                <button onClick={() => openAuthModal('login')} className="guest-auth-button">
                  <LoginIcon /> Login
                </button>
                <button onClick={() => openAuthModal('signup')} className="guest-auth-button">
                  <UserIcon /> Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`game-screen ${inReviewPhase ? 'review-phase' : ''}`}>
          <div className="top-bar">
            <div>
              <div className={`timer-text ${timeRemaining <= 10 ? 'timer-warning' : 'timer-normal'}`}>
                {String(timeRemaining).padStart(2, '0')}s
              </div>
            </div>
            <div className="score-container">
              <div className="score-item">
                <span className="score-correct"><CheckCircleIcon /></span>
                <span className="score-value">{score.correct}</span>
              </div>
              <div className="score-item">
                <span className="score-blocked"><XCircleIcon /></span>
                <span className="score-value">{score.blocked}</span>
              </div>
            </div>
          </div>
          {feedback && (
            <div className={`feedback-box ${
              feedback.type === 'success' ? 'feedback-success' :
              feedback.type === 'error' ? 'feedback-error' :
              'feedback-warning'
            }`}>
              {feedback.message}
            </div>
          )}
          {/* Block overlay - we keep it for legacy support but it won't be used anymore */}
          {blocked && (
            <>
              <div className="block-overlay"></div>
              <div className="block-message-container">
                <div className="block-message">
                  <div className="block-icon">
                    <AlertTriangleIcon />
                  </div>
                  <h2 className="block-title">Blocked!</h2>
                  <p>Wait {blockTimer} seconds...</p>
                </div>
              </div>
            </>
          )}
          <div className="game-area">
            <h2 className="game-heading">Choose a urinal or wait</h2>
            <div className="urinal-row">
              <div className="wet-floor-sign"></div>
              <div className="bathroom-wall">
                <div className="bathroom-tiles"></div>
              </div>
              <div className="bathroom-floor">
                <div className="floor-tiles"></div>
                <div className="floor-drain"></div>
              </div>
              <div className="urinal-container">
                {renderUrinals()}
              </div>
            </div>
          </div>
          <div className="controls">
            <button
              onClick={handleWait}
              className="button wait-button"
              disabled={inReviewPhase}
            >
              <span className="icon-margin"><PauseIcon /></span> Wait
            </button>
            <button
              onClick={handlePush}
              className="button push-button"
              disabled={inReviewPhase}
            >
              <span className="icon-margin"><LogOutIcon /></span> Push Someone
            </button>
          </div>
        </div>
      )}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={closeLeaderboard}
        currentScore={score.correct}
        userName={displayName}
        isGuest={isGuest}
      />
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <button className="close-button" onClick={closeAuthModal}>×</button>
            <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
            {authError && (
              <div className="auth-error">
                {authError}
              </div>
            )}
            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input type="text" id="displayName" ref={displayNameRef} required placeholder="What should we call you?" />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" ref={emailRef} required placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" ref={passwordRef} required placeholder="Password" minLength="6" />
              </div>
              <button type="submit" className="auth-submit-button">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setAuthMode('signup')} className="auth-switch-button">
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="auth-switch-button">
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrinalGame;