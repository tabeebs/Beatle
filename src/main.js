// Main JavaScript file for Beatle game
// Phase 3: Core Game Logic & State Management

// =====================================
// GAME STATE VARIABLES (Phase 3)
// =====================================

// Game state object to manage all game data
const gameState = {
  // Current song data (placeholder structure for Phase 7 SoundCloud integration)
  currentSong: {
    id: 'demo-song-001',
    title: 'Tumi Robe Nirobe',
    artist: 'Rabindranath Tagore',
    soundcloudUrl: null, // Will be set in Phase 7
    audioElement: null   // Will be set in Phase 4
  },
  
  // Snippet length progression: 2s → 3s → 5s → 8s → 12s
  snippetLengths: [2, 3, 5, 8, 12],
  currentSnippetIndex: 0, // Index into snippetLengths array
  
  // Turn management (max 5 turns)
  currentTurn: 0,          // 0-4 (5 total turns)
  maxTurns: 5,
  
  // Guess history
  guessedSongs: [],        // Array of {guess: string, turn: number, isCorrect: boolean}
  
  // Game status
  status: 'playing',       // 'playing', 'won', 'lost'
  
  // Timer for victory screen
  gameStartTime: null,     // Date when game starts (popup closed)
  gameEndTime: null,       // Date when game ends (correct guess)
  
  // Audio playing state
  isPlaying: false
};

// =====================================
// AUDIO SYSTEM (Phase 4)
// =====================================

// Audio manager object
const audioManager = {
  currentAudio: null,
  isLoaded: false,
  duration: 0,
  
  // Initialize audio element
  init() {
    this.currentAudio = new Audio();
    this.currentAudio.preload = 'metadata';
    
    // Audio event listeners
    this.currentAudio.addEventListener('loadedmetadata', () => {
      this.duration = this.currentAudio.duration;
      this.isLoaded = true;
      console.log(`Audio loaded: ${this.duration}s duration`);
    });
    
    this.currentAudio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      this.isLoaded = false;
    });
    
    this.currentAudio.addEventListener('ended', () => {
      this.stopPlayback();
    });
    
    console.log('Audio manager initialized');
  },
  
  // Load audio file
  loadAudio(audioUrl) {
    if (!this.currentAudio) this.init();
    
    console.log('Loading audio:', audioUrl);
    this.currentAudio.src = audioUrl;
    this.isLoaded = false;
    
    // Return promise for loading completion
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        this.currentAudio.removeEventListener('loadedmetadata', onLoad);
        this.currentAudio.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = (e) => {
        this.currentAudio.removeEventListener('loadedmetadata', onLoad);
        this.currentAudio.removeEventListener('error', onError);
        reject(e);
      };
      
      this.currentAudio.addEventListener('loadedmetadata', onLoad);
      this.currentAudio.addEventListener('error', onError);
    });
  },
  
  // Play audio segment (startTime in seconds, duration in seconds)
  playSegment(startTime = 0, duration = null) {
    if (!this.currentAudio || !this.isLoaded) {
      console.warn('Audio not loaded');
      return false;
    }
    
    // Set start position
    this.currentAudio.currentTime = startTime;
    
    // Play audio
    const playPromise = this.currentAudio.play();
    
    if (playPromise) {
      playPromise.then(() => {
        console.log(`Playing audio from ${startTime}s for ${duration || 'full'}s`);
        gameState.isPlaying = true;
        
        // Set timeout to stop after duration if specified
        if (duration) {
          setTimeout(() => {
            this.stopPlayback();
          }, duration * 1000);
        }
      }).catch((error) => {
        console.error('Audio play failed:', error);
        gameState.isPlaying = false;
      });
    }
    
    return true;
  },
  
  // Stop audio playback
  stopPlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      gameState.isPlaying = false;
      console.log('Audio playback stopped');
    }
  },
  
  // Check if audio is currently playing
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused;
  }
};

// =====================================
// SONG DATABASE (Phase 7: Local Audio Integration)
// =====================================

// Song database loaded from JSON metadata
let songDatabase = [];

