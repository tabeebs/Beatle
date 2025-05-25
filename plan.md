# Beatle - Implementation Plan

## Component Overviews

* **Landing Page:** Serves as the initial entry point, featuring the game's title, a brief description, a prominent play button, and footer information.
* **"How to Play?" Popup:** A modal window that appears after clicking "Play," providing users with a concise guide on the game rules and mechanics.
* **Game Screen:** The central interface for gameplay, displaying the header, navigation icons, the audio player, guess input fields, and feedback messages.
* **Vinyl Player & Controls:** A visual representation of an audio player that animates during snippet playback and includes an interactive progress bar.
* **Guess Interface:** Enables users to search for song titles or artists, submit their guesses, and utilize a skip button to reveal more of the audio snippet.
* **Feedback Display:** Provides immediate visual confirmation after a guess (showing the incorrect song) or a skip action.
* **Reset Confirmation Popup:** A modal dialog that prompts users to confirm if they wish to abandon the current game round and start anew.
* **Victory Screen:** Appears upon a correct guess, displaying the song title, artist, time taken, and an option to play again.
* **Backend & Data Management:** Involves integrating with the SoundCloud API to stream curated Bengali song snippets and preparing associated metadata for search functionality.
* **Core Game Logic:** Manages the game's state, including turn progression, snippet length increments, guess evaluation, scoring (implicitly, number of guesses), and the victory timer.

## Phases and Tasks

---

### Phase 0: Project Setup & Asset Preparation

**Objective:** Establish the development environment, project structure, and gather all necessary static assets.

-   [✔️] Initialize project repository (e.g., Git).
-   [✔️] Set up basic project structure (e.g., `src/`, `public/`, `assets/`).
    * *Inputs Needed:* Decision on frontend framework/library (if any, e.g., React, Vue, Svelte, or vanilla JS).
-   [✔️] Integrate build tools (e.g., Webpack, Parcel, Vite) if using a framework or for module bundling and SASS/SCSS processing.
-   [✔️] Acquire Lexend font files (Regular, Bold, Italic).
    * *Inputs Needed:* Font files (.woff, .woff2).
-   [✔️] Create or acquire SVG icons:
    -   [✔️] Play icon (for vinyl and main play button if different).
    -   [✔️] Gear icon (for "How to Play?" reopen).
    -   [✔️] Music Note icon (for "Reset round?").
    -   [✔️] Sun icon (for dark mode placeholder).
    -   [✔️] Dropdown icon (for search box).
    * *Inputs Needed:* SVG files for each icon.
