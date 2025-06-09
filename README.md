# Beatle 🎵

A musical guessing game where players identify Bengali songs in 5 attempts. Inspired by the New York Times Wordle.

## 🎮 How to Play

1. Listen to a 2-second snippet of a mystery Bengali song
2. Type your guess for the song title or artist
3. If wrong or skipped, hear a longer snippet (2s → 3s → 5s → 8s → 16s)
4. You have 5 attempts to guess correctly
5. Win by identifying the song as quickly as possible!

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

## 🎵 Future Features

- **Custom Playlists**: Allow users to create and share song collections
- **Social Modes**: Multiplayer guessing competitions
- **Statistics**: Track performance and improvement over time
- **Multiple Languages**: Support for different music

## 🤝 Contributing

This is a personal portfolio project, but suggestions and feedback are welcome!

## 📄 License

© 2025 Shafquat Tabeeb. All rights reserved.