// Load song metadata from JSON file
async function loadSongDatabase() {
  try {
    console.log('Loading song database...');
    const response = await fetch('/assets/songs/song_metadata.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    songDatabase = await response.json();
    console.log(`Song database loaded: ${songDatabase.length} songs available`);
    
    // Validate that all songs have required fields
    const validSongs = songDatabase.filter(song => 
      song.id && song.title && song.artist && song.filename
    );
    
    if (validSongs.length !== songDatabase.length) {
      console.warn(`${songDatabase.length - validSongs.length} songs have invalid metadata`);
    }
    
    return validSongs;
  } catch (error) {
    console.error('Failed to load song database:', error);
    // Fallback to mock data for development
    console.log('Falling back to mock song data');
    return [
      {
        id: 'demo-song-001',
        title: 'Demo Song',
        artist: 'Demo Artist',
        filename: 'demo.mp3'
      }
    ];
  }
}

// Get random song from database
function getRandomSong() {
  if (songDatabase.length === 0) {
    console.error('Song database is empty');
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * songDatabase.length);
  const selectedSong = songDatabase[randomIndex];
  
  // Construct the audio URL using the filename
  const audioUrl = `/assets/songs/${selectedSong.filename}`;
  
  return {
    id: selectedSong.id,
    title: selectedSong.title,
    artist: selectedSong.artist,
    filename: selectedSong.filename,
    audioUrl: audioUrl
  };
}

// Get random song with fallback options
async function getRandomSongWithFallback() {
  if (songDatabase.length === 0) {
    console.error('Song database is empty');
    return null;
  }
  
  // Try up to 3 different songs to find one that loads successfully
  for (let attempt = 0; attempt < 3; attempt++) {
    const song = getRandomSong();
    
    try {
      // Test if the audio file is accessible
      const response = await fetch(song.audioUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Selected song: "${song.title}" by ${song.artist}`);
        return song;
      } else {
        console.warn(`Audio file not accessible: ${song.filename} (attempt ${attempt + 1})`);
      }
    } catch (error) {
      console.warn(`Failed to check audio file: ${song.filename} (attempt ${attempt + 1})`, error);
    }
  }
  
  // If all attempts fail, return the last song anyway and let audio loading handle the error
  console.warn('Could not verify any audio files, proceeding with last selected song');
  return getRandomSong();
}

// =====================================
// GAME LOGIC FUNCTIONS (Phase 3 + Phase 4 Updates)
// =====================================

// Get current snippet length in seconds
function getCurrentSnippetLength() {
  return gameState.snippetLengths[gameState.currentSnippetIndex];
}

// Get current snippet length for next turn (for skip button display)
function getNextSnippetLength() {
  const nextIndex = gameState.currentSnippetIndex + 1;
  if (nextIndex < gameState.snippetLengths.length) {
    return gameState.snippetLengths[nextIndex];
  }
  return null; // No more snippets
}

// Initialize new game with random song
async function initializeNewGame() {
  // Reset game state
  gameState.currentTurn = 0;
  gameState.currentSnippetIndex = 0;
  gameState.guessedSongs = [];
  gameState.status = 'playing';
  gameState.gameStartTime = null;
  gameState.gameEndTime = null;
  gameState.isPlaying = false;
  
  // Clear previous feedback and input
  clearFeedback();
  const guessInput = document.getElementById('guess-input');
  if (guessInput) {
    guessInput.value = '';
  }
  
  // Load random song from database (Phase 7 integration)
  const selectedSong = await getRandomSongWithFallback();
  if (!selectedSong) {
    console.error('No songs available in database');
    return;
  }
  
  gameState.currentSong = selectedSong;
  console.log('New game initialized with song:', gameState.currentSong.title, 'by', gameState.currentSong.artist);
  
  // Load audio file
  try {
    await audioManager.loadAudio(gameState.currentSong.audioUrl);
    console.log('Audio loaded successfully for:', gameState.currentSong.title);
  } catch (error) {
    console.error('Failed to load audio:', error);
    // Could fallback to a different song or show error message
  }
  
  // Update UI to reflect initial state
  updateGameUI();
}

// Start game timer (called when "How to Play?" popup is closed)
function startGameTimer() {
  gameState.gameStartTime = new Date();
  console.log('Game timer started at:', gameState.gameStartTime);
}

// Stop game timer (called on correct guess)
function stopGameTimer() {
  gameState.gameEndTime = new Date();
  console.log('Game timer stopped at:', gameState.gameEndTime);
}

// Get elapsed time in seconds
function getElapsedTime() {
  if (!gameState.gameStartTime) return 0;
  const endTime = gameState.gameEndTime || new Date();
  return Math.floor((endTime - gameState.gameStartTime) / 1000);
}

// Progress to next turn (increment snippet length)
function progressToNextTurn() {
  if (gameState.currentTurn < gameState.maxTurns - 1) {
    gameState.currentTurn++;
    
    // Increment snippet length if not at max
    if (gameState.currentSnippetIndex < gameState.snippetLengths.length - 1) {
      gameState.currentSnippetIndex++;
    }
    
    console.log(`Progressed to turn ${gameState.currentTurn + 1}, snippet length: ${getCurrentSnippetLength()}s`);
    updateGameUI();
    return true;
  }
  
  // Game over - no more turns
  gameState.status = 'lost';
  console.log('Game over - no more turns remaining');
  updateGameUI();
  return false;
}

// Enhanced guess processing with better validation (Phase 5)
function processGuess(guessText) {
  const guess = guessText.trim();
  
  if (!guess || gameState.status !== 'playing') {
    return false;
  }
  
  const correctTitle = gameState.currentSong.title;
  const correctArtist = gameState.currentSong.artist;
  
  // Enhanced string comparison logic (Phase 5)
  const isCorrect = validateGuess(guess, correctTitle, correctArtist);
  
  // Record the guess
  const guessRecord = {
    guess: guess,
    turn: gameState.currentTurn + 1,
    isCorrect: isCorrect,
    snippetLength: getCurrentSnippetLength()
  };
  gameState.guessedSongs.push(guessRecord);
  
  console.log(`Guess processed: "${guess}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
  
  if (isCorrect) {
    // Correct guess - player wins!
    gameState.status = 'won';
    stopGameTimer();
    console.log('🎉 Correct guess! Player wins!');
    
    // Stop any playing audio
    audioManager.stopPlayback();
    
    // Show success feedback
    showFeedback('correct-guess', `🎉 Correct! "${correctTitle}" by ${correctArtist}`);
    
    // Phase 6: Show victory screen after brief delay
    setTimeout(() => {
      showVictoryScreen();
    }, 1500); // Give time for feedback to show
  } else {
    // Incorrect guess - show feedback and progress
    const turnNumber = gameState.currentTurn + 1;
    const ordinal = getOrdinalSuffix(turnNumber);
    
    showFeedback('incorrect-guess', `${turnNumber}${ordinal} incorrect guess eg. ${guess}`);
    
    // Progress to next turn
    const canContinue = progressToNextTurn();
    
    if (!canContinue) {
      // Game over - no more turns
      showFeedback('game-over', `Game Over! The song was "${correctTitle}" by ${correctArtist}`);
    }
  }
  
  updateGameUI();
  return true;
}

// Enhanced guess validation with multiple matching strategies
function validateGuess(guess, correctTitle, correctArtist) {
  const normalizeString = (str) => {
    return str.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  };
  
  const normalizedGuess = normalizeString(guess);
  const normalizedTitle = normalizeString(correctTitle);
  const normalizedArtist = normalizeString(correctArtist);
  
  // Strategy 1: Exact match (case-insensitive)
  if (normalizedGuess === normalizedTitle || normalizedGuess === normalizedArtist) {
    return true;
  }
  
  // Strategy 2: Partial match (contains)
  if (normalizedTitle.includes(normalizedGuess) || normalizedArtist.includes(normalizedGuess)) {
    // Only accept if guess is substantial (at least 3 characters)
    return normalizedGuess.length >= 3;
  }
  
  // Strategy 3: Guess contains the correct answer
  if (normalizedGuess.includes(normalizedTitle) || normalizedGuess.includes(normalizedArtist)) {
    return true;
  }
  
  // Strategy 4: Word-based matching (any significant word matches)
  const guessWords = normalizedGuess.split(' ').filter(word => word.length >= 3);
  const titleWords = normalizedTitle.split(' ').filter(word => word.length >= 3);
  const artistWords = normalizedArtist.split(' ').filter(word => word.length >= 3);
  
  for (const guessWord of guessWords) {
    if (titleWords.includes(guessWord) || artistWords.includes(guessWord)) {
      return true;
    }
  }
  
  return false;
}

// Enhanced skip processing (Phase 5)
function processSkip() {
  if (gameState.status !== 'playing') {
    return false;
  }
  
  console.log('Skip action processed');
  
  // Stop any currently playing audio
  audioManager.stopPlayback();
  
  // Show skip feedback
  showFeedback('skipped', 'Skipped');
  
  // Progress to next turn (this increments snippet length)
  const canContinue = progressToNextTurn();
  
  if (!canContinue) {
    // Game over - no more turns
    const correctTitle = gameState.currentSong.title;
    const correctArtist = gameState.currentSong.artist;
    showFeedback('game-over', `Game Over! The song was "${correctTitle}" by ${correctArtist}`);
  } else {
    // Automatically play the next, longer snippet after a brief delay
    setTimeout(() => {
      if (gameState.status === 'playing') {
        handleVinylClick();
      }
    }, 800); // Give time for feedback to show
  }
  
  return true;
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, 4th, 5th)
function getOrdinalSuffix(num) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = num % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
}

// Enhanced UI updates based on current game state (Phase 5)
function updateGameUI() {
  const skipButton = document.getElementById('skip-button');
  const submitButton = document.getElementById('submit-button');
  const guessInput = document.getElementById('guess-input');
  
  if (!skipButton || !submitButton || !guessInput) return;
  
  // Update skip button text and state
  const nextLength = getNextSnippetLength();
  if (nextLength !== null && gameState.status === 'playing') {
    skipButton.textContent = `Skip (+${nextLength}s)`;
    skipButton.disabled = false;
    skipButton.style.opacity = '1';
  } else if (gameState.status === 'playing') {
    // Last turn - no more skips available
    skipButton.textContent = 'No more skips';
    skipButton.disabled = true;
    skipButton.style.opacity = '0.6';
  } else {
    // Game over
    skipButton.disabled = true;
    skipButton.style.opacity = '0.6';
  }
  
  // Update input field state
  if (gameState.status !== 'playing') {
    guessInput.disabled = true;
    guessInput.style.opacity = '0.6';
    guessInput.placeholder = gameState.status === 'won' ? 'You won!' : 'Game over';
  } else {
    guessInput.disabled = false;
    guessInput.style.opacity = '1';
    guessInput.placeholder = 'Know it? Search for title/artist…';
  }
  
  // Update submit button state (this also calls updateSubmitButtonState)
  updateSubmitButtonState();
  
  console.log(`UI Updated - Turn: ${gameState.currentTurn + 1}/${gameState.maxTurns}, Snippet: ${getCurrentSnippetLength()}s, Status: ${gameState.status}`);
}

// =====================================
// EXISTING FUNCTIONS (Updated for Phase 3)
// =====================================

// Set today's date in footer
function setTodaysDate() {
  const today = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('en-US', options);
  
  const footerDateElement = document.getElementById('footer-date');
  if (footerDateElement) {
    footerDateElement.textContent = formattedDate;
  }
}

// Landing page transition animation
function startLandingTransition() {
  const landingPage = document.getElementById('landing-page');
  
  // Start with white screen
  landingPage.classList.add('initial');
  
  // After a brief moment, start transition to yellow
  setTimeout(() => {
    landingPage.classList.remove('initial');
    landingPage.classList.add('transitioning');
  }, 500);
  
  // Remove transition class after animation completes
  setTimeout(() => {
    landingPage.classList.remove('transitioning');
  }, 2000);
}

// Show "How to Play?" popup
function showHowToPlayPopup() {
  const popup = document.getElementById('how-to-play-popup');
  const gameScreen = document.getElementById('game-screen');
  
  // Show game screen underneath
  gameScreen.classList.remove('hidden');
  
  // Show popup
  popup.classList.remove('hidden');
}

// Hide "How to Play?" popup
async function hideHowToPlayPopup() {
  const popup = document.getElementById('how-to-play-popup');
  const landingPage = document.getElementById('landing-page');
  
  // Hide popup
  popup.classList.add('hidden');
  
  // Hide landing page
  landingPage.classList.add('hidden');
  
  // Phase 4: Initialize audio manager first
  audioManager.init();
  
  // Phase 3: Start game timer and initialize new game
  startGameTimer();
  await initializeNewGame();
}

// Phase 4: Vinyl player functionality with real audio integration
function handleVinylClick() {
  const vinylDisc = document.getElementById('vinyl-disc');
  const vinylCenter = vinylDisc.querySelector('.vinyl-center');
  const playPauseIcon = vinylCenter.querySelector('.play-pause-icon');
  const progressFill = document.getElementById('progress-fill');
  
  // Only allow playing if game is active
  if (gameState.status !== 'playing') return;
  
  // Toggle between play and stop
  if (gameState.isPlaying || audioManager.isPlaying()) {
    // Stop current playback
    audioManager.stopPlayback();
    vinylDisc.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    playPauseIcon.classList.remove('playing');
    progressFill.style.width = '0%';
    progressFill.style.transitionDuration = '';
    gameState.isPlaying = false;
    return;
  }
  
  // Start playing audio segment
  const snippetLength = getCurrentSnippetLength();
  const startTime = 0; // Start from beginning for now (could be randomized later)
  
  // Visual feedback - start spinning and add playing state
  vinylDisc.classList.add('spinning');
  vinylCenter.classList.add('playing');
  playPauseIcon.classList.add('playing');
  gameState.isPlaying = true;
  
  // Calculate progress bar fill percentage (max at 12s = 100%)
  const progressPercent = Math.min((snippetLength / 12) * 100, 100);
  progressFill.style.transitionDuration = `${snippetLength}s`;
  progressFill.style.width = `${progressPercent}%`;
  
  console.log(`Playing ${snippetLength}s snippet from ${startTime}s`);
  
  // Play the actual audio segment
  const playSuccess = audioManager.playSegment(startTime, snippetLength);
  
  if (!playSuccess) {
    // If audio failed to play, reset visual state
    vinylDisc.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    playPauseIcon.classList.remove('playing');
    progressFill.style.width = '0%';
    progressFill.style.transitionDuration = '';
    gameState.isPlaying = false;
    console.warn('Failed to play audio segment');
    return;
  }
  
  // Reset visual state after snippet duration
  setTimeout(() => {
    vinylDisc.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    playPauseIcon.classList.remove('playing');
    progressFill.style.width = '0%';
    progressFill.style.transitionDuration = '';
    gameState.isPlaying = false;
  }, snippetLength * 1000);
}

// Add spacebar support for vinyl player
function handleSpacebarPress(event) {
  if (event.code === 'Space') {
    // Prevent default spacebar scroll behavior
    event.preventDefault();
    
    // Only trigger if not typing in input field
    const activeElement = document.activeElement;
    const isTyping = activeElement && activeElement.tagName === 'INPUT';
    
    if (!isTyping) {
      handleVinylClick();
    }
  }
}

// Enhanced feedback display system (Phase 7.5 - Dynamic & Scrollable)
function showFeedback(type, message) {
  const feedbackContainer = document.getElementById('feedback-container');
  
  if (!feedbackContainer) {
    // Fallback to old system if new container doesn't exist
    showLegacyFeedback(type, message);
    return;
  }
  
  // Create feedback item element
  const feedbackItem = document.createElement('div');
  feedbackItem.className = `feedback-item ${type}`;
  
  // Set message content
  feedbackItem.textContent = message;
  
  // Add to container at the end (newest at bottom)
  feedbackContainer.appendChild(feedbackItem);
  
  // Auto-scroll to bottom to show newest feedback
  setTimeout(() => {
    feedbackContainer.scrollTop = feedbackContainer.scrollHeight;
  }, 100);
  
  // Auto-remove after delay for non-critical messages
  const removeDelay = type === 'game-over' || type === 'correct-guess' ? 8000 : 5000;
  
  setTimeout(() => {
    if (feedbackItem.parentNode) {
      feedbackItem.style.opacity = '0';
      feedbackItem.style.transform = 'translateY(-10px) scale(0.95)';
      
      setTimeout(() => {
        if (feedbackItem.parentNode) {
          feedbackItem.remove();
        }
      }, 300);
    }
  }, removeDelay);
  
  // Limit number of feedback items (remove oldest if too many)
  const maxItems = 10;
  const items = feedbackContainer.querySelectorAll('.feedback-item');
  if (items.length > maxItems) {
    const oldestItem = items[0];
    oldestItem.style.opacity = '0';
    oldestItem.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => {
      if (oldestItem.parentNode) {
        oldestItem.remove();
      }
    }, 300);
  }
  
  console.log(`Dynamic feedback displayed: ${type} - ${message}`);
}

// Legacy feedback function for compatibility
function showLegacyFeedback(type, message) {
  const feedbackDisplay = document.getElementById('feedback-display');
  
  if (!feedbackDisplay) return;
  
  // Create feedback message element
  const feedbackMessage = document.createElement('div');
  feedbackMessage.className = `feedback-message ${type}`;
  
  // Set message content
  feedbackMessage.textContent = message;
  
  // Add to display (stack multiple messages)
  feedbackDisplay.appendChild(feedbackMessage);
  
  // Auto-remove after delay (longer for important messages)
  const removeDelay = type === 'game-over' || type === 'correct-guess' ? 5000 : 3000;
  
  setTimeout(() => {
    if (feedbackMessage.parentNode) {
      feedbackMessage.style.opacity = '0';
      feedbackMessage.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        if (feedbackMessage.parentNode) {
          feedbackMessage.remove();
        }
      }, 300);
    }
  }, removeDelay);
  
  // Limit number of feedback messages (remove oldest if too many)
  const messages = feedbackDisplay.querySelectorAll('.feedback-message');
  if (messages.length > 3) {
    const oldestMessage = messages[0];
    oldestMessage.remove();
  }
  
  console.log(`Legacy feedback displayed: ${type} - ${message}`);
}

