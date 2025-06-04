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
  
  // Snippet length progression: 2s → 3s → 5s → 8s → 16s
  snippetLengths: [2, 3, 5, 8, 16],
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
  isPlaying: false,
  
  // Song tracking to prevent repeats
  playedSongIds: []        // Array of song IDs that have been played in this session
};

// =====================================
// AUDIO SYSTEM (Phase 4)
// =====================================

// Audio manager object
const audioManager = {
  currentAudio: null,
  isLoaded: false,
  duration: 0,
  snippetTimeoutId: null,
  progressIntervalId: null,
  isVictoryMode: false,
  
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
    
    // Add time update listener for progress tracking
    this.currentAudio.addEventListener('timeupdate', () => {
      this.updateProgress();
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
  playSegment(startTime = 0, duration = null, isVictory = false) {
    if (!this.currentAudio || !this.isLoaded) {
      console.warn('Audio not loaded');
      return false;
    }
    
    // Clear any existing timers
    this.clearTimers();
    
    // Set mode
    this.isVictoryMode = isVictory;
    
    // Set start position
    this.currentAudio.currentTime = startTime;
    
    // Get visual elements for coordination
    const vinylDisc = document.getElementById('vinyl-disc');
    const vinylCenter = vinylDisc?.querySelector('.vinyl-center');
    const playPauseIcon = vinylCenter?.querySelector('.play-pause-icon');
    
    // Play audio
    const playPromise = this.currentAudio.play();
    
    if (playPromise) {
      playPromise.then(() => {
        console.log(`Playing audio from ${startTime}s for ${duration || 'full'}s (Victory: ${isVictory})`);
        gameState.isPlaying = true;
        
        // Now that audio is actually playing, start visual elements
        if (vinylDisc && !isVictory) {
          vinylDisc.classList.add('spinning');
        }
        if (vinylCenter && !isVictory) {
          vinylCenter.classList.add('playing');
        }
        if (playPauseIcon && !isVictory) {
          playPauseIcon.classList.add('playing');
        }
        
        // Start progress tracking for snippets
        if (duration && !isVictory) {
          this.startProgressTracking(duration);
          
          // Set precise timeout to stop after duration
          this.snippetTimeoutId = setTimeout(() => {
            this.stopPlayback();
          }, duration * 1000);
        }
      }).catch((error) => {
        console.error('Audio play failed:', error);
        gameState.isPlaying = false;
        
        // If audio failed, ensure visual elements are reset
        if (vinylDisc) {
          vinylDisc.classList.remove('spinning');
        }
        if (vinylCenter) {
          vinylCenter.classList.remove('playing');
        }
        if (playPauseIcon) {
          playPauseIcon.classList.remove('playing');
        }
      });
    }
    
    return true;
  },
  
  // Start progress tracking for snippet playback
  startProgressTracking(duration) {
    const progressFill = document.getElementById('progress-fill');
    if (!progressFill) return;
    
    // Reset progress bar to 0
    progressFill.style.width = '0%';
    
    const maxDuration = 16; // Progress bar always represents 16 seconds total
    let startTime = this.currentAudio.currentTime;
    
    // Update progress every 50ms for smooth animation
    this.progressIntervalId = setInterval(() => {
      if (!this.currentAudio || this.currentAudio.paused) {
        this.clearProgressTracking();
        return;
      }
      
      const elapsed = this.currentAudio.currentTime - startTime;
      
      // Safeguard: if elapsed time seems incorrect, recalibrate startTime
      if (elapsed < 0) {
        startTime = this.currentAudio.currentTime;
        return;
      }
      
      // Progress is based on snippet duration relative to the full 16 seconds
      const progress = Math.min((elapsed / maxDuration) * 100, (duration / maxDuration) * 100);
      
      progressFill.style.width = `${progress}%`;
      
      // Don't stop tracking here - let the audio timeout handle stopping
      // This ensures the progress bar and vinyl rotation stay synchronized
    }, 50);
  },
  
  // Clear progress tracking
  clearProgressTracking() {
    if (this.progressIntervalId) {
      clearInterval(this.progressIntervalId);
      this.progressIntervalId = null;
    }
  },
  
  // Update progress (called by timeupdate event)
  updateProgress() {
    // This can be used for additional progress tracking if needed
  },
  
  // Clear all timers
  clearTimers() {
    if (this.snippetTimeoutId) {
      clearTimeout(this.snippetTimeoutId);
      this.snippetTimeoutId = null;
    }
    this.clearProgressTracking();
  },
  
  // Stop audio playback
  stopPlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      gameState.isPlaying = false;
      this.clearTimers();
      
      // Update vinyl visual state when stopping
      const vinylDisc = document.getElementById('vinyl-disc');
      const vinylCenter = vinylDisc?.querySelector('.vinyl-center');
      const playPauseIcon = vinylCenter?.querySelector('.play-pause-icon');
      
      if (vinylDisc) {
        vinylDisc.classList.remove('spinning');
      }
      if (vinylCenter) {
        vinylCenter.classList.remove('playing');
      }
      if (playPauseIcon) {
        playPauseIcon.classList.remove('playing');
      }
      
      // Reset progress bar if not in victory mode
      if (!this.isVictoryMode) {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
          progressFill.style.width = '0%';
        }
      }
      
      console.log('Audio playback stopped and vinyl visual state updated');
    }
  },
  
  // Pause audio (for victory screen toggle)
  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      gameState.isPlaying = false;
      this.clearTimers();
      console.log('Audio playback paused');
    }
  },
  
  // Resume audio (for victory screen toggle)
  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      const playPromise = this.currentAudio.play();
      if (playPromise) {
        playPromise.then(() => {
          gameState.isPlaying = true;
          console.log('Audio playback resumed');
        }).catch((error) => {
          console.error('Audio resume failed:', error);
        });
      }
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
        console.log("Loading song database...");
        const response = await fetch('assets/songs/song_metadata.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        songDatabase = await response.json();
        console.log(`Song database loaded: ${songDatabase.length} songs available`);
        
        // Initialize played songs tracking
        const playedSongs = songDatabase.filter(song => song.id !== undefined);
        if (playedSongs.length === 0) {
            console.warn('No songs with valid IDs found in database');
        }
        
    } catch (error) {
        console.error('Failed to load song database:', error);
        throw error;
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
  const audioUrl = `assets/songs/${selectedSong.filename}`;
  
  return {
    id: selectedSong.id,
    title: selectedSong.title,
    artist: selectedSong.artist,
    filename: selectedSong.filename,
    audioUrl: audioUrl
  };
}

