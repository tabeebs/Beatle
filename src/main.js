// Main JavaScript file for Beatle game
// Phase 2: Game Screen UI - Static Elements + Basic Interactivity

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
function hideHowToPlayPopup() {
  const popup = document.getElementById('how-to-play-popup');
  const landingPage = document.getElementById('landing-page');
  
  // Hide popup
  popup.classList.add('hidden');
  
  // Hide landing page
  landingPage.classList.add('hidden');
}

// Demo vinyl player functionality (Phase 2 testing)
function handleVinylClick() {
  const vinylDisc = document.getElementById('vinyl-disc');
  const progressFill = document.getElementById('progress-fill');
  
  // Toggle spinning
  if (vinylDisc.classList.contains('spinning')) {
    vinylDisc.classList.remove('spinning');
    progressFill.style.width = '0%';
  } else {
    vinylDisc.classList.add('spinning');
    // Demo progress animation (2 seconds)
    progressFill.style.transitionDuration = '2s';
    progressFill.style.width = '30%';
    
    // Reset after demo
    setTimeout(() => {
      vinylDisc.classList.remove('spinning');
      progressFill.style.width = '0%';
      progressFill.style.transitionDuration = '';
    }, 2000);
  }
}

// Demo feedback display
function showFeedback(type, message) {
  const feedbackDisplay = document.getElementById('feedback-display');
  
  // Clear existing feedback
  feedbackDisplay.innerHTML = '';
  
  // Create feedback message
  const feedbackMessage = document.createElement('div');
  feedbackMessage.className = `feedback-message ${type}`;
  feedbackMessage.textContent = message;
  
  feedbackDisplay.appendChild(feedbackMessage);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (feedbackMessage.parentNode) {
      feedbackMessage.remove();
    }
  }, 3000);
}

// Demo skip button functionality
let currentSkipCount = 1;
function handleSkipClick() {
  const skipButton = document.getElementById('skip-button');
  
  // Show feedback
  showFeedback('skipped', 'Skipped');
  
  // Update skip button text
  currentSkipCount++;
  if (currentSkipCount <= 4) {
    skipButton.textContent = `Skip (+${currentSkipCount}s)`;
  } else {
    skipButton.textContent = 'No more skips';
    skipButton.disabled = true;
  }
  
  // Demo vinyl spinning for longer duration
  handleVinylClick();
}

// Demo submit button functionality  
function handleSubmitClick() {
  const guessInput = document.getElementById('guess-input');
  const guessValue = guessInput.value.trim();
  
  if (guessValue) {
    // Show incorrect guess feedback
    showFeedback('incorrect-guess', `[${currentSkipCount - 1}${currentSkipCount === 2 ? 'st' : currentSkipCount === 3 ? 'nd' : currentSkipCount === 4 ? 'rd' : 'th'} incorrect guess eg. ${guessValue}]`);
    
    // Clear input
    guessInput.value = '';
    
    // Trigger skip functionality
    setTimeout(() => {
      handleSkipClick();
    }, 1000);
  }
}

// Play button click handler
function handlePlayButtonClick() {
  showHowToPlayPopup();
}

// Ready button click handler
function handleReadyButtonClick() {
  hideHowToPlayPopup();
}

// Escape key handler for popup
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    const popup = document.getElementById('how-to-play-popup');
    if (!popup.classList.contains('hidden')) {
      hideHowToPlayPopup();
    }
  }
}

// Click outside popup handler
function handlePopupOverlayClick(event) {
  if (event.target.classList.contains('popup-overlay')) {
    hideHowToPlayPopup();
  }
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
  
  // Escape key
  document.addEventListener('keydown', handleEscapeKey);
  
  // Click outside popup
  const popup = document.getElementById('how-to-play-popup');
  if (popup) {
    popup.addEventListener('click', handlePopupOverlayClick);
  }
}

// Initialize the application
function init() {
  console.log('Beatle game initializing...');
  
  // Set today's date
  setTodaysDate();
  
  // Initialize event listeners
  initEventListeners();
  
  // Start landing transition animation
  startLandingTransition();
  
  console.log('Phase 2: Game Screen UI - Static Elements initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 