// Clear all feedback messages
function clearFeedback() {
  const feedbackContainer = document.getElementById('feedback-container');
  if (feedbackContainer) {
    feedbackContainer.innerHTML = '';
  }
  
  // Also clear legacy feedback display for compatibility
  const feedbackDisplay = document.getElementById('feedback-display');
  if (feedbackDisplay) {
    feedbackDisplay.innerHTML = '';
  }
}

// Phase 3: Skip button functionality with game logic
function handleSkipClick() {
  // Only allow skip if game is active
  if (gameState.status !== 'playing') return;
  
  // Process skip through game logic
  processSkip();
}

// Phase 3: Submit button functionality with game logic
function handleSubmitClick() {
  const guessInput = document.getElementById('guess-input');
  const guessValue = guessInput.value.trim();
  
  // Only allow submit if game is active and input has value
  if (gameState.status !== 'playing' || !guessValue) return;
  
  // Process guess through game logic
  processGuess(guessValue);
  
  // Clear input
  guessInput.value = '';
}

// Play button click handler
function handlePlayButtonClick() {
  showHowToPlayPopup();
}

// Ready button click handler
function handleReadyButtonClick() {
  hideHowToPlayPopup();
}

// Input enter key handler
function handleInputEnter(event) {
  if (event.key === 'Enter') {
    handleSubmitClick();
  }
}

// Initialize event listeners
function initEventListeners() {
  // Play button
  const playButton = document.getElementById('play-button');
  if (playButton) {
    playButton.addEventListener('click', handlePlayButtonClick);
  }
  
  // Ready button
  const readyButton = document.getElementById('ready-button');
  if (readyButton) {
    readyButton.addEventListener('click', handleReadyButtonClick);
  }
  
  // Vinyl player (Phase 2 demo)
  const vinylDisc = document.getElementById('vinyl-disc');
  if (vinylDisc) {
    vinylDisc.addEventListener('click', handleVinylClick);
  }
  
  // Skip button (Phase 2 demo)
  const skipButton = document.getElementById('skip-button');
  if (skipButton) {
    skipButton.addEventListener('click', handleSkipClick);
  }
  
  // Submit button (Phase 2 demo)
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', handleSubmitClick);
  }
  
  // Guess input enter key
  const guessInput = document.getElementById('guess-input');
  if (guessInput) {
    guessInput.addEventListener('keydown', handleInputEnter);
  }
  
  // Phase 6: Reset button in nav bar
  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', handleResetButtonClick);
  }
  
  // Phase 6: Reset confirmation popup buttons
  const cancelReset = document.getElementById('cancel-reset');
  if (cancelReset) {
    cancelReset.addEventListener('click', handleCancelReset);
  }
  
  const confirmReset = document.getElementById('confirm-reset');
  if (confirmReset) {
    confirmReset.addEventListener('click', handleConfirmReset);
  }
  
  // Phase 6: Victory screen elements
  const victoryVinyl = document.getElementById('victory-vinyl');
  if (victoryVinyl) {
    victoryVinyl.addEventListener('click', handleVictoryVinylClick);
  }
  
  const playAgainButton = document.getElementById('play-again-button');
  if (playAgainButton) {
    playAgainButton.addEventListener('click', handlePlayAgain);
  }
  
  // Phase 6: Help button (gear icon) to reopen "How to Play?" popup
  const helpButton = document.getElementById('help-button');
  if (helpButton) {
    helpButton.addEventListener('click', showHowToPlayPopup);
  }
  
  // Enhanced Escape key handler (Phase 6)
  document.addEventListener('keydown', handleEscapeKeyEnhanced);
  
  // Phase 4: Spacebar for vinyl player + Phase 6: Victory screen spacebar
  document.addEventListener('keydown', handleSpacebarPress);
  document.addEventListener('keydown', handleVictorySpacebarPress);
  
  // Enhanced popup overlay click handlers (Phase 6)
  const howToPlayPopup = document.getElementById('how-to-play-popup');
  if (howToPlayPopup) {
    howToPlayPopup.addEventListener('click', handlePopupOverlayClickEnhanced);
  }
  
  const resetPopup = document.getElementById('reset-popup');
  if (resetPopup) {
    resetPopup.addEventListener('click', handlePopupOverlayClickEnhanced);
  }
}

// Initialize the application
async function init() {
  console.log('Beatle game initializing...');
  
  // Set today's date
  setTodaysDate();
  
  // Initialize event listeners
  initEventListeners();
  
  // Phase 5: Initialize enhanced search box functionality
  initializeSearchBox();
  
  // Phase 7: Load song database
  await loadSongDatabase();
  
  // Start landing transition animation
  startLandingTransition();
  
  console.log('Phase 7.5: Interactive Search Suggestions & Dynamic Feedback UI initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// =====================================
// SEARCH & INPUT FUNCTIONALITY (Phase 7.5: Interactive Search Suggestions)
// =====================================

// Search suggestions state
const searchState = {
  isVisible: false,
  currentHighlight: -1,
  filteredSongs: [],
  lastQuery: ''
};

// Enhanced search box functionality with live suggestions
function initializeSearchBox() {
  const guessInput = document.getElementById('guess-input');
  
  if (!guessInput) return;
  
  // Input validation and formatting with live search
  guessInput.addEventListener('input', (event) => {
    const value = event.target.value;
    
    // Trim whitespace and limit length
    if (value.length > 100) {
      event.target.value = value.substring(0, 100);
    }
    
    // Update submit button state based on input
    updateSubmitButtonState();
    
    // Phase 7.5: Handle live search suggestions
    handleSearchInput(event.target.value);
  });
  
  // Handle focus states and show suggestions
  guessInput.addEventListener('focus', () => {
    guessInput.classList.add('focused');
    if (guessInput.value.trim()) {
      showSearchSuggestions();
    }
  });
  
  // Hide suggestions on blur (with delay for click handling)
  guessInput.addEventListener('blur', () => {
    guessInput.classList.remove('focused');
    setTimeout(() => {
      hideSearchSuggestions();
    }, 200);
  });
  
  // Enhanced keyboard navigation
  guessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // If a suggestion is highlighted, select it
      if (searchState.isVisible && searchState.currentHighlight >= 0) {
        selectSuggestion(searchState.currentHighlight);
      } else {
        const value = guessInput.value.trim();
        if (value && gameState.status === 'playing') {
          handleSubmitClick();
        }
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateSuggestions(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigateSuggestions(-1);
    } else if (event.key === 'Escape') {
      hideSearchSuggestions();
      guessInput.blur();
    }
  });
  
  // Initialize suggestions container click handling
  initializeSuggestionsContainer();
}

// Handle search input and filter suggestions
function handleSearchInput(query) {
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length === 0) {
    hideSearchSuggestions();
    return;
  }
  
  if (trimmedQuery === searchState.lastQuery) {
    return; // No change
  }
  
  searchState.lastQuery = trimmedQuery;
  searchState.filteredSongs = filterSongs(trimmedQuery);
  searchState.currentHighlight = -1;
  
  if (searchState.filteredSongs.length > 0) {
    renderSuggestions();
    showSearchSuggestions();
  } else {
    hideSearchSuggestions();
  }
}