-   [✔️] Define color palette in a central place (e.g., CSS variables or a theme file).
    * *Inputs Needed:* List of all hex codes from the spec (#f8d728ff, #000000, #434343, #b7b7b7, #b41c27ff, #58a2bfff, #2cb67dff, #323136ff).
-   [✔️] Basic HTML (`index.html`) and CSS/SCSS setup (`style.css`/`main.scss`).

---

### Phase 1: Landing Page & "How to Play?" Popup UI

**Objective:** Implement the visual structure and basic interactions for the landing page and the introductory "How to Play?" popup.

-   **Landing Page (Slides 1–2):**
    -   [✔️] Create `LandingPage` component/HTML structure.
    -   [✔️] Implement initial white screen and animated transition to full-screen background #f8d728ff.
        * *Inputs Needed:* Animation specifics (e.g., fade-in, duration).
    -   [✔️] Add "Beatle" title (Lexend Bold, #000000).
    -   [✔️] Add subheader "guess a bengali song in 5 gos" (Lexend Italic, #000000).
    -   [✔️] Implement Play Button:
        -   [✔️] Black rounded rectangle with slight drop-shadow.
        -   [✔️] "Play" text (white, Lexend Regular).
        -   [✔️] Hover effect: scale up slightly.
    -   [✔️] Implement Footer Text (Lexend Regular, #434343, centered):
        -   [✔️] Dynamic "Today's date".
        -   [✔️] "Based on the New York Times Wordle".
        -   [✔️] "2025 © Shafquat Tabeeb".
-   **"How to Play?" Intro Popup (Slide 3):**
    -   [✔️] Create `HowToPlayPopup` component/HTML structure.
    -   [✔️] Style as a centered black rounded box (no scroll).
    -   [✔️] Add "How to Play?" heading (White, Lexend Bold, center-aligned).
    -   [✔️] Add body text (Lexend Regular, #b7b7b7, center-aligned) with specified content and snippet length progression details.
    -   [✔️] Implement "Yes, I'm ready!" Button:
        -   [✔️] Rounded, background #b41c27ff, white text.
    -   [✔️] Implement popup trigger: Show immediately after clicking Play button on Landing Page.
    -   [✔️] Implement dismissal logic:
        -   [✔️] Click "Yes, I'm ready!" button.
        -   [✔️] Press Escape key.
        -   [✔️] Click outside the popup.
    -   [✔️] Ensure popup reveals game screen underneath upon dismissal.

---

### Phase 2: Game Screen UI - Static Elements

**Objective:** Build the static layout of the main game screen, including the header, navigation, vinyl player placeholder, and guess interface elements.

-   **Game Screen Structure (Slides 4–7):**
    -   [✔️] Create `GameScreen` component/HTML structure.
    -   [✔️] Implement overall layout for header, vinyl area, guess interface, and feedback display.
-   **Header & Nav:**
    -   [✔️] Add "Beatle" title (White with drop-shadow, Lexend Bold).
    -   [✔️] Implement Floating Nav Bar:
        -   [✔️] Add Gear SVG icon.
            * *Inputs Needed:* Gear SVG.
        -   [✔️] Add Music Note SVG icon.
            * *Inputs Needed:* Music Note SVG.
        -   [✔️] Add Sun SVG icon (dark-mode toggle placeholder).
            * *Inputs Needed:* Sun SVG.
        -   [✔️] Implement hover animations for icons (e.g., slight scale, color change).
            * *Inputs Needed:* Animation specifics for icon hover.
-   **Vinyl Player & Controls (Visual Placeholder):**
    -   [✔️] Implement static Vinyl Graphic:
        -   [✔️] Outer vinyl element.
        -   [✔️] Center circle (#58a2bfff).
        -   [✔️] White play SVG in the center.
            * *Inputs Needed:* Play SVG.
    -   [✔️] Implement static Progress Bar (Track):
        -   [✔️] White rounded rectangle for the track.
        -   [✔️] Placeholder for fill (#2cb67dff), initially empty.
-   **Guess Interface (Static Elements):**
    -   [✔️] Implement Search Box:
        -   [✔️] Rounded input field.
        -   [✔️] Placeholder text: "Know it? Search for title/artist…".
        -   [✔️] Text color #434343.
        -   [✔️] Dropdown icon.
            * *Inputs Needed:* Dropdown SVG.
    -   [✔️] Implement Skip Button:
        -   [✔️] Rounded button.
        -   [✔️] Initial text #434343, label "Skip (+1 s)".
    -   [✔️] Implement Submit Button:
        -   [✔️] Rounded button, background #2cb67dff, white text, slight drop-shadow.

---

### Phase 3: Core Game Logic & State Management

**Objective:** Implement the underlying game mechanics, including turn management, snippet progression, guess attempts, and overall game state.

-   [✔️] Define game state variables:
    -   [✔️] Current song (ID, metadata).
    -   [✔️] Current snippet length (2s, 3s, 5s, 8s, 12s).
    -   [✔️] Current turn / number of guesses made (0 to 5).
    -   [✔️] Guessed songs history.
    -   [✔️] Game status (playing, won, lost - though 'lost' isn't explicit, running out of guesses implies it).
    -   [✔️] Start time for victory timer.
-   [✔️] Implement turn progression logic:
    -   [✔️] Max 5 turns.
    -   [✔️] Increment snippet length on incorrect guess or skip.
-   [✔️] Implement snippet length progression: 2s → 3s → 5s → 8s → 12s.
-   [✔️] Logic for loading a new random song (placeholder for now, full integration in Phase 7).
-   [✔️] Timer logic:
    -   [✔️] Start timer when "How to Play?" popup is closed.
    -   [✔️] Stop timer on correct guess.

---

### Phase 4: Audio Integration & Vinyl Player Functionality

**Objective:** Connect to the audio source (initially mock, then SoundCloud), and implement the interactive vinyl player with audio playback and progress bar animation.

-   **Audio Playback:**
    -   [✔️] Set up basic audio playback functionality (e.g., using HTML5 `<audio>` element or a library).
    -   [✔️] Function to load and play a specific segment of an audio track.
        * *Inputs Needed:* Sample audio files for testing.
-   **Vinyl Player Interaction (Slide 5):**
    -   [✔️] Implement click event on vinyl graphic, play SVG, or Spacebar press to trigger audio snippet playback.
    -   [✔️] Vinyl spin animation during snippet playback.
        * *Inputs Needed:* Spin animation details (e.g., speed, smoothness).
    -   [✔️] Reset vinyl to static after snippet playback.
-   **Progress Bar Animation (Slide 5):**
    -   [✔️] Animate fill (#2cb67dff) over the current snippet duration.
    -   [✔️] Reset fill to empty after snippet playback.
    -   [✔️] Ensure progress bar duration matches current snippet length (2s, 3s, 5s, 8s, 12s).

---

### Phase 5: Guess Input, Submission & Feedback UI

**Objective:** Develop the song search/guess functionality, handle guess submissions, implement skip logic, and display appropriate feedback on the game screen.

-   **Search Box Functionality:**
    -   [✔️] Implement text input handling.
    -   [✔️] (Future/Advanced) Implement dropdown with search suggestions based on available song metadata. For now, direct input.
-   **Submit Button Logic:**
    -   [✔️] On click or Enter key press in search box:
        -   [✔️] Get the guessed text.
        -   [✔️] Validate against the current mystery song's title/artist.
            * *Inputs Needed:* Logic for string comparison (case-insensitivity, fuzzy matching considerations if any).
-   **Skip Button Logic:**
    -   [✔️] On click:
        -   [✔️] Increment snippet length according to progression.
        -   [✔️] Update Skip button label ("Skip (+2 s)", "Skip (+3 s)", "Skip (+4 s)", "No more skips" or similar for the last one).
        -   [✔️] Trigger display of "Skipped" feedback.
        -   [✔️] Play the next, longer audio snippet.
-   **Feedback Display (Slides 6 & 7):**
    -   [✔️] Create `FeedbackMessage` component/HTML structure.
    -   [✔️] Style as a rounded box (Helvetica Neue font).
    -   **Wrong Guess (Slide 6):**
        -   [✔️] Display "Artist – Title" of the incorrect guess.
        -   [✔️] Increment snippet length.
        -   [✔️] Update Skip button label.
        -   [✔️] Update progress bar duration for next play.
        -   [✔️] Play the next, longer audio snippet.
    -   **Skip Feedback (Slide 7):**
        -   [✔️] Display "Skipped".
        -   [✔️] (Snippet length, skip label, progress bar already handled by Skip Button logic).
-   [✔️] Manage guess count and end game if 5 guesses are used without a correct answer.

---

### Phase 6: Reset Confirmation & Victory Screen UI

**Objective:** Implement the UI and functionality for the "Reset round?" confirmation popup and the "Victory Screen."

-   **Reset Confirmation Popup (Slide 8):**
    -   [✔️] Create `ResetConfirmationPopup` component/HTML structure.
    -   [✔️] Style as a centered dark overlay with a black rounded box.
    -   [✔️] Add "Reset the round?" title (White, Lexend Bold).
    -   [✔️] Add body text (Lexend Regular, #999999) as specified.
    -   [✔️] Implement "Cancel" button (#323136ff background, white text).
        -   [✔️] On click: close popup.
    -   [✔️] Implement "Yes, reset" button (#b41c27ff background, white text).
        -   [✔️] On click: clear progress, load new random song snippet (back to 2s, Slide 9 state), close popup.
    -   [✔️] Link Music Note icon in nav bar to open this popup.
-   **Victory Screen (Slide 11):**
    -   [✔️] Create `VictoryScreen` component/HTML structure.
        * *Inputs Needed:* Design for how this screen replaces/overlays the game screen.
    -   [✔️] Display "Beatle" header (as on game screen).
    -   [✔️] Vinyl & Play Button:
        -   [✔️] Continuous idle spin animation for vinyl.
        -   [✔️] Click vinyl/play SVG or Spacebar toggles play/pause of the *full* correctly guessed track.
    -   [✔️] Display Results (centered, Lexend):
        -   [✔️] Correct Song Title.
        -   [✔️] Correct Artist.
        -   [✔️] "Great Job!".
        -   [✔️] "You got the Beatle within [elapsed time] seconds." (using the calculated timer value).
    -   [✔️] Implement "Play Again?" Button:
        -   [✔️] Rounded, #2cb67dff background, white text.
        -   [✔️] On click: restart game with a new track at 2s snippet (back to Slide 4, game screen state, reset timer).
    -   [✔️] Logic to display Victory Screen upon correct guess.

---

### Phase 7: Local Audio Integration & Metadata Management

**Objective:** Integrate locally stored Bengali song snippets for gameplay and prepare associated song metadata for search, display, and core game logic.

-   **Local Audio File Management:**
    -   [✔️] Verify all required Bengali song files are present in the assets/songs/ directory.
    -   [✔️] Implement robust logic within the application to access, load, and play audio snippets from these local files.
        * *Inputs Needed:* Final list of song filenames.
    -   [✔️] Ensure the game can correctly reference and play segments of these audio files based on the current snippet length (2s, 3s, 5s, 8s, 12s) and the full track on the victory screen.
-   **Metadata Preparation & Structuring:**
    -   [✔️] Crucial Task: Manually update or create metadata for each song file. This involves:
        -   [✔️] Defining a clean and consistent Song Title for each track.
        -   [✔️] Defining a clean and consistent Artist(s) Name for each track.
        -   [✔️] Noting the exact filename as it appears in assets/songs/ to link the metadata to the audio file.
    -   [✔️] Store this curated metadata in a structured and easily accessible format (e.g., a JSON file, say song_metadata.json, within the assets/ or src/data/ directory).
        * *Inputs Needed:* The chosen structure for the JSON file (e.g., an array of objects, each with id, title, artist, filename).
        * Example for one song in JSON:
        ```json
        {
          "id": "song001",
          "title": "Clean Song Title",
          "artist": "Formatted Artist Name",
          "filename": "actual_song_file_name.mp3"
        }
        ```
    -   [✔️] Write a script or manually create this song_metadata.json file populating it with the cleaned titles, artists, and corresponding filenames for all songs in the assets/songs/ folder.
-   **Integration with Core Game Logic:**
    -   [✔️] Update the game's song selection logic to randomly pick a song from the song_metadata.json file.
    -   [✔️] Modify the audio loading mechanism to use the filename from the selected song's metadata to construct the path to the audio file in assets/songs/.
    -   [✔️] Adapt the guess validation logic to compare user input against the title and artist fields from the loaded song's metadata.
    -   [✔️] Ensure the Victory Screen correctly displays the title and artist from the metadata.
    -   [✔️] Implement error handling for scenarios like a metadata entry not matching an actual audio file or malformed metadata.

### Phase 7.5: Interactive Search Suggestions & Dynamic Feedback UI

**Objective:** Enhance the guess interface with real-time search suggestions presented in a "drop-up" menu and implement a dynamic, scrollable display area for feedback on incorrect guesses and skips, appearing below the main guess controls.

-   **Live Search Suggestions ("Drop-Up" Menu):**
    -   [✔️] Design and implement the UI for the "drop-up" suggestions list that appears as the user types into the search input field.
        * Ensure it positions correctly (likely above the input or in a way that doesn't obscure critical elements).
    -   [✔️] Implement search/filter logic:
        -   [✔️] As the user types, filter the song_metadata.json list.
        -   [✔️] Match against both "Song Title" and "Artist(s)" fields in a case-insensitive manner.
        -   [✔️] Display matching results in the drop-up list, formatted as: [Song Name] - [Artist(s)].
    -   [✔️] Implement interaction for the suggestions list:
        -   [✔️] Show/hide the list based on input focus and content.
        -   [✔️] Allow song selection from the list (e.g., mouse click, keyboard navigation like arrow keys + Enter).
        -   [✔️] Upon selection, populate the search input field with the chosen song's title (or a representation suitable for submission).
        -   [✔️] Clear/hide the list appropriately after selection or when the input is cleared/loses focus without selection.
    -   [✔️] Style the drop-up menu and its items for clarity and consistency with the overall game design.
-   **Dynamic Feedback Display & Scrolling:**
    -   [✔️] Create a dedicated container element below the "Skip" and "Submit" buttons to hold feedback messages (incorrect guesses, skips).
        * This area should initially be empty or take up no space if no feedback has been generated.
    -   [✔️] Implement logic to dynamically add feedback items to this container:
        -   [✔️] Incorrect Guess: When a guess is incorrect, append a new element displaying the incorrectly guessed song as "[Artist Name] – [Song Title]" (referencing the style in the provided concept sketch image_c83858.png).
        -   [✔️] Skip Action: When the "Skip" button is used, append a new element displaying "Skipped" (referencing the style in the provided concept sketch image_c83858.png).
    -   [✔️] Implement smooth animations/transitions for the appearance of new feedback items (e.g., fade-in, slide-in from bottom).
        * *Inputs Needed:* Desired animation style and duration.
    -   [✔️] Ensure the main game screen area (or the specific section containing the guess interface and feedback) becomes vertically scrollable if the accumulated feedback items cause the content to exceed the available viewport height.
        * Test to confirm that users can easily scroll to view all past guesses and skips.
    -   [✔️] Style the feedback items and the container to match the visual design indicated in the concept sketch (e.g., rounded boxes, text styling).

---

### Phase 8: Styling, Animations & Polish

**Objective:** Apply all specified styling details, implement animations, and ensure a polished user experience.

-   [✔️] Ensure all text elements use Lexend font with correct weights and styles.
-   [✔️] Verify all colors match the specifications.
-   [✔️] Implement all specified drop-shadows.
-   [✔️] Implement hover animations:
    -   [✔️] Play Button (Landing Page): scale up.
    -   [✔️] Nav Bar Icons: specified hover animations.
-   [✔️] Implement transitions:
    -   [✔️] Landing Page: initial white screen to background.
-   [✔️] Implement vinyl spin animation (during playback and idle on victory screen).
-   [✔️] Implement progress bar fill animation.
-   [✔️] Review all UI elements for adherence to wireframes/sketches (as described in the prompt).
-   [✔️] Cross-browser compatibility check (major browsers).
-   [✔️] Basic responsiveness (ensure it's usable on common screen sizes, though not explicitly detailed, it's good practice).

---

### Phase 9: Testing & Refinement

**Objective:** Thoroughly test all game features, fix bugs, and refine the user experience based on testing.

-   [✔️] Test Landing Page and "How to Play?" popup flow.
-   [✔️] Test game screen navigation (reopen "How to Play?", reset confirmation).
-   [✔️] Test audio playback for all snippet lengths (2s, 3s, 5s, 8s, 12s).
-   [✔️] Test vinyl spin and progress bar animations synchronization with audio.
-   [✔️] Test guess submission (correct and incorrect) for all 5 turns.
-   [✔️] Test skip button functionality and feedback.
-   [✔️] Test feedback messages for accuracy and display.
-   [✔️] Test game end condition (5 incorrect guesses).
-   [✔️] Test victory condition and Victory Screen display.
    -   [✔️] Verify song title, artist, and timer accuracy.
    -   [✔️] Test full track playback on Victory Screen.
    -   [✔️] Test "Play Again?" button.
-   [✔️] Test Reset Round functionality at various game stages.
-   [✔️] Test SoundCloud integration: song loading, snippet playing.
-   [✔️] Test with various songs from the curated playlist.
-   [✔️] Perform usability testing (e.g., with family/friends as per portfolio goal).
-   [✔️] Fix any identified bugs.
-   [✔️] Optimize performance (e.g., loading times, animations).

---

### Phase 10: Deployment & Future Roadmap Prep

**Objective:** Deploy the game publicly and outline preparations for future development.

-   [✔️] Choose a hosting platform (e.g., GitHub Pages, Netlify, Vercel).
-   [✔️] Prepare build for production.
-   [✔️] Deploy the application.
-   [✔️] Test the deployed application.
-   [✔️] Add link to résumé and share.
-   **Future Roadmap Prep:**
    -   [✔️] Document current codebase and architecture.
    -   [✔️] Brainstorm technical requirements for "Custom Playlists" feature.
    -   [✔️] Brainstorm technical requirements for "Social Modes" (multiplayer).
    -   [✔️] Create backlog of identified nice-to-have features or improvements.
    -   [✔️] Placeholder for Dark Mode toggle functionality (Sun icon): Add basic hook or comment for future implementation.

---