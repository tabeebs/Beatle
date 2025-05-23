# Beatle 🎵

A musical guessing game where players identify Bengali songs in 5 attempts. Inspired by the New York Times Wordle, but with a musical twist!

## 🎮 How to Play

1. Listen to a 2-second snippet of a mystery Bengali song
2. Type your guess for the song title or artist
3. If wrong or skipped, hear a longer snippet (2s → 3s → 5s → 8s → 12s)
4. You have 5 attempts to guess correctly
5. Win by identifying the song as quickly as possible!

## 🚀 Features

- **Interactive Vinyl Player** - Click to play audio snippets with realistic vinyl animations
- **Progressive Audio Reveals** - Increasingly longer snippets with each guess/skip
- **Modern UI/UX** - Clean, responsive design with smooth animations
- **Accessibility** - Keyboard navigation and screen reader support
- **Mobile Optimized** - Works seamlessly on all device sizes

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: SCSS with modern CSS features
- **Build Tool**: Vite
- **Code Quality**: ESLint
- **Font**: Lexend (Google Fonts)
- **Audio**: HTML5 Audio API (future: SoundCloud integration)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/[username]/Beatle.git
cd Beatle

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run tests
npm test
```

## 🎨 Design System

### Colors
- Primary Yellow: `#f8d728`
- Black: `#000000`
- Dark Gray: `#434343`
- Light Gray: `#b7b7b7`
- Red: `#b41c27`
- Blue: `#58a2bf`
- Green: `#2cb67d`
- Charcoal: `#323136`

### Typography
- **Font Family**: Lexend (Regular, Bold, Italic)
- **Primary Sizes**: 1rem base, 1.5rem subtitle, 3rem+ headings

## 🏗️ Project Structure

```
Beatle/
├── src/
│   ├── styles/
│   │   ├── variables.scss    # Design tokens & colors
│   │   └── main.scss        # Main styles
│   └── main.js              # Application logic
├── assets/
│   ├── fonts/               # Font files
│   └── icons/              # SVG icons
├── public/                 # Static assets
├── index.html             # Main HTML file
├── package.json           # Dependencies & scripts
├── vite.config.js         # Build configuration
└── .eslintrc.json        # Code quality rules
```

## 🚧 Development Phases

- [x] **Phase 0**: Project Setup & Asset Preparation
- [x] **Phase 1**: Landing Page & "How to Play?" Popup UI
- [x] **Phase 2**: Game Screen UI - Static Elements
- [ ] **Phase 3**: Core Game Logic & State Management
- [ ] **Phase 4**: Audio Integration & Vinyl Player Functionality
- [ ] **Phase 5**: Guess Input, Submission & Feedback UI
- [ ] **Phase 6**: Reset Confirmation & Victory Screen UI
- [ ] **Phase 7**: Backend Integration (SoundCloud & Metadata)
- [ ] **Phase 8**: Styling, Animations & Polish
- [ ] **Phase 9**: Testing & Refinement
- [ ] **Phase 10**: Deployment & Future Roadmap Prep

## 🎵 Future Features

- **Custom Playlists**: Allow users to create and share song collections
- **Social Modes**: Multiplayer guessing competitions
- **Statistics**: Track performance and improvement over time
- **Dark Mode**: Alternative color scheme
- **Multiple Languages**: Support for different regional music

## 🤝 Contributing

This is a personal portfolio project, but suggestions and feedback are welcome!

## 📄 License

© 2025 Shafquat Tabeeb. All rights reserved.

## 🎯 Inspiration

Based on the New York Times Wordle game mechanics, adapted for music discovery and Bengali culture.

---

**Live Demo**: [Coming Soon]  
**Portfolio**: [Your Portfolio URL] 