// Filter songs based on search query
function filterSongs(query) {
  if (songDatabase.length === 0) return [];
  
  const normalizedQuery = normalizeSearchString(query);
  
  return songDatabase.filter(song => {
    const normalizedTitle = normalizeSearchString(song.title);
    const normalizedArtist = normalizeSearchString(song.artist);
    
    return normalizedTitle.includes(normalizedQuery) || 
           normalizedArtist.includes(normalizedQuery);
  }).slice(0, 8); // Limit to 8 suggestions
}

// Normalize string for search comparison
function normalizeSearchString(str) {
  return str.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Render suggestions in the dropdown
function renderSuggestions() {
  const suggestionsList = document.getElementById('suggestions-list');
  if (!suggestionsList) return;
  
  suggestionsList.innerHTML = '';
  
  searchState.filteredSongs.forEach((song, index) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.dataset.index = index;
    
    suggestionItem.innerHTML = `
      <div class="song-title">${escapeHtml(song.title)}</div>
      <div class="song-artist">${escapeHtml(song.artist)}</div>
    `;
    
    // Add click handler
    suggestionItem.addEventListener('click', () => {
      selectSuggestion(index);
    });
    
    // Add hover handler
    suggestionItem.addEventListener('mouseenter', () => {
      highlightSuggestion(index);
    });
    
    suggestionsList.appendChild(suggestionItem);
  });
}

// Show search suggestions dropdown
function showSearchSuggestions() {
  const searchSuggestions = document.getElementById('search-suggestions');
  if (searchSuggestions && searchState.filteredSongs.length > 0) {
    searchSuggestions.classList.add('visible');
    searchState.isVisible = true;
  }
}

// Hide search suggestions dropdown
function hideSearchSuggestions() {
  const searchSuggestions = document.getElementById('search-suggestions');
  if (searchSuggestions) {
    searchSuggestions.classList.remove('visible');
    searchState.isVisible = false;
    searchState.currentHighlight = -1;
    updateHighlight();
  }
}

// Navigate suggestions with keyboard
function navigateSuggestions(direction) {
  if (!searchState.isVisible || searchState.filteredSongs.length === 0) return;
  
  const newIndex = searchState.currentHighlight + direction;
  
  if (newIndex >= 0 && newIndex < searchState.filteredSongs.length) {
    searchState.currentHighlight = newIndex;
  } else if (direction > 0) {
    searchState.currentHighlight = 0; // Wrap to first
  } else {
    searchState.currentHighlight = searchState.filteredSongs.length - 1; // Wrap to last
  }
  
  updateHighlight();
}

// Highlight a specific suggestion
function highlightSuggestion(index) {
  searchState.currentHighlight = index;
  updateHighlight();
}

// Update visual highlighting of suggestions
function updateHighlight() {
  const suggestionItems = document.querySelectorAll('.suggestion-item');
  
  suggestionItems.forEach((item, index) => {
    if (index === searchState.currentHighlight) {
      item.classList.add('highlighted');
    } else {
      item.classList.remove('highlighted');
    }
  });
}

// Select a suggestion
function selectSuggestion(index) {
  if (index < 0 || index >= searchState.filteredSongs.length) return;
  
  const selectedSong = searchState.filteredSongs[index];
  const guessInput = document.getElementById('guess-input');
  
  if (guessInput) {
    guessInput.value = selectedSong.title;
    updateSubmitButtonState();
  }
  
  hideSearchSuggestions();
  
  // Focus back to input for immediate submission if desired
  guessInput.focus();
}

