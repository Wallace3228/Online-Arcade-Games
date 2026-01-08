# Arcade Games Platform

A full-stack web application featuring four classic arcade games with complete user authentication, real-time score tracking, and interactive leaderboards.

## Features

### Game Collection
- **Memory Match**: Card matching game with three difficulty levels (6, 8, or 10 pairs)
- **Minesweeper**: Classic mine detection puzzle with adjustable grid sizes and mine counts
- **Sliding Puzzle**: Number arrangement game with three board sizes (3x3, 4x4, 5x5)
- **2048**: Tile combination game to reach the 2048 tile

### Platform Features
- **User Authentication**: Secure registration and login system using JWT tokens
- **Score System**: Automatic score calculation and saving for authenticated users
- **Global Leaderboards**: Real-time rankings per game with difficulty filtering
- **Personal Statistics**: Individual performance tracking and personal bests
- **Theme System**: Switch between dark and light modes with persistent preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

### Backend Architecture
- **Node.js** with **Express** framework for RESTful API
- **SQLite** database for lightweight, file-based data storage
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcryptjs** for secure password hashing
- **CORS** middleware for cross-origin resource sharing

### Frontend Implementation
- **Vanilla JavaScript** with **jQuery** for DOM manipulation
- **HTML5 Canvas/SVG** for game graphics and animations
- **CSS3** with Flexbox/Grid for modern layouts
- **LocalStorage** for client-side theme and session persistence
- **ES6+** features for cleaner code structure

### Database Design
Two main tables with proper relationships:
- **users**: Stores user credentials and metadata
- **scores**: Records all game sessions with foreign key to users
- Indexes on frequently queried columns (game, user_id, score) for performance

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
### Scores Table
```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game TEXT NOT NULL,
    difficulty TEXT,
    score INTEGER NOT NULL,
    moves INTEGER,
    time_seconds INTEGER,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_scores_game ON scores(game);
CREATE INDEX idx_scores_user_game ON scores(user_id, game);
CREATE INDEX idx_scores_top ON scores(game, difficulty, score DESC);
```

## Installation & Setup

### Prerequisites
- Node.js 14+ and npm 6+
- Python 3.x (for frontend development server)
- Modern web browser with JavaScript enabled

### Backend Configuration
```bash
cd backend
npm install
cp .env.example .env  # Edit with your configuration
npm run dev           # Starts on http://localhost:3000
```

### Frontend Server
```bash
cd frontend
python3 -m http.server 5500  # Starts on http://localhost:5500
```

### Environment Configuration
Create `.env` file in backend directory:
```env
PORT=3000
JWT_SECRET=generate-a-strong-secret-here
NODE_ENV=development
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register`: Create new account (requires username, email, password)
- `POST /api/auth/login`: Authenticate user and receive JWT token
- `POST /api/auth/logout`: Client-side token invalidation
- `GET /api/auth/registered-players`: Get total registered users (authenticated)

### Game Scores Management
- `POST /api/scores`: Save completed game session (requires authentication)
  - Body: {game, difficulty, score, moves, time_seconds}
- `GET /api/scores/top/:game`: Retrieve top 10 scores for specific game
  - Query params: difficulty (optional), limit (default: 10)
- `GET /api/scores/user/me`: Get authenticated user's game history
- `GET /api/scores/stats`: Global platform statistics
- `GET /api/scores/games`: List of available games with metadata

### System Endpoints
- `GET /api/health`: API status and version information
- `GET /`: API documentation and available endpoints

## Game Scoring Algorithms

### Memory Match Scoring
Base score reduced by move and time penalties, multiplied by difficulty:
- Easy: 1000 - (moves × 10) - (seconds × 2)
- Medium: ×1.5 multiplier
- Hard: ×2.0 multiplier
Minimum score: 100 points

### Minesweeper Scoring
Time-based scoring with difficulty multipliers and completion bonus:
- Base: 1000 - (seconds × 10)
- Difficulty multipliers: Easy×1, Medium×1.5, Hard×2.0
- Mines bonus: +200 for finding all mines
Minimum score: 100 points

### Sliding Puzzle Scoring
Efficiency-based scoring penalizing moves and time:
- Base: 1000 - (moves × 5) - (seconds × 3)
- Difficulty multipliers: Easy×1, Medium×1.5, Hard×2.0
Minimum score: 100 points

### 2048 Scoring
Complex algorithm considering multiple factors:
- Base: Final game score
- Tile bonuses: +1000 for 2048, +500 for 1024, +250 for 512, +100 for 256
- Efficiency bonus: Up to 500 points based on score per move
- Time penalty: -2 points per second
Minimum score: 100 points

## Security Implementation

### Authentication Security
- Password hashing using bcrypt with 10 rounds
- JWT tokens with 7-day expiration
- Secure HTTP-only cookie configuration
- Token blacklisting capability

## Project Structure

### Backend Organization
```
backend/
├── config/           # Database configuration
├── models/          # Data models (User, Score)
├── routes/          # API route handlers
├── middleware/      # Authentication and error handling
├── server.js        # Application entry point
├── package.json     # Dependencies and scripts
└── database.sqlite  # SQLite database file
```

### Frontend Organization
```
frontend/
├── css/             # Stylesheets organized by feature
├── js/              # JavaScript modules
├── games/           # Individual game pages
├── svg/             # Vector graphics for games
├── index.html       # Landing page
├── login.html       # Authentication page
└── (static assets)  # Images, fonts, etc.
```

## License & Acknowledgments

This project was developed as part of the **PMUD (Programació Multimèdia i Distribuïda)** course final project.

**Student**: Alex Matilla Santos  
**Academic Year**: 2025-26  
**Institution**: Universitat Politècnica de Catalunya

### Usage Rights
This project is intended for **educational purposes only**. All game concepts are based on publicly known mechanics, and the implementation serves as a demonstration of full-stack web development skills.

---