// Get random song with fallback options, excluding already played songs
async function getRandomSongWithFallback(excludePlayedSongs = true) {
  if (songDatabase.length === 0) {
    console.error('Song database is empty');
    return null;
  }
  
  // Filter out already played songs if requested
  let availableSongs = songDatabase;
  if (excludePlayedSongs && gameState.playedSongIds.length > 0) {
    availableSongs = songDatabase.filter(song => !gameState.playedSongIds.includes(song.id));
    
    // If all songs have been played, reset the played list and use all songs
    if (availableSongs.length === 0) {
      console.log('All songs have been played, resetting played songs list');
      gameState.playedSongIds = [];
      availableSongs = songDatabase;
    }
  }
  
  console.log(`Available songs: ${availableSongs.length} out of ${songDatabase.length} total`);
  
  // Try up to 3 different songs to find one that loads successfully
  for (let attempt = 0; attempt < 3; attempt++) {
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const song = availableSongs[randomIndex];
    
    // Construct the audio URL using the filename
    const audioUrl = `assets/songs/${song.filename}`;
    const songWithUrl = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      filename: song.filename,
      audioUrl: audioUrl
    };
    
    try {
      // Test if the audio file is accessible
      const response = await fetch(songWithUrl.audioUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Selected song: "${songWithUrl.title}" by ${songWithUrl.artist}`);
        
        // Add to played songs list
        if (!gameState.playedSongIds.includes(songWithUrl.id)) {
          gameState.playedSongIds.push(songWithUrl.id);
        }
        
        return songWithUrl;
      } else {
        console.warn(`Audio file not accessible: ${song.filename} (attempt ${attempt + 1})`);
      }
    } catch (error) {
      console.warn(`Failed to check audio file: ${song.filename} (attempt ${attempt + 1})`, error);
    }
  }
  
  // If all attempts fail, return the last song anyway and let audio loading handle the error
  console.warn('Could not verify any audio files, proceeding with last selected song');
  const fallbackSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
  const audioUrl = `assets/songs/${fallbackSong.filename}`;
  const songWithUrl = {
    id: fallbackSong.id,
    title: fallbackSong.title,
    artist: fallbackSong.artist,
    filename: fallbackSong.filename,
    audioUrl: audioUrl
  };
  
  // Add to played songs list
  if (!gameState.playedSongIds.includes(songWithUrl.id)) {
    gameState.playedSongIds.push(songWithUrl.id);
  }
  
  return songWithUrl;
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
    guessInput.disabled = false; // Ensure input is enabled
    guessInput.style.opacity = '1';
  }
  
  // Reset search state completely
  searchState.lastQuery = '';
  searchState.filteredSongs = [];
  searchState.currentHighlight = -1;
  searchState.isVisible = false;
  hideSearchSuggestions();
  
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

// Initialize new game with a different song (for "Next Round?" functionality)
async function initializeNewGameWithDifferentSong(previousSongId) {
  // Reset game state (but preserve timer for next round)
  gameState.currentTurn = 0;
  gameState.currentSnippetIndex = 0;
  gameState.guessedSongs = [];
  gameState.status = 'playing';
  // Don't reset timer here - it will be set when the next round starts
  // Keep timer state preserved until new round actually starts
  gameState.isPlaying = false;
  
  // Clear previous feedback and input
  clearFeedback();
  const guessInput = document.getElementById('guess-input');
  if (guessInput) {
    guessInput.value = '';
    guessInput.disabled = false; // Ensure input is enabled
    guessInput.style.opacity = '1';
  }
  
  // Reset search state completely
  searchState.lastQuery = '';
  searchState.filteredSongs = [];
  searchState.currentHighlight = -1;
  searchState.isVisible = false;
  hideSearchSuggestions();
  
  // Get a new song (the function will automatically exclude already played songs)
  const selectedSong = await getRandomSongWithFallback(true);
  
  if (!selectedSong) {
    console.error('No songs available in database');
    return;
  }
  
  gameState.currentSong = selectedSong;
  console.log('Next round initialized with new song:', gameState.currentSong.title, 'by', gameState.currentSong.artist);
  console.log('Played songs so far:', gameState.playedSongIds.length, 'out of', songDatabase.length);
  
  // Load audio file
  try {
    await audioManager.loadAudio(gameState.currentSong.audioUrl);
    console.log('Audio loaded successfully for next round:', gameState.currentSong.title);
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

// Progress to next turn (increment turn counter only)
function progressToNextTurn() {
  if (gameState.currentTurn < gameState.maxTurns - 1) {
    gameState.currentTurn++;
    console.log(`Progressed to turn ${gameState.currentTurn + 1}, snippet length remains: ${getCurrentSnippetLength()}s`);
    updateGameUI();
    return true;
  }
  
  // Game over - no more turns
  gameState.status = 'lost';
  console.log('Game over - no more turns remaining');
  updateGameUI();
  return false;
}

// Progress snippet length (for skips only)
function progressSnippetLength() {
  if (gameState.currentSnippetIndex < gameState.snippetLengths.length - 1) {
    gameState.currentSnippetIndex++;
    console.log(`Snippet length increased to: ${getCurrentSnippetLength()}s`);
    
    // Animate marker transition when snippet changes
    if (progressMarkers && progressMarkers.animateMarkerTransition) {
      progressMarkers.animateMarkerTransition();
    }
    
    return true;
  }
  
  console.log('Already at maximum snippet length');
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
    
    // Auto scroll to show the success message
    setTimeout(() => {
      console.log('🎯 Triggering scroll after correct guess');
      scrollToLatestAttempt();
    }, 300); // Brief delay to let feedback render
    
    // Show victory screen after scroll and brief display duration
    setTimeout(() => {
      showVictoryScreen();
    }, 2000); // Increased time for scroll + display duration
  } else {
    // Incorrect guess - trigger animations first, then scroll to show the feedback
    console.log('❌ Incorrect guess! Starting error sequence with animations then scroll');
    
    // 1. Prepare feedback message
    const guessedSongInfo = findBestMatchingSong(guess);
    let feedbackMessage;
    
    if (guessedSongInfo) {
      // Show the matched song from database in proper format
      feedbackMessage = `${guessedSongInfo.artist} - ${guessedSongInfo.title}`;
    } else {
      // Show the raw guess in a formatted way
      feedbackMessage = formatGuessAsSong(guess);
    }
    
    // 2. Show feedback BEFORE progressing turn to get correct attempt number
    showFeedback('incorrect-guess', feedbackMessage);
    
    // 3. Trigger error animation immediately (simultaneous red background + shake)
    triggerErrorAnimation();
    
    // 4. Scroll to show the new feedback after animations complete
    setTimeout(() => {
      console.log('🎯 Triggering scroll after incorrect guess animations');
      scrollToLatestAttempt();
    }, 700); // Wait for animations to finish (500ms shake + 200ms buffer)
    
    // 5. Progress to next turn (increment turn counter only, snippet length stays the same)
    const canContinue = progressToNextTurn();
    
    // 6. Redirect to loss state if no more turns
    if (!canContinue) {
      setTimeout(() => {
        // Set game status to lost
        gameState.status = 'lost';
        // Redirect to loss state after 1.2 s
        setTimeout(() => {
          showLossScreen();
        }, 1200);
      }, 700); // Wait for auto-scroll to complete
    }
  }
  
  updateGameUI();
  return true;
}

// Helper function to find the best matching song from database for feedback (Phase 5.5)
function findBestMatchingSong(guess) {
  if (songDatabase.length === 0) return null;
  
  const normalizeString = (str) => {
    return str.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  };
  
  const normalizedGuess = normalizeString(guess);
  
  // Try to find exact matches first
  for (const song of songDatabase) {
    const normalizedTitle = normalizeString(song.title);
    const normalizedArtist = normalizeString(song.artist);
    
    if (normalizedGuess === normalizedTitle || 
        normalizedGuess === normalizedArtist ||
        normalizedGuess === `${normalizedArtist} ${normalizedTitle}` ||
        normalizedGuess === `${normalizedTitle} ${normalizedArtist}`) {
      return song;
    }
  }
  
  // Try partial matches
  for (const song of songDatabase) {
    const normalizedTitle = normalizeString(song.title);
    const normalizedArtist = normalizeString(song.artist);
    const combinedSong = `${normalizedArtist} ${normalizedTitle}`;
    
    if (normalizedGuess.includes(normalizedTitle) && normalizedTitle.length >= 3 ||
        normalizedGuess.includes(normalizedArtist) && normalizedArtist.length >= 3 ||
        combinedSong.includes(normalizedGuess) && normalizedGuess.length >= 3) {
      return song;
    }
  }
  
  return null;
}

// Helper function to format a raw guess as a song (Phase 5.5)
function formatGuessAsSong(guess) {
  const trimmedGuess = guess.trim();
  
  // Try to detect if the guess contains both artist and title
  // Common patterns: "Artist - Title", "Artist: Title", "Title by Artist"
  if (trimmedGuess.includes(' - ')) {
    return trimmedGuess; // Already in correct format
  } else if (trimmedGuess.includes(' by ')) {
    const parts = trimmedGuess.split(' by ');
    if (parts.length === 2) {
      return `${parts[1].trim()} - ${parts[0].trim()}`;
    }
  } else if (trimmedGuess.includes(': ')) {
    const parts = trimmedGuess.split(': ');
    if (parts.length === 2) {
      return `${parts[0].trim()} - ${parts[1].trim()}`;
    }
  }
  
  // If no clear pattern, treat the whole guess as a title with unknown artist
  return `Unknown Artist - ${trimmedGuess}`;
}

// Enhanced guess validation with strict matching (only exact matches allowed)
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
  const combinedCorrect = `${normalizedArtist} ${normalizedTitle}`;
  const combinedCorrectAlt = `${normalizedTitle} ${normalizedArtist}`;
  
  // Only allow exact matches to prevent false wins from partial input
  return normalizedGuess === normalizedTitle || 
         normalizedGuess === normalizedArtist ||
         normalizedGuess === combinedCorrect ||
         normalizedGuess === combinedCorrectAlt;
}

// Enhanced skip processing (Phase 5)
function processSkip() {
  if (gameState.status !== 'playing') {
    return false;
  }
  
  console.log('Skip action processed');
  
  // Stop any currently playing audio
  audioManager.stopPlayback();
  
  // Show skip feedback BEFORE progressing turn to get correct attempt number
  showFeedback('skipped', 'Skipped');
  
  // Scroll to show the new skip feedback immediately
  setTimeout(() => {
    console.log('🎯 Triggering scroll after skip action');
    scrollToLatestAttempt();
  }, 300); // Brief delay to let feedback render
  
  // Progress snippet length for skips FIRST (before updating UI)
  progressSnippetLength();
  
  // Progress to next turn (increment turn counter)
  const canContinue = progressToNextTurn();
  
  if (!canContinue) {
    // Game over - no more turns, redirect to loss state
    setTimeout(() => {
      // Set game status to lost
      gameState.status = 'lost';
      // Redirect to loss state after 250ms
      setTimeout(() => {
        showLossScreen();
      }, 250);
    }, 300); // Wait for skip feedback to show
  } else {
    // Automatically play the next, longer snippet after feedback is shown
    setTimeout(() => {
      if (gameState.status === 'playing') {
        handleVinylClick();
      }
    }, 1000); // Give more time for scroll and feedback to show
  }
  
  return true;
}



// Enhanced UI updates based on current game state (Phase 5)
function updateGameUI() {
  const skipButton = document.getElementById('skip-button');
  const submitButton = document.getElementById('submit-button');
  const guessInput = document.getElementById('guess-input');
  
  if (!skipButton || !submitButton || !guessInput) return;
  
  // Update skip button text and state
  const nextLength = getNextSnippetLength();
  if (gameState.status === 'playing') {
    if (gameState.currentTurn < gameState.maxTurns - 1 && nextLength !== null) {
      // Can skip and will get longer snippet
      skipButton.textContent = `Skip (${nextLength}s)`;
      skipButton.disabled = false;
      skipButton.style.opacity = '1';
    } else if (gameState.currentTurn < gameState.maxTurns - 1) {
      // Can skip but already at max snippet length
      skipButton.textContent = 'Skip (max length)';
      skipButton.disabled = false;
      skipButton.style.opacity = '1';
    } else {
      // Last turn - no more skips available
      skipButton.textContent = 'No more skips';
      skipButton.disabled = true;
      skipButton.style.opacity = '0.6';
    }
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
    console.log('Input disabled - game not playing');
  } else {
    guessInput.disabled = false;
    guessInput.style.opacity = '1';
    guessInput.placeholder = searchState.originalPlaceholder;
    console.log('Input enabled - game is playing');
  }
  
  // Update submit button state (this also calls updateSubmitButtonState)
  updateSubmitButtonState();
  
  // Update progress markers state
  if (progressMarkers && progressMarkers.updateMarkerStates) {
    progressMarkers.updateMarkerStates();
  }
  
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
  
  // Add landing-active class to body to hide scroll
  document.body.classList.add('landing-active');
  
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
  
  // Mark that this popup was opened from initial play (not gear button)
  popup.dataset.openedFromGear = 'false';
  
  // Show game screen underneath
  gameScreen.classList.remove('hidden');
  
  // Show popup immediately (we'll handle the delay later)
  popup.classList.remove('hidden');
}

// Show "How to Play?" popup without resetting the game (for gear button)
function showHowToPlayPopupOnly() {
  const popup = document.getElementById('how-to-play-popup');
  
  // Mark that this popup was opened from gear button (not initial play)
  popup.dataset.openedFromGear = 'true';
  
  // Just show the popup without any game state changes
  popup.classList.remove('hidden');
}

// Transition from landing page to game screen
async function transitionToGameScreen() {
  const landingPage = document.getElementById('landing-page');
  const gameScreen = document.getElementById('game-screen');
  
  console.log('Transitioning to game screen...');
  
  // Remove landing-active class to enable scrolling for game screen
  document.body.classList.remove('landing-active');
  
  // Hide landing page
  landingPage.classList.add('hidden');
  
  // Show game screen
  gameScreen.classList.remove('hidden');
  
  console.log('Game screen visible, classes:', gameScreen.className);
  
  // Initialize audio manager
  audioManager.init();
  
  // Initialize new game
  await initializeNewGame();
  
  console.log('Game initialized, showing popup in 500ms');
  
  // Show popup after brief delay
  setTimeout(() => {
    showHowToPlayPopupWithTransition();
  }, 500);
}

// Show "How to Play?" popup with smooth transition (for initial game start)
function showHowToPlayPopupWithTransition() {
  const popup = document.getElementById('how-to-play-popup');
  
  // Mark that this popup was opened from game screen (second time)
  popup.dataset.openedFromGear = 'game-screen';
  
  // Add transition class for smooth appearance
  popup.style.opacity = '0';
  popup.classList.remove('hidden');
  
  // Animate in
  setTimeout(() => {
    popup.style.transition = 'opacity 0.3s ease-out';
    popup.style.opacity = '1';
  }, 50);
}

// Hide "How to Play?" popup (legacy function, kept for compatibility)
async function hideHowToPlayPopup() {
  // This function is now handled by transitionToGameScreen()
  await transitionToGameScreen();
}

// Hide "How to Play?" popup without resetting the game (for gear button)
function hideHowToPlayPopupOnly() {
  const popup = document.getElementById('how-to-play-popup');
  
  // Just hide the popup without any game state changes
  popup.classList.add('hidden');
}

// Phase 4: Vinyl player functionality with real audio integration
function handleVinylClick() {
  const vinylDisc = document.getElementById('vinyl-disc');
  const vinylCenter = vinylDisc.querySelector('.vinyl-center');
  const playPauseIcon = vinylCenter.querySelector('.play-pause-icon');
  
  // Only allow playing if game is active
  if (gameState.status !== 'playing') return;
  
  // Toggle between play and stop
  if (gameState.isPlaying || audioManager.isPlaying()) {
    // Stop current playback
    audioManager.stopPlayback();
    vinylDisc.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    playPauseIcon.classList.remove('playing');
    gameState.isPlaying = false;
    return;
  }
  
  // Start playing audio segment
  const snippetLength = getCurrentSnippetLength();
  const startTime = 0; // Start from beginning for now (could be randomized later)
  
  console.log(`Playing ${snippetLength}s snippet from ${startTime}s`);
  
  // Play the actual audio segment and coordinate visual elements
  const playSuccess = audioManager.playSegment(startTime, snippetLength, false);
  
  if (!playSuccess) {
    console.warn('Failed to play audio segment');
    return;
  }
  
  // Only start visual feedback after confirming audio will attempt to play
  // The audioManager will handle the actual coordination in its Promise resolution
}

// Add spacebar support for vinyl player
function handleSpacebarPress(event) {
  if (event.code === 'Space') {
    // Only trigger if not typing in input field
    const activeElement = document.activeElement;
    const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
    
    if (!isTyping) {
      // Prevent default spacebar scroll behavior only when not typing
      event.preventDefault();
      handleVinylClick();
    }
  }
}

// Smooth scroll to the latest attempt feedback
function scrollToLatestAttempt() {
  console.log('🔄 scrollToLatestAttempt called');
  
  const feedbackContainer = document.getElementById('feedback-container');
  
  if (!feedbackContainer) {
    console.log('❌ Feedback container not found for latest attempt scroll');
    return;
  }
  
  // Wait a moment for DOM to update, then scroll
  setTimeout(() => {
    // Get the last feedback item
    const feedbackItems = feedbackContainer.querySelectorAll('.feedback-item');
    const lastFeedbackItem = feedbackItems[feedbackItems.length - 1];
    
    console.log('📋 Found feedback items:', feedbackItems.length);
    
    if (lastFeedbackItem) {
      // Force a layout recalculation
      feedbackContainer.offsetHeight;
      lastFeedbackItem.offsetHeight;
      
      // Get the feedback container's position relative to the document
      const containerRect = feedbackContainer.getBoundingClientRect();
      const itemRect = lastFeedbackItem.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll target to show the feedback area prominently
      // Scroll to show the feedback container with some padding from the top
      const scrollTarget = window.scrollY + containerRect.top - 100;
      
      console.log('📍 Scroll calculation:', {
        feedbackItemsCount: feedbackItems.length,
        scrollTarget: scrollTarget,
        currentScrollY: window.scrollY,
        containerTop: containerRect.top,
        containerBottom: containerRect.bottom,
        itemTop: itemRect.top,
        itemBottom: itemRect.bottom,
        viewportHeight: viewportHeight
      });
      
      // Force scroll to the feedback area
      window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });
      
      // Also try scrollIntoView as a backup
      setTimeout(() => {
        lastFeedbackItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
      
      console.log('✅ Scrolling to latest attempt initiated (with backup scrollIntoView)');
    } else {
      console.log('❌ No feedback items found for scrolling');
    }
  }, 100); // Slightly longer delay to ensure DOM is fully updated
}

// Enhanced error animation system for incorrect guesses
function triggerErrorAnimation() {
  const gameScreen = document.getElementById('game-screen');
  const gameMain = document.querySelector('.game-main');
  const vinylCenter = document.querySelector('.vinyl-center');
  
  if (!gameScreen || !gameMain) {
    console.warn('Could not find game screen or game main element for error animation');
    return;
  }
  
  console.log('🔴 Triggering error animation: content shake + solid red background + vinyl center flash');
  
  // Add shake animation to content container and solid red background to screen
  gameMain.classList.add('error-horizontal-shake');
  gameScreen.classList.add('error-background-static');
  
  // Add vinyl center red flash animation if vinyl center exists
  if (vinylCenter) {
    vinylCenter.classList.add('error-vinyl-center-flash');
  }
  
  console.log('Added animation classes:', {
    gameMainClasses: gameMain.className,
    gameScreenClasses: gameScreen.className,
    vinylCenterClasses: vinylCenter?.className
  });
  
  // Remove shake animation class after 500ms
  setTimeout(() => {
    gameMain.classList.remove('error-horizontal-shake');
    console.log('🔴 Removed shake animation class from content');
  }, 500);
  
  // Remove background static class after 500ms (same duration as shake)
  setTimeout(() => {
    gameScreen.classList.remove('error-background-static');
    console.log('🔴 Removed background static animation class');
  }, 500);
  
  // Remove vinyl center flash class after 500ms (same duration as other animations)
  setTimeout(() => {
    if (vinylCenter) {
      vinylCenter.classList.remove('error-vinyl-center-flash');
      console.log('🔴 Removed vinyl center flash animation class');
    }
  }, 500);
}

// Enhanced feedback display system (Phase 5.5 - Persistent & Scrollable)
function showFeedback(type, message) {
  const feedbackContainer = document.getElementById('feedback-container');
  const gameScreen = document.getElementById('game-screen');
  
  if (!feedbackContainer) {
    // Fallback to old system if new container doesn't exist
    showLegacyFeedback(type, message);
    return;
  }
  
  const isFirstFeedback = feedbackContainer.children.length === 0;
  
  // Show the feedback container with animation if this is the first feedback
  if (isFirstFeedback) {
    feedbackContainer.classList.add('visible');
    // Add has-feedback class to body and game screen to enable scrolling
    document.body.classList.add('has-feedback');
    if (gameScreen) {
      gameScreen.classList.add('has-feedback');
    }
  }
  
  // Calculate attempt number (current turn + 1, since we're showing the result of the current attempt)
  const attemptNumber = gameState.currentTurn + 1;
  const isLastAttempt = attemptNumber === gameState.maxTurns;
  
  // Create feedback item element
  const feedbackItem = document.createElement('div');
  feedbackItem.className = `feedback-item ${type} attempt-${attemptNumber}`;
  
  // Set message content
  feedbackItem.textContent = message;
  
  // Only add attempt badge for actual attempts (not game over messages)
  if (type !== 'game-over') {
    // Create attempt number badge
    const attemptBadge = document.createElement('div');
    attemptBadge.className = 'attempt-number';
    
    if (isLastAttempt) {
      attemptBadge.textContent = 'LAST ATTEMPT';
    } else {
      const ordinals = ['', 'FIRST ATTEMPT', 'SECOND ATTEMPT', 'THIRD ATTEMPT', 'FOURTH ATTEMPT'];
      attemptBadge.textContent = ordinals[attemptNumber] || `ATTEMPT ${attemptNumber}`;
    }
    
    // Add the attempt badge to the feedback item
    feedbackItem.appendChild(attemptBadge);
  }
  
  // Add to container at the end (newest at bottom)
  feedbackContainer.appendChild(feedbackItem);
  
  // Don't auto-scroll here - let the calling function handle scrolling timing
  // This prevents conflicts with manual scroll calls
  
  // For first feedback, delay the item animation to sync with scroll
  if (isFirstFeedback) {
    feedbackItem.style.animationDelay = '0.3s'; // Faster sync with scroll completion
  } else {
    feedbackItem.style.animationDelay = '0.1s'; // Much shorter delay for subsequent attempts
  }
  
  // Phase 5.5: Feedback items now persist for the entire game round
  // No auto-removal - they stay visible until game reset or new round
  
  console.log(`Persistent feedback displayed: ${type} - ${message} (Attempt ${attemptNumber})`);
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

// Smooth scroll to feedback area (gentle auto-scroll that respects user control)
function smoothScrollToFeedback() {
  const feedbackContainer = document.getElementById('feedback-container');
  
  if (!feedbackContainer) {
    console.log('Feedback container not found');
    return;
  }
  
  // Wait for the feedback container to be visible and positioned
  setTimeout(() => {
    // Get the last feedback item to scroll to the newest one
    const feedbackItems = feedbackContainer.querySelectorAll('.feedback-item');
    const lastFeedbackItem = feedbackItems[feedbackItems.length - 1];
    
    if (lastFeedbackItem) {
      // Force a layout recalculation
      feedbackContainer.offsetHeight;
      
      // Calculate scroll position to show the newest feedback item
      const containerRect = feedbackContainer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      console.log('Feedback container position:', {
        top: containerRect.top,
        bottom: containerRect.bottom,
        viewportHeight: viewportHeight,
        scrollY: window.scrollY
      });
      
      // Only auto-scroll if the feedback is not visible or barely visible
      // This gives users more control over their scroll position
      if (containerRect.top > viewportHeight * 0.8 || containerRect.bottom < viewportHeight * 0.2) {
        // Position the feedback container in a comfortable viewing area
        const scrollTarget = window.scrollY + containerRect.top - (viewportHeight * 0.4);
        
        // Gentle smooth scroll to the target position
        window.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
        
        console.log('Auto-scrolling to feedback area (gentle), target:', scrollTarget);
      } else {
        console.log('Feedback already visible, skipping auto-scroll to preserve user control');
      }
    } else {
      console.log('No feedback items found');
    }
  }, 200);
}

// Clear all feedback messages
function clearFeedback() {
  const feedbackContainer = document.getElementById('feedback-container');
  const gameScreen = document.getElementById('game-screen');
  
  if (feedbackContainer) {
    feedbackContainer.innerHTML = '';
    feedbackContainer.classList.remove('visible');
  }
  
  // Remove has-feedback class from body and game screen to reset layout
  document.body.classList.remove('has-feedback');
  if (gameScreen) {
    gameScreen.classList.remove('has-feedback');
  }
  
  // Don't force scroll to top - let users maintain their scroll position
  // This gives users more autonomy over their viewing experience
  
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
  
  // Only allow submission if the input exactly matches a song from the database
  const exactMatch = findExactSongMatch(guessValue);
  if (!exactMatch) {
    // Check if it's a valid song that was already guessed
    const isAlreadyGuessed = checkIfSongAlreadyGuessed(guessValue);
    showSearchValidationMessage(isAlreadyGuessed);
    return;
  }
  
  // Process guess through game logic
  processGuess(guessValue);
  
  // Don't clear input immediately - let user see what they submitted
  // Clear it after a short delay to allow for continued searching
  setTimeout(() => {
    if (guessInput && gameState.status === 'playing') {
      guessInput.value = '';
      
      // Completely reset input styling to ensure it's functional
      guessInput.disabled = false;
      guessInput.style.opacity = '1';
      guessInput.style.backgroundColor = '#ffffff'; // Force white background
      guessInput.style.borderColor = '';
      guessInput.style.boxShadow = '';
      guessInput.placeholder = searchState.originalPlaceholder;
      
      // Reset search state to ensure dropdown works for next search
      searchState.lastQuery = '';
      searchState.filteredSongs = [];
      searchState.currentHighlight = -1;
      searchState.isVisible = false;
      hideSearchSuggestions();
      
      // Force focus and ensure input is ready
      guessInput.focus();
      guessInput.click(); // Additional trigger to ensure responsiveness
      
      console.log('Input cleared and search state reset for next guess');
      console.log('Input state after reset:', {
        disabled: guessInput.disabled,
        value: guessInput.value,
        focused: document.activeElement === guessInput,
        backgroundColor: guessInput.style.backgroundColor
      });
    }
  }, 500);
}

// Play button click handler
function handlePlayButtonClick() {
  // Directly transition to game screen and show popup after delay
  transitionToGameScreen();
}

// Ready button click handler
function handleReadyButtonClick() {
  const howToPlayPopup = document.getElementById('how-to-play-popup');
  const gameScreen = document.getElementById('game-screen');
  
  console.log('Ready button clicked, popup opened from:', howToPlayPopup.dataset.openedFromGear);
  
  // Check if popup was opened from gear button or game screen
  if (howToPlayPopup.dataset.openedFromGear === 'true') {
    // Opened from gear button - just hide
    hideHowToPlayPopupOnly();
  } else {
    // Opened from game screen or initial play - hide and start timer
    howToPlayPopup.classList.add('hidden');
    howToPlayPopup.style.opacity = '';
    howToPlayPopup.style.transition = '';
    
    // Ensure game screen is visible
    gameScreen.classList.remove('hidden');
    
    console.log('Game screen should now be visible, starting timer');
    
    // Start game timer when user is ready
    startGameTimer();
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
  
  // Loss screen elements
  const lossVinyl = document.getElementById('loss-vinyl');
  if (lossVinyl) {
    lossVinyl.addEventListener('click', handleLossVinylClick);
  }
  
  const lossPlayAgainButton = document.getElementById('loss-play-again-button');
  if (lossPlayAgainButton) {
    lossPlayAgainButton.addEventListener('click', handleLossPlayAgain);
  }
  
  // Phase 6: Help button (gear icon) to reopen "How to Play?" popup
  const helpButton = document.getElementById('help-button');
  if (helpButton) {
    helpButton.addEventListener('click', showHowToPlayPopupOnly);
  }
  
  // Enhanced Escape key handler (Phase 6)
  document.addEventListener('keydown', handleEscapeKeyEnhanced);
  
  // Phase 4: Spacebar for vinyl player + Phase 6: Victory screen spacebar + Loss screen spacebar
  document.addEventListener('keydown', handleSpacebarPress);
  document.addEventListener('keydown', handleVictorySpacebarPress);
  document.addEventListener('keydown', handleLossSpacebarPress);
  
  // Enhanced Ctrl+K handler for modal search
  document.addEventListener('keydown', handleCtrlKPress);
  
  // Individual key press handlers for button visual feedback  
  document.addEventListener('keydown', handleIndividualKeyPress);
  document.addEventListener('keyup', handleIndividualKeyRelease);
  
  // Enhanced popup overlay click handlers (Phase 6)
  const howToPlayPopup = document.getElementById('how-to-play-popup');
  if (howToPlayPopup) {
    howToPlayPopup.addEventListener('click', handlePopupOverlayClickEnhanced);
  }
  
  const resetPopup = document.getElementById('reset-popup');
  if (resetPopup) {
    resetPopup.addEventListener('click', handlePopupOverlayClickEnhanced);
  }
  
  // Modal search overlay click handler
  const searchModal = document.getElementById('search-modal');
  if (searchModal) {
    searchModal.addEventListener('click', handleModalOverlayClick);
  }
  
  // Individual Ctrl and K button click handlers
  initializeKeyboardShortcutButtons();
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
  
  // Initialize modal search functionality
  initializeModalSearchInput();
  
  // Initialize progress markers functionality
  progressMarkers.init();
  
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
  lastQuery: '',
  originalPlaceholder: 'Know it? Search for title/artist…',
  lastNavigationTime: 0 // Add timestamp to prevent rapid navigation calls
};

// Modal search state
const modalSearchState = {
  isVisible: false,
  currentHighlight: -1,
  filteredSongs: [],
  lastQuery: '',
  isActive: false
};

// Keyboard shortcut state for individual button tracking
const keyboardShortcutState = {
  ctrlPressed: false,
  kPressed: false,
  pressedButtons: new Set() // Track which buttons are currently pressed
};

// Enhanced search box functionality with live suggestions
function initializeSearchBox() {
  const guessInput = document.getElementById('guess-input');
  
  if (!guessInput) return;
  
  // Prevent duplicate event listeners
  if (guessInput.dataset.searchInitialized === 'true') {
    console.log('Search box already initialized, skipping');
    return;
  }
  guessInput.dataset.searchInitialized = 'true';
  
  // Input validation and formatting with live search
  guessInput.addEventListener('input', (event) => {
    const value = event.target.value;
    
    console.log('Input event fired:', {
      value: value,
      disabled: event.target.disabled,
      gameStatus: gameState.status
    });
    
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
      
      // If suggestions are visible
      if (searchState.isVisible && searchState.filteredSongs.length > 0) {
        // If a suggestion is highlighted, select it
        if (searchState.currentHighlight >= 0) {
          selectSuggestion(searchState.currentHighlight);
        } else {
          // Auto-select the first available (non-guessed) song
          const firstAvailableIndex = searchState.filteredSongs.findIndex(song => !song.isAlreadyGuessed);
          if (firstAvailableIndex >= 0) {
            selectSuggestion(firstAvailableIndex);
          }
        }
      } else {
        // No suggestions visible - try direct submission
        const value = guessInput.value.trim();
        if (value && gameState.status === 'playing') {
          const exactMatch = findExactSongMatch(value);
          if (exactMatch) {
            // Show clear feedback that the song was selected
            showSongSelectionFeedback(exactMatch);
            // Small delay before submission to show the feedback
            setTimeout(() => {
              handleSubmitClick();
            }, 300);
          } else {
            // Check if it's a valid song that was already guessed
            const isAlreadyGuessed = checkIfSongAlreadyGuessed(value);
            showSearchValidationMessage(isAlreadyGuessed);
          }
        }
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation(); // Prevent other handlers from interfering
      if (searchState.isVisible) {
        console.log('⬇️ ArrowDown pressed - calling navigateSuggestions(1)');
        navigateSuggestions(1); // Down arrow moves to next item (index + 1)
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation(); // Prevent other handlers from interfering
      if (searchState.isVisible) {
        console.log('⬆️ ArrowUp pressed - calling navigateSuggestions(-1)');
        navigateSuggestions(-1); // Up arrow moves to previous item (index - 1)
      }
    } else if (event.key === 'Escape') {
      hideSearchSuggestions();
      guessInput.blur();
    }
  });
  
  // Initialize suggestions container click handling
  initializeSuggestionsContainer();
  
  // Add additional event listeners to ensure input responsiveness
  guessInput.addEventListener('click', () => {
    console.log('Input clicked, ensuring focus and functionality');
    if (!guessInput.disabled && gameState.status === 'playing') {
      guessInput.focus();
      if (guessInput.value.trim()) {
        handleSearchInput(guessInput.value);
      }
    }
  });
  
  // Add keyup listener as backup for input events
  guessInput.addEventListener('keyup', (event) => {
    if (!guessInput.disabled && gameState.status === 'playing') {
      console.log('Keyup event:', event.key, 'Value:', guessInput.value);
      handleSearchInput(guessInput.value);
    }
  });
}

// Handle search input and filter suggestions
function handleSearchInput(query) {
  const trimmedQuery = query.trim();
  
  console.log('handleSearchInput called with:', {
    query: query,
    trimmedQuery: trimmedQuery,
    gameStatus: gameState.status,
    currentTurn: gameState.currentTurn
  });
  
  if (trimmedQuery.length === 0) {
    hideSearchSuggestions();
    // Reset placeholder when input is cleared
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
      guessInput.placeholder = searchState.originalPlaceholder;
    }
    return;
  }
  
  if (trimmedQuery === searchState.lastQuery) {
    console.log('Query unchanged, skipping');
    return; // No change
  }
  
  searchState.lastQuery = trimmedQuery;
  searchState.filteredSongs = filterSongs(trimmedQuery);
  searchState.currentHighlight = -1;
  
  // Reset placeholder when user is actively typing
  const guessInput = document.getElementById('guess-input');
  if (guessInput && query.length > 0) {
    guessInput.placeholder = searchState.originalPlaceholder;
  }
  
  console.log('Filtered songs:', searchState.filteredSongs.length);
  
  if (searchState.filteredSongs.length > 0) {
    renderSuggestions();
    showSearchSuggestions();
    console.log('Showing suggestions dropdown');
  } else {
    hideSearchSuggestions();
    console.log('No songs found, hiding suggestions');
  }
}

// Filter songs based on search query, including already guessed songs with special marking
function filterSongs(query) {
  if (songDatabase.length === 0) return [];
  
  const normalizedQuery = normalizeSearchString(query);
  
  // Get list of already guessed song IDs
  const guessedSongIds = getGuessedSongIds();
  
  return songDatabase.filter(song => {
    const normalizedTitle = normalizeSearchString(song.title);
    const normalizedArtist = normalizeSearchString(song.artist);
    
    return normalizedTitle.includes(normalizedQuery) || 
           normalizedArtist.includes(normalizedQuery);
  }).map(song => ({
    ...song,
    isAlreadyGuessed: guessedSongIds.includes(song.id)
  })).slice(0, 8); // Limit to 8 suggestions
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
    suggestionItem.className = song.isAlreadyGuessed 
      ? 'suggestion-item already-guessed' 
      : 'suggestion-item';
    suggestionItem.dataset.index = index;
    
    suggestionItem.innerHTML = `
      <div class="song-title">${escapeHtml(song.title)}</div>
      <div class="song-artist">${escapeHtml(song.artist)}</div>
    `;
    
    // Add click handler only for songs that haven't been guessed
    if (!song.isAlreadyGuessed) {
      suggestionItem.addEventListener('click', () => {
        selectSuggestion(index);
      });
      
      // Add hover handler
      suggestionItem.addEventListener('mouseenter', () => {
        highlightSuggestion(index);
      });
    } else {
      // For already guessed songs, show they're not selectable
      suggestionItem.style.cursor = 'not-allowed';
    }
    
    suggestionsList.appendChild(suggestionItem);
  });
}

// Show search suggestions dropdown
function showSearchSuggestions() {
  const searchSuggestions = document.getElementById('search-suggestions');
  if (searchSuggestions && searchState.filteredSongs.length > 0) {
    searchSuggestions.classList.add('visible');
    searchState.isVisible = true;
    
    // Always start with no highlight - let user navigate with arrow keys
    searchState.currentHighlight = -1;
    
    updateHighlight();
  }
}

// Hide search suggestions dropdown
function hideSearchSuggestions() {
  const searchSuggestions = document.getElementById('search-suggestions');
  if (searchSuggestions) {
    searchSuggestions.classList.remove('visible');
    searchState.isVisible = false;
    searchState.currentHighlight = -1;
    updateHighlight(); // This will also reset the placeholder via updateInputPreview()
  }
}

// Navigate suggestions with keyboard, moving sequentially through all songs
function navigateSuggestions(direction) {
  if (!searchState.isVisible || searchState.filteredSongs.length === 0) return;
  
  // Simplified navigation without debouncing (which might cause issues)
  console.log('🔍 Navigation called:', {
    direction: direction,
    currentHighlight: searchState.currentHighlight,
    totalSongs: searchState.filteredSongs.length,
    songTitles: searchState.filteredSongs.map(s => s.title)
  });
  
  // If no song is currently highlighted, start with first or last song
  if (searchState.currentHighlight === -1) {
    if (direction === 1) { // Down - start with first song
      searchState.currentHighlight = 0;
    } else { // Up - start with last song
      searchState.currentHighlight = searchState.filteredSongs.length - 1;
    }
  } else {
    // Move to next/previous song sequentially
    let newIndex = searchState.currentHighlight + direction;
    
    // Handle wrapping
    if (newIndex < 0) {
      newIndex = searchState.filteredSongs.length - 1; // Wrap to last song
    } else if (newIndex >= searchState.filteredSongs.length) {
      newIndex = 0; // Wrap to first song
    }
    
    searchState.currentHighlight = newIndex;
  }
  
  updateHighlight();
  console.log('🎯 Navigated to index:', searchState.currentHighlight, 
    'Song:', searchState.filteredSongs[searchState.currentHighlight]?.title);
}

// Highlight a specific suggestion
function highlightSuggestion(index) {
  if (index >= 0 && index < searchState.filteredSongs.length) {
    searchState.currentHighlight = index;
    updateHighlight();
  }
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
  
  // Update input placeholder with preview of highlighted song
  updateInputPreview();
}

// Update input placeholder with preview of currently highlighted song
function updateInputPreview() {
  const guessInput = document.getElementById('guess-input');
  if (!guessInput) return;
  
  // If there's a highlighted song and suggestions are visible, show preview
  if (searchState.isVisible && 
      searchState.currentHighlight >= 0 && 
      searchState.currentHighlight < searchState.filteredSongs.length) {
    
    const highlightedSong = searchState.filteredSongs[searchState.currentHighlight];
    
    // Only show preview for songs that haven't been guessed
    if (!highlightedSong.isAlreadyGuessed) {
      const preview = `${highlightedSong.title} - ${highlightedSong.artist}`;
      guessInput.placeholder = preview;
      return;
    }
  }
  
  // Reset to original placeholder if no valid highlight
  guessInput.placeholder = searchState.originalPlaceholder;
}

// Select a suggestion
function selectSuggestion(index) {
  if (index < 0 || index >= searchState.filteredSongs.length) return;
  
  const selectedSong = searchState.filteredSongs[index];
  
  // Don't allow selection of already guessed songs
  if (selectedSong.isAlreadyGuessed) {
    return;
  }
  
  const guessInput = document.getElementById('guess-input');
  
  if (guessInput) {
    guessInput.value = selectedSong.title;
    updateSubmitButtonState();
    
    // Show visual feedback that the song was selected
    showSongSelectionFeedback(selectedSong);
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

// Get list of already guessed song IDs in current game
function getGuessedSongIds() {
  return gameState.guessedSongs.map(guessRecord => {
    // Find the song that matches this guess
    const matchedSong = songDatabase.find(song => {
      const normalizedGuess = normalizeSearchString(guessRecord.guess);
      const normalizedTitle = normalizeSearchString(song.title);
      const normalizedArtist = normalizeSearchString(song.artist);
      const combinedSong = `${normalizedArtist} ${normalizedTitle}`;
      const combinedSongAlt = `${normalizedTitle} ${normalizedArtist}`;
      
      return normalizedGuess === normalizedTitle || 
             normalizedGuess === normalizedArtist ||
             normalizedGuess === combinedSong ||
             normalizedGuess === combinedSongAlt;
    });
    
    return matchedSong ? matchedSong.id : null;
  }).filter(id => id !== null); // Remove null values
}

// Check if a song input matches an already guessed song
function checkIfSongAlreadyGuessed(input) {
  if (songDatabase.length === 0) return false;
  
  const normalizedInput = normalizeSearchString(input);
  const guessedSongIds = getGuessedSongIds();
  
  // Find if this input matches any song in the database
  const matchedSong = songDatabase.find(song => {
    const normalizedTitle = normalizeSearchString(song.title);
    const normalizedArtist = normalizeSearchString(song.artist);
    const combinedSong = `${normalizedArtist} ${normalizedTitle}`;
    const combinedSongAlt = `${normalizedTitle} ${normalizedArtist}`;
    
    return normalizedInput === normalizedTitle || 
           normalizedInput === normalizedArtist ||
           normalizedInput === combinedSong ||
           normalizedInput === combinedSongAlt;
  });
  
  // Return true if the matched song was already guessed
  return matchedSong && guessedSongIds.includes(matchedSong.id);
}

// Find exact song match from database (for validation)
function findExactSongMatch(input) {
  if (songDatabase.length === 0) return null;
  
  const normalizedInput = normalizeSearchString(input);
  
  // Also check if this song has already been guessed
  const guessedSongIds = getGuessedSongIds();
  
  return songDatabase.find(song => {
    // Skip if already guessed
    if (guessedSongIds.includes(song.id)) {
      return false;
    }
    
    const normalizedTitle = normalizeSearchString(song.title);
    const normalizedArtist = normalizeSearchString(song.artist);
    const combinedSong = `${normalizedArtist} ${normalizedTitle}`;
    const combinedSongAlt = `${normalizedTitle} ${normalizedArtist}`;
    
    return normalizedInput === normalizedTitle || 
           normalizedInput === normalizedArtist ||
           normalizedInput === combinedSong ||
           normalizedInput === combinedSongAlt;
  });
}

// Show validation message when user tries to submit invalid input
function showSearchValidationMessage(isAlreadyGuessed = false) {
  const guessInput = document.getElementById('guess-input');
  if (!guessInput) return;
  
  // Temporarily change placeholder to show validation message
  const originalPlaceholder = guessInput.placeholder;
  const message = isAlreadyGuessed 
    ? 'You already guessed this song! Try a different one.'
    : 'Please select a song from the dropdown list';
  
  guessInput.placeholder = message;
  guessInput.style.borderColor = '#b41c27';
  guessInput.style.boxShadow = '0px 4px 12px rgba(180, 28, 39, 0.3)';
  
  // Reset after 2.5 seconds (longer for the "already guessed" message)
  setTimeout(() => {
    guessInput.placeholder = originalPlaceholder;
    guessInput.style.borderColor = '';
    guessInput.style.boxShadow = '';
  }, isAlreadyGuessed ? 2500 : 2000);
}

// Update submit button state based on input and game state
function updateSubmitButtonState() {
  const guessInput = document.getElementById('guess-input');
  const submitButton = document.getElementById('submit-button');
  
  if (!guessInput || !submitButton) return;
  
  const inputValue = guessInput.value.trim();
  const hasValidInput = inputValue.length > 0 && findExactSongMatch(inputValue);
  const canSubmit = hasValidInput && gameState.status === 'playing';
  
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
    if (inputValue.length > 0 && !hasValidInput) {
      submitButton.textContent = 'Select from list';
      submitButton.style.background = '#b41c27';
    } else {
      submitButton.textContent = 'Submit';
      submitButton.style.background = '#2cb67d';
    }
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
    
    // Start victory vinyl animation and immediately play full song
    startVictoryVinylAnimation();
    startVictoryAudioPlayback();
    
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
    // Ensure we have a valid elapsed time (minimum 1 second if timer was running)
    const displayTime = elapsedTime > 0 ? elapsedTime : (gameState.gameStartTime ? 1 : 0);
    seconds.textContent = displayTime;
    console.log('Victory screen timer:', {
      gameStartTime: gameState.gameStartTime,
      gameEndTime: gameState.gameEndTime,
      elapsedTime: elapsedTime,
      displayTime: displayTime
    });
  }
}

function startVictoryVinylAnimation() {
  const victoryVinyl = document.getElementById('victory-vinyl');
  const vinylCenter = victoryVinyl?.querySelector('.vinyl-center');
  
  if (victoryVinyl && vinylCenter) {
    // Initially show pause icon since song will start playing
    victoryVinyl.classList.add('spinning');
    vinylCenter.classList.add('playing');
    
    // Update the icon to show pause state
    updateVictoryVinylIcon(true);
  }
}

function startVictoryAudioPlayback() {
  // Play the full song immediately when victory screen is shown
  if (gameState.currentSong.audioUrl) {
    audioManager.playSegment(0, null, true); // Start from beginning, no duration limit, victory mode
    console.log('Victory screen: Started playing full song');
  }
}

function updateVictoryVinylIcon(isPlaying) {
  const victoryVinyl = document.getElementById('victory-vinyl');
  const playPauseIcon = victoryVinyl?.querySelector('.play-pause-icon');
  
  if (playPauseIcon) {
    if (isPlaying) {
      // Show pause icon
      playPauseIcon.classList.add('playing');
    } else {
      // Show play icon
      playPauseIcon.classList.remove('playing');
    }
  }
}

function handleVictoryVinylClick() {
  const victoryVinyl = document.getElementById('victory-vinyl');
  const vinylCenter = victoryVinyl?.querySelector('.vinyl-center');
  
  if (!victoryVinyl || !vinylCenter) return;
  
  // Toggle between playing full track and paused
  if (audioManager.isPlaying()) {
    // Pause full track playback
    audioManager.pause();
    
    // Stop spinning and reset to static position
    victoryVinyl.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    
    // Update icon to show play state
    updateVictoryVinylIcon(false);
    
    console.log('Victory track paused');
  } else {
    // Resume or start playing full track
    if (audioManager.currentAudio && audioManager.currentAudio.currentTime > 0) {
      // Resume from where we paused
      audioManager.resume();
    } else {
      // Start from beginning
      audioManager.playSegment(0, null, true);
    }
    
    // Start idle spin animation (consistent speed)
    victoryVinyl.classList.add('spinning');
    vinylCenter.classList.add('playing');
    
    // Update icon to show pause state
    updateVictoryVinylIcon(true);
    
    console.log('Victory track playing/resumed');
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
  console.log('Starting next round...');
  
  // Store the current song to ensure we get a different one
  const previousSongId = gameState.currentSong.id;
  
  // Hide victory screen
  hideVictoryScreen();
  
  // Stop any audio
  audioManager.stopPlayback();
  
  // Initialize new game with a different song
  await initializeNewGameWithDifferentSong(previousSongId);
  
  // Update UI
  updateGameUI();
  
  // Clear any feedback
  clearFeedback();
  
  // Start new timer precisely when "Next Round?" is clicked
  startGameTimer();
  
  console.log('Next round started with new song');
}

// =====================================
// LOSS STATE FUNCTIONS
// =====================================

function showLossScreen() {
  const lossScreen = document.getElementById('loss-screen');
  const gameScreen = document.getElementById('game-screen');
  
  if (!lossScreen) return;
  
  // Hide game screen
  if (gameScreen) {
    gameScreen.classList.add('hidden');
  }
  
  // Show loss screen
  lossScreen.classList.remove('hidden');
  
  // Update loss screen content
  updateLossScreenContent();
  
  // Start loss vinyl animation and audio
  startLossVinylAnimation();
  startLossAudioPlayback();
  
  console.log('Loss screen displayed');
}

function hideLossScreen() {
  const lossScreen = document.getElementById('loss-screen');
  const gameScreen = document.getElementById('game-screen');
  
  if (!lossScreen) return;
  
  // Hide loss screen
  lossScreen.classList.add('hidden');
  
  // Show game screen
  if (gameScreen) {
    gameScreen.classList.remove('hidden');
  }
  
  // Stop any audio
  audioManager.stopPlayback();
  
  console.log('Loss screen hidden');
}

function updateLossScreenContent() {
  const songTitle = document.getElementById('loss-song-title');
  const artist = document.getElementById('loss-artist');
  
  if (songTitle && artist) {
    songTitle.textContent = gameState.currentSong.title;
    artist.textContent = gameState.currentSong.artist;
  }
}

function startLossVinylAnimation() {
  const lossVinyl = document.getElementById('loss-vinyl');
  const vinylCenter = lossVinyl?.querySelector('.vinyl-center');
  
  if (lossVinyl && vinylCenter) {
    // Initially show pause icon since song will start playing
    lossVinyl.classList.add('spinning');
    vinylCenter.classList.add('playing');
    
    // Update the icon to show pause state
    updateLossVinylIcon(true);
  }
}

function startLossAudioPlayback() {
  // Play the full song immediately when loss screen is shown
  if (gameState.currentSong.audioUrl) {
    audioManager.playSegment(0, null, false); // Start from beginning, no duration limit, not victory mode
    console.log('Loss screen: Started playing full song');
  }
}

function updateLossVinylIcon(isPlaying) {
  const lossVinyl = document.getElementById('loss-vinyl');
  const playPauseIcon = lossVinyl?.querySelector('.play-pause-icon');
  
  if (playPauseIcon) {
    if (isPlaying) {
      // Show pause icon
      playPauseIcon.classList.add('playing');
    } else {
      // Show play icon
      playPauseIcon.classList.remove('playing');
    }
  }
}

function handleLossVinylClick() {
  const lossVinyl = document.getElementById('loss-vinyl');
  const vinylCenter = lossVinyl?.querySelector('.vinyl-center');
  
  if (!lossVinyl || !vinylCenter) return;
  
  // Toggle between playing full track and paused
  if (audioManager.isPlaying()) {
    // Pause full track playback
    audioManager.pause();
    
    // Stop spinning and reset to static position
    lossVinyl.classList.remove('spinning');
    vinylCenter.classList.remove('playing');
    
    // Update icon to show play state
    updateLossVinylIcon(false);
    
    console.log('Loss track paused');
  } else {
    // Resume or start playing full track
    if (audioManager.currentAudio && audioManager.currentAudio.currentTime > 0) {
      // Resume from where we paused
      audioManager.resume();
    } else {
      // Start from beginning
      audioManager.playSegment(0, null, false);
    }
    
    // Start idle spin animation (consistent speed)
    lossVinyl.classList.add('spinning');
    vinylCenter.classList.add('playing');
    
    // Update icon to show pause state
    updateLossVinylIcon(true);
    
    console.log('Loss track playing/resumed');
  }
}

function handleLossSpacebarPress(event) {
  if (event.code === 'Space') {
    const lossScreen = document.getElementById('loss-screen');
    if (!lossScreen.classList.contains('hidden')) {
      event.preventDefault();
      handleLossVinylClick();
    }
  }
}

async function handleLossPlayAgain() {
  console.log('Starting next round from loss screen...');
  
  // Store the current song to ensure we get a different one
  const previousSongId = gameState.currentSong.id;
  
  // Hide loss screen
  hideLossScreen();
  
  // Stop any audio
  audioManager.stopPlayback();
  
  // Initialize new game with a different song
  await initializeNewGameWithDifferentSong(previousSongId);
  
  // Update UI
  updateGameUI();
  
  // Clear any feedback
  clearFeedback();
  
  // Start new timer precisely when "Play Again?" is clicked
  startGameTimer();
  
  console.log('Next round started from loss screen with new song');
}

// Enhanced Escape key handler for all popups
function handleEscapeKeyEnhanced(event) {
  if (event.key === 'Escape') {
    console.log('Enhanced Escape key pressed');
    
    // Priority 1: Close modal search if active
    if (modalSearchState.isActive) {
      event.preventDefault();
      hideModalSearch();
      console.log('Modal search closed via Escape');
      return;
    }
    
    // Priority 2: Close how-to-play popup if visible
    const howToPlayPopup = document.getElementById('how-to-play-popup');
    if (howToPlayPopup && !howToPlayPopup.classList.contains('hidden')) {
      event.preventDefault();
      hideHowToPlayPopupOnly();
      console.log('How-to-play popup closed via Escape');
      return;
    }
    
    // Priority 3: Close reset confirmation popup if visible
    const resetPopup = document.getElementById('reset-popup');
    if (resetPopup && !resetPopup.classList.contains('hidden')) {
      event.preventDefault();
      hideResetConfirmationPopup();
      console.log('Reset confirmation popup closed via Escape');
      return;
    }
    
    // Priority 4: Hide search suggestions if they're visible
    if (searchState.isVisible) {
      event.preventDefault();
      hideSearchSuggestions();
      const guessInput = document.getElementById('guess-input');
      if (guessInput) {
        guessInput.blur();
      }
      console.log('Search suggestions hidden via Escape');
      return;
    }
    
    console.log('Escape key handled, but no action taken');
  }
}

// Enhanced popup overlay click handler
function handlePopupOverlayClickEnhanced(event) {
  if (event.target.classList.contains('popup-overlay')) {
    const howToPlayPopup = document.getElementById('how-to-play-popup');
    const resetPopup = document.getElementById('reset-popup');
    
    if (event.target === howToPlayPopup) {
      // Check if popup was opened from gear button or initial play
      if (howToPlayPopup.dataset.openedFromGear === 'true') {
        hideHowToPlayPopupOnly();
      } else {
        hideHowToPlayPopup();
      }
    } else if (event.target === resetPopup) {
      hideResetConfirmationPopup();
    }
  }
}

// Enhanced Ctrl+K handler for modal search
function handleCtrlKPress(event) {
  if (event.key === 'k' && event.ctrlKey) {
    event.preventDefault();
    showModalSearch();
  }
}

// Modal search overlay click handler
function handleModalOverlayClick(event) {
  if (event.target === document.getElementById('search-modal')) {
    hideModalSearch();
  }
}

// =====================================
// MODAL SEARCH FUNCTIONALITY
// =====================================

// Show modal search
function showModalSearch() {
  const modal = document.getElementById('search-modal');
  const modalInput = document.getElementById('modal-search-input');
  
  if (!modal || !modalInput) return;
  
  // Only show modal during gameplay
  if (gameState.status !== 'playing') return;
  
  modal.classList.remove('hidden');
  modalSearchState.isActive = true;
  
  // Focus the input and copy current value if any
  const currentInput = document.getElementById('guess-input');
  if (currentInput && currentInput.value.trim()) {
    modalInput.value = currentInput.value;
    handleModalSearchInput(currentInput.value);
  } else {
    modalInput.value = '';
    hideModalSearchSuggestions();
  }
  
  // Focus and select all text for easy replacement
  modalInput.focus();
  modalInput.select();
  
  console.log('Modal search opened');
}

// Hide modal search
function hideModalSearch() {
  const modal = document.getElementById('search-modal');
  const modalInput = document.getElementById('modal-search-input');
  
  if (!modal) return;
  
  modal.classList.add('hidden');
  modalSearchState.isActive = false;
  modalSearchState.isVisible = false;
  modalSearchState.currentHighlight = -1;
  modalSearchState.filteredSongs = [];
  modalSearchState.lastQuery = '';
  
  if (modalInput) {
    modalInput.value = '';
  }
  
  hideModalSearchSuggestions();
  
  // Reset button states when modal is closed
  resetAllButtons();
  
  console.log('Modal search closed');
}

// Initialize modal search input
function initializeModalSearchInput() {
  const modalInput = document.getElementById('modal-search-input');
  
  if (!modalInput) return;
  
  // Input handling
  modalInput.addEventListener('input', (event) => {
    handleModalSearchInput(event.target.value);
  });
  
  // Keyboard navigation
  modalInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hideModalSearch();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      
      if (modalSearchState.isVisible && modalSearchState.filteredSongs.length > 0) {
        if (modalSearchState.currentHighlight >= 0) {
          selectModalSuggestion(modalSearchState.currentHighlight);
        } else {
          // Auto-select first available song
          const firstAvailableIndex = modalSearchState.filteredSongs.findIndex(song => !song.isAlreadyGuessed);
          if (firstAvailableIndex >= 0) {
            selectModalSuggestion(firstAvailableIndex);
          }
        }
      } else {
        // Try direct submission
        const value = modalInput.value.trim();
        if (value) {
          const exactMatch = findExactSongMatch(value);
          if (exactMatch) {
            selectModalSong(exactMatch);
          } else {
            const isAlreadyGuessed = checkIfSongAlreadyGuessed(value);
            showSearchValidationMessage(isAlreadyGuessed);
          }
        }
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (modalSearchState.isVisible) {
        navigateModalSuggestions(1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (modalSearchState.isVisible) {
        navigateModalSuggestions(-1);
      }
    }
  });
  
  console.log('Modal search input initialized');
}

// Handle modal search input
function handleModalSearchInput(query) {
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length === 0) {
    hideModalSearchSuggestions();
    return;
  }
  
  if (trimmedQuery === modalSearchState.lastQuery) {
    return; // No change
  }
  
  modalSearchState.lastQuery = trimmedQuery;
  modalSearchState.filteredSongs = filterSongs(trimmedQuery);
  modalSearchState.currentHighlight = -1;
  
  if (modalSearchState.filteredSongs.length > 0) {
    renderModalSuggestions();
    showModalSearchSuggestions();
  } else {
    hideModalSearchSuggestions();
  }
}

// Render modal suggestions
function renderModalSuggestions() {
  const suggestionsList = document.getElementById('modal-suggestions-list');
  if (!suggestionsList) return;
  
  suggestionsList.innerHTML = '';
  
  modalSearchState.filteredSongs.forEach((song, index) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.dataset.index = index;
    
    if (song.isAlreadyGuessed) {
      suggestionItem.classList.add('already-guessed');
    }
    
    suggestionItem.innerHTML = `
      <div class="song-title">${escapeHtml(song.title)}</div>
      <div class="song-artist">${escapeHtml(song.artist)}${song.isAlreadyGuessed ? '<span class="already-guessed-label"> - Already guessed</span>' : ''}</div>
    `;
    
    // Click handler
    suggestionItem.addEventListener('click', () => {
      if (!song.isAlreadyGuessed) {
        selectModalSuggestion(index);
      }
    });
    
    // Mouse hover handler
    suggestionItem.addEventListener('mouseenter', () => {
      modalSearchState.currentHighlight = index;
      updateModalHighlight();
    });
    
    suggestionsList.appendChild(suggestionItem);
  });
}

// Show modal search suggestions
function showModalSearchSuggestions() {
  const suggestions = document.getElementById('modal-search-suggestions');
  if (suggestions) {
    suggestions.classList.remove('hidden');
    modalSearchState.isVisible = true;
  }
}

// Hide modal search suggestions
function hideModalSearchSuggestions() {
  const suggestions = document.getElementById('modal-search-suggestions');
  if (suggestions) {
    suggestions.classList.add('hidden');
    modalSearchState.isVisible = false;
  }
}

// Navigate modal suggestions
function navigateModalSuggestions(direction) {
  if (!modalSearchState.filteredSongs.length) return;
  
  console.log('🔍 Modal navigation called:', {
    direction: direction,
    currentHighlight: modalSearchState.currentHighlight,
    totalSongs: modalSearchState.filteredSongs.length
  });
  
  // If no song is currently highlighted, start with first or last song
  if (modalSearchState.currentHighlight === -1) {
    if (direction === 1) { // Down - start with first song
      modalSearchState.currentHighlight = 0;
    } else { // Up - start with last song
      modalSearchState.currentHighlight = modalSearchState.filteredSongs.length - 1;
    }
  } else {
    // Move to next/previous song sequentially
    let newIndex = modalSearchState.currentHighlight + direction;
    
    // Handle wrapping
    if (newIndex < 0) {
      newIndex = modalSearchState.filteredSongs.length - 1; // Wrap to last song
    } else if (newIndex >= modalSearchState.filteredSongs.length) {
      newIndex = 0; // Wrap to first song
    }
    
    modalSearchState.currentHighlight = newIndex;
  }
  
  updateModalHighlight();
  console.log('🎯 Modal navigated to index:', modalSearchState.currentHighlight, 
    'Song:', modalSearchState.filteredSongs[modalSearchState.currentHighlight]?.title);
}

// Update modal highlight
function updateModalHighlight() {
  const suggestionItems = document.querySelectorAll('#modal-suggestions-list .suggestion-item');
  
  suggestionItems.forEach((item, index) => {
    if (index === modalSearchState.currentHighlight) {
      item.classList.add('highlighted');
    } else {
      item.classList.remove('highlighted');
    }
  });
}

// Select modal suggestion
function selectModalSuggestion(index) {
  const song = modalSearchState.filteredSongs[index];
  if (!song || song.isAlreadyGuessed) return;
  
  selectModalSong(song);
}

// Select modal song and close modal
function selectModalSong(song) {
  // Copy selection to main input
  const mainInput = document.getElementById('guess-input');
  if (mainInput) {
    mainInput.value = song.title;
  }
  
  // Show feedback
  showSongSelectionFeedback(song);
  
  // Close modal
  hideModalSearch();
  
  // Focus main input
  if (mainInput) {
    mainInput.focus();
  }
  
  // Auto-submit after selection
  setTimeout(() => {
    handleSubmitClick();
  }, 300);
}

// Initialize everything when DOM is loaded
init(); 

// Show clear feedback when a song is selected via Enter key
function showSongSelectionFeedback(selectedSong) {
  const guessInput = document.getElementById('guess-input');
  if (!guessInput) return;
  
  // Temporarily change the input styling to show selection
  const originalBorder = guessInput.style.borderColor;
  const originalBoxShadow = guessInput.style.boxShadow;
  const originalBackground = guessInput.style.backgroundColor;
  
  // Apply selection feedback styling
  guessInput.style.borderColor = '#2cb67d';
  guessInput.style.boxShadow = '0px 4px 12px rgba(44, 182, 125, 0.4)';
  guessInput.style.backgroundColor = 'rgba(44, 182, 125, 0.1)';
  
  // Show a brief message in the placeholder
  const originalPlaceholder = guessInput.placeholder;
  guessInput.placeholder = `✓ Selected: ${selectedSong.title} by ${selectedSong.artist}`;
  
  // Reset after the delay
  setTimeout(() => {
    guessInput.style.borderColor = originalBorder;
    guessInput.style.boxShadow = originalBoxShadow;
    guessInput.style.backgroundColor = originalBackground;
    guessInput.placeholder = originalPlaceholder;
  }, 250);
} 

// =====================================
// KEYBOARD SHORTCUT BUTTON INTERACTIONS
// =====================================

// Initialize click handlers for individual Ctrl and K buttons
function initializeKeyboardShortcutButtons() {
  const ctrlButton = document.querySelector('.ctrl-hint');
  const kButton = document.querySelector('.k-hint');
  
  if (!ctrlButton || !kButton) return;
  
  // Ctrl button click handler
  ctrlButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleIndividualButtonClick('ctrl', ctrlButton);
  });
  
  // K button click handler  
  kButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleIndividualButtonClick('k', kButton);
  });
  
  console.log('Keyboard shortcut buttons initialized');
}

// Handle individual button clicks
function handleIndividualButtonClick(buttonType, buttonElement) {
  const isCurrentlyPressed = keyboardShortcutState.pressedButtons.has(buttonType);
  
  if (isCurrentlyPressed) {
    // Button is already pressed, unpress it
    unpressButton(buttonType, buttonElement);
  } else {
    // Button is not pressed, press it
    pressButton(buttonType, buttonElement);
  }
  
  // Check if both buttons are now pressed
  if (keyboardShortcutState.pressedButtons.has('ctrl') && keyboardShortcutState.pressedButtons.has('k')) {
    // Both buttons pressed - trigger modal search after a short delay
    setTimeout(() => {
      showModalSearch();
      // Reset both buttons after opening modal
      resetAllButtons();
    }, 200);
  }
  
  console.log('Button click:', buttonType, 'Pressed buttons:', Array.from(keyboardShortcutState.pressedButtons));
}

// Press a button (add pressed state)
function pressButton(buttonType, buttonElement) {
  keyboardShortcutState.pressedButtons.add(buttonType);
  buttonElement.classList.add('pressed');
  
  // Update individual tracking
  if (buttonType === 'ctrl') {
    keyboardShortcutState.ctrlPressed = true;
  } else if (buttonType === 'k') {
    keyboardShortcutState.kPressed = true;
  }
}

// Unpress a button (remove pressed state)
function unpressButton(buttonType, buttonElement) {
  keyboardShortcutState.pressedButtons.delete(buttonType);
  buttonElement.classList.remove('pressed');
  
  // Update individual tracking
  if (buttonType === 'ctrl') {
    keyboardShortcutState.ctrlPressed = false;
  } else if (buttonType === 'k') {
    keyboardShortcutState.kPressed = false;
  }
}

// Reset all buttons to unpressed state
function resetAllButtons() {
  const ctrlButton = document.querySelector('.ctrl-hint');
  const kButton = document.querySelector('.k-hint');
  
  if (ctrlButton) {
    ctrlButton.classList.remove('pressed');
  }
  
  if (kButton) {
    kButton.classList.remove('pressed');
  }
  
  // Clear state
  keyboardShortcutState.ctrlPressed = false;
  keyboardShortcutState.kPressed = false;
  keyboardShortcutState.pressedButtons.clear();
}

// Handle individual key press detection for visual feedback
function handleIndividualKeyPress(event) {
  const ctrlButton = document.querySelector('.ctrl-hint');
  const kButton = document.querySelector('.k-hint');
  
  // Handle Ctrl key press
  if (event.key === 'Control' && !keyboardShortcutState.ctrlPressed) {
    keyboardShortcutState.ctrlPressed = true;
    if (ctrlButton && !ctrlButton.classList.contains('pressed')) {
      ctrlButton.classList.add('pressed');
    }
  }
  
  // Handle K key press
  if (event.key.toLowerCase() === 'k' && !keyboardShortcutState.kPressed) {
    keyboardShortcutState.kPressed = true;
    if (kButton && !kButton.classList.contains('pressed')) {
      kButton.classList.add('pressed');
    }
  }
}

// Handle individual key release detection
function handleIndividualKeyRelease(event) {
  const ctrlButton = document.querySelector('.ctrl-hint');
  const kButton = document.querySelector('.k-hint');
  
  // Handle Ctrl key release
  if (event.key === 'Control') {
    keyboardShortcutState.ctrlPressed = false;
    if (ctrlButton) {
      ctrlButton.classList.remove('pressed');
    }
  }
  
  // Handle K key release
  if (event.key.toLowerCase() === 'k') {
    keyboardShortcutState.kPressed = false;
    if (kButton) {
      kButton.classList.remove('pressed');
    }
  }
}

// Initialize everything when DOM is loaded
init(); 

// =====================================
// PROGRESS MARKERS SYSTEM
// =====================================

// Progress markers manager for enhanced timestamp display
const progressMarkers = {
  markers: [],
  
  // Initialize progress markers
  init() {
    this.markers = document.querySelectorAll('.progress-marker');
    this.setupMarkerInteractions();
    this.updateMarkerTooltips();
    console.log('Progress markers initialized');
  },
  
  // Setup hover and click interactions for markers
  setupMarkerInteractions() {
    this.markers.forEach(marker => {
      // Add keyboard accessibility
      marker.setAttribute('tabindex', '0');
      marker.setAttribute('role', 'button');
      
      // Mouse events
      marker.addEventListener('mouseenter', (e) => this.handleMarkerHover(e, true));
      marker.addEventListener('mouseleave', (e) => this.handleMarkerHover(e, false));
      marker.addEventListener('click', (e) => this.handleMarkerClick(e));
      
      // Keyboard events for accessibility
      marker.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleMarkerClick(e);
        }
      });
      
      // Focus events
      marker.addEventListener('focus', (e) => this.handleMarkerFocus(e, true));
      marker.addEventListener('blur', (e) => this.handleMarkerFocus(e, false));
    });
  },
  
  // Handle marker hover interactions
  handleMarkerHover(event, isEntering) {
    const marker = event.currentTarget;
    const seconds = marker.dataset.seconds;
    
    if (isEntering) {
      // Update tooltip with current context
      this.updateMarkerTooltip(marker, seconds);
      
      // Add smooth animation class for enhanced visual feedback
      marker.classList.add('marker-hovered');
    } else {
      marker.classList.remove('marker-hovered');
    }
  },
  
  // Handle marker focus for accessibility
  handleMarkerFocus(event, isFocusing) {
    const marker = event.currentTarget;
    const seconds = marker.dataset.seconds;
    
    if (isFocusing) {
      this.updateMarkerTooltip(marker, seconds);
      marker.classList.add('marker-focused');
    } else {
      marker.classList.remove('marker-focused');
    }
  },
  
  // Handle marker click interactions
  handleMarkerClick(event) {
    const marker = event.currentTarget;
    const seconds = parseInt(marker.dataset.seconds);
    const position = parseFloat(marker.dataset.position);
    
    // Announce the action for screen readers
    this.announceMarkerAction(seconds);
    
    // Optional: Jump to that timestamp if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`Marker clicked: ${seconds}s at ${position}%`);
    }
  },
  
  // Update tooltip content based on current game state
  updateMarkerTooltip(marker, seconds) {
    const tooltip = marker.querySelector('.marker-tooltip');
    if (!tooltip) return;
    
    const currentSnippetLength = getCurrentSnippetLength();
    const markerSeconds = parseInt(seconds);
    
    // Determine tooltip message based on game state
    let tooltipText;
    if (markerSeconds < currentSnippetLength) {
      // Past marker - just show duration
      tooltipText = `${seconds} seconds`;
    } else if (markerSeconds === currentSnippetLength) {
      // Current marker
      tooltipText = `Current snippet is ${seconds} seconds`;
    } else {
      // Future marker - just show duration
      tooltipText = `${seconds} seconds`;
    }
    
    // Update tooltip text and accessibility attributes - show full text
    tooltip.textContent = `${seconds} seconds`;
    marker.setAttribute('aria-label', tooltipText);
    marker.setAttribute('title', tooltipText);
  },
  
  // Calculate how many turns needed to reach a specific snippet length
  getTurnsNeededForSnippet(targetSeconds) {
    const snippetLengths = gameState.snippetLengths;
    const currentIndex = gameState.currentSnippetIndex;
    
    for (let i = currentIndex; i < snippetLengths.length; i++) {
      if (snippetLengths[i] >= targetSeconds) {
        return i - currentIndex;
      }
    }
    
    return snippetLengths.length - currentIndex;
  },
  
  // Update all marker tooltips when game state changes
  updateMarkerTooltips() {
    this.markers.forEach(marker => {
      const seconds = marker.dataset.seconds;
      this.updateMarkerTooltip(marker, seconds);
    });
  },
  
  // Update marker visual states based on current progress
  updateMarkerStates() {
    const currentSnippetLength = getCurrentSnippetLength();
    
    this.markers.forEach(marker => {
      const markerSeconds = parseInt(marker.dataset.seconds);
      const tick = marker.querySelector('.marker-tick');
      
      // Remove all state classes first
      marker.classList.remove('marker-past', 'marker-current', 'marker-available', 'marker-future', 'marker-unavailable');
      
      if (markerSeconds < currentSnippetLength) {
        // This snippet length has been passed
        marker.classList.add('marker-past');
      } else if (markerSeconds === currentSnippetLength) {
        // This is the current snippet length
        marker.classList.add('marker-current');
      } else {
        // This snippet length is in the future
        const turnsNeeded = this.getTurnsNeededForSnippet(markerSeconds);
        if (turnsNeeded <= gameState.maxTurns - gameState.currentTurn) {
          marker.classList.add('marker-future');
        } else {
          marker.classList.add('marker-unavailable');
        }
      }
    });
    
    // Update tooltips to reflect current state
    this.updateMarkerTooltips();
  },
  
  // Announce marker action for screen readers
  announceMarkerAction(seconds) {
    // Create a temporary announcement element for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Marker for ${seconds} second snippet selected`;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },
  
  // Animate progress markers when snippet changes
  animateMarkerTransition() {
    this.markers.forEach(marker => {
      marker.classList.add('marker-transition');
      setTimeout(() => marker.classList.remove('marker-transition'), 300);
    });
  }
};