// Initialize suggestions container event handling
function initializeSuggestionsContainer() {
  const suggestionsContainer = document.getElementById('search-suggestions');
  if (!suggestionsContainer) return;
  
  // Prevent container from losing focus when clicking inside
  suggestionsContainer.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update submit button state based on input and game state
function updateSubmitButtonState() {
  const guessInput = document.getElementById('guess-input');
  const submitButton = document.getElementById('submit-button');
  
  if (!guessInput || !submitButton) return;
  
  const hasInput = guessInput.value.trim().length > 0;
  const canSubmit = hasInput && gameState.status === 'playing';
  
  submitButton.disabled = !canSubmit;
  submitButton.style.opacity = canSubmit ? '1' : '0.6';
  
  if (gameState.status !== 'playing') {
    if (gameState.status === 'won') {
      submitButton.textContent = 'You Won!';
      submitButton.style.background = '#2cb67d';
    } else if (gameState.status === 'lost') {
      submitButton.textContent = 'Game Over';
      submitButton.style.background = '#b41c27';
    }
  } else {
    submitButton.textContent = 'Submit';
    submitButton.style.background = '#2cb67d';
  }
}

// =====================================
// PHASE 6: RESET CONFIRMATION & VICTORY SCREEN UI
// =====================================

// Reset Confirmation Popup functionality
function showResetConfirmationPopup() {
  const resetPopup = document.getElementById('reset-popup');
  if (resetPopup) {
    resetPopup.classList.remove('hidden');
    console.log('Reset confirmation popup shown');
  }
}

function hideResetConfirmationPopup() {
  const resetPopup = document.getElementById('reset-popup');
  if (resetPopup) {
    resetPopup.classList.add('hidden');
    console.log('Reset confirmation popup hidden');
  }
}

function handleResetButtonClick() {
  showResetConfirmationPopup();
}

function handleCancelReset() {
  hideResetConfirmationPopup();
}

async function handleConfirmReset() {
  console.log('Resetting game...');
  
  // Hide the confirmation popup
  hideResetConfirmationPopup();
  
  // Stop any current audio
  audioManager.stopPlayback();
  
  // Clear feedback display
  clearFeedback();
  
  // Initialize new game with random song
  await initializeNewGame();
  
  // Reset UI elements
  updateGameUI();
  
  // Reset timer
  gameState.gameStartTime = Date.now();
  
  console.log('Game reset complete');
}

// Victory Screen functionality
function showVictoryScreen() {
  const victoryScreen = document.getElementById('victory-screen');
  const gameScreen = document.getElementById('game-screen');
  
  if (victoryScreen && gameScreen) {
    // Hide game screen
    gameScreen.classList.add('hidden');
    
    // Show victory screen
    victoryScreen.classList.remove('hidden');
    
    // Update victory screen content
    updateVictoryScreenContent();
    
    // Start victory vinyl animation
    startVictoryVinylAnimation();
    
    console.log('Victory screen shown');
  }
}

function hideVictoryScreen() {
  const victoryScreen = document.getElementById('victory-screen');
  const gameScreen = document.getElementById('game-screen');
  
  if (victoryScreen && gameScreen) {
    // Hide victory screen
    victoryScreen.classList.add('hidden');
    
    // Show game screen
    gameScreen.classList.remove('hidden');
    
    console.log('Victory screen hidden');
  }
}

function updateVictoryScreenContent() {
  const songTitle = document.getElementById('victory-song-title');
  const artist = document.getElementById('victory-artist');
  const seconds = document.getElementById('victory-seconds');
  
  if (songTitle) {
    songTitle.textContent = gameState.currentSong.title;
  }
  
  if (artist) {
    artist.textContent = gameState.currentSong.artist;
  }
  
  if (seconds) {
    const elapsedTime = getElapsedTime();
    seconds.textContent = elapsedTime;
  }
}

function startVictoryVinylAnimation() {
  const victoryVinyl = document.getElementById('victory-vinyl');
  if (victoryVinyl) {
    // Start continuous idle spin animation
    victoryVinyl.classList.add('spinning');
  }
}

function handleVictoryVinylClick() {
  const victoryVinyl = document.getElementById('victory-vinyl');
  
  if (!victoryVinyl) return;
  
  // Toggle between playing full track and paused
  if (audioManager.isPlaying()) {
    // Stop full track playback
    audioManager.stopPlayback();
    victoryVinyl.classList.remove('playing');
    victoryVinyl.classList.add('spinning'); // Back to idle spin
    console.log('Victory track paused');
  } else {
    // Play full track from beginning
    if (gameState.currentSong.audioUrl || audioManager.currentAudio) {
      audioManager.playSegment(0); // Play full track
      victoryVinyl.classList.remove('spinning');
      victoryVinyl.classList.add('playing'); // Faster spin
      console.log('Victory track playing full song');
    }
  }
}

function handleVictorySpacebarPress(event) {
  if (event.code === 'Space') {
    const victoryScreen = document.getElementById('victory-screen');
    if (!victoryScreen.classList.contains('hidden')) {
      event.preventDefault();
      handleVictoryVinylClick();
    }
  }
}

async function handlePlayAgain() {
  console.log('Starting new game...');
  
  // Hide victory screen
  hideVictoryScreen();
  
  // Stop any audio
  audioManager.stopPlayback();
  
  // Initialize new game
  await initializeNewGame();
  
  // Update UI
  updateGameUI();
  
  // Clear any feedback
  clearFeedback();
  
  // Start new timer
  gameState.gameStartTime = Date.now();
  
  console.log('New game started');
}

// Enhanced Escape key handler for all popups
function handleEscapeKeyEnhanced(event) {
  if (event.key === 'Escape') {
    const howToPlayPopup = document.getElementById('how-to-play-popup');
    const resetPopup = document.getElementById('reset-popup');
    
    if (!howToPlayPopup.classList.contains('hidden')) {
      hideHowToPlayPopup();
    } else if (!resetPopup.classList.contains('hidden')) {
      hideResetConfirmationPopup();
    }
  }
}

// Enhanced popup overlay click handler
function handlePopupOverlayClickEnhanced(event) {
  if (event.target.classList.contains('popup-overlay')) {
    const howToPlayPopup = document.getElementById('how-to-play-popup');
    const resetPopup = document.getElementById('reset-popup');
    
    if (event.target === howToPlayPopup) {
      hideHowToPlayPopup();
    } else if (event.target === resetPopup) {
      hideResetConfirmationPopup();
    }
  }
}

// =====================================
// TEST FUNCTION FOR PLAY/PAUSE ANIMATION
// =====================================

// Test function to demonstrate play/pause animation
// Call this in browser console: testPlayPauseAnimation()
window.testPlayPauseAnimation = function() {
  const vinylCenter = document.querySelector('.vinyl-center');
  const playIcon = document.querySelector('.play-icon');
  
  if (!vinylCenter || !playIcon) {
    console.log('Vinyl elements not found. Make sure you are on the game screen.');
    return;
  }
  
  console.log('Testing play/pause animation...');
  
  // Add playing classes
  vinylCenter.classList.add('playing');
  playIcon.classList.add('playing');
  
  console.log('Animation should now show "playing" state (rotated, scaled)');
  
  // Remove playing classes after 3 seconds
  setTimeout(() => {
    vinylCenter.classList.remove('playing');
    playIcon.classList.remove('playing');
    console.log('Animation returned to "paused" state');
  }, 3000);
};

// Initialize everything when DOM is loaded
init(); 