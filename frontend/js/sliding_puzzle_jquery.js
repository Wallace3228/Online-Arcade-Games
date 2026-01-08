// Sliding Puzzle Logic with jQuery - INTEGRATED WITH API
$(document).ready(function() {
  console.log('Sliding Puzzle game loaded - API Version');
  
  // Game variables
  let puzzle = [];
  let emptyPosition = { row: 0, col: 0 };
  let moves = 0;
  let gameWon = false;
  let gameStarted = false;
  let currentSize = 4;
  let victoryTimeout;
  let isAnimating = false;
  
  // Timer variables
  let startTime;
  let elapsedTime = 0;
  let timerInterval;
  
  // Difficulty settings - UNIFICADO con otros juegos
  const difficultySettings = {
    'easy': {
      size: 3,
      boardClass: 'board-3x3',
      displayName: 'Easy (3x3)',
      difficultyValue: 'easy',
      totalTiles: 8
    },
    'medium': {
      size: 4,
      boardClass: 'board-4x4',
      displayName: 'Medium (4x4)',
      difficultyValue: 'medium',
      totalTiles: 15
    },
    'hard': {
      size: 5,
      boardClass: 'board-5x5',
      displayName: 'Hard (5x5)',
      difficultyValue: 'hard',
      totalTiles: 24
    }
  };
  
  // Initialize game
  function initializeGame() {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    currentSize = settings.size;
    
    // Reset game state
    moves = 0;
    gameWon = false;
    gameStarted = false;
    isAnimating = false;
    
    // Clear any pending timeout
    if (victoryTimeout) {
      clearTimeout(victoryTimeout);
      victoryTimeout = null;
    }
    
    // Update UI
    $('#moves-counter').text('0');
    $('#game-status').text('').removeClass('win');
    
    // Update board class and size
    $('#puzzle-board').removeClass().addClass('puzzle-board ' + settings.boardClass);
    
    // Create solved puzzle
    createSolvedPuzzle(currentSize);
    
    // Shuffle puzzle
    shufflePuzzle(currentSize);
    
    // Render puzzle
    renderPuzzle(currentSize);
    
    // Stop timer and reset
    stopTimer();
    elapsedTime = 0;
    $('#time-counter').text('00:00');
    
    hideVictoryScreen();
  }
  
  // Create solved puzzle
  function createSolvedPuzzle(size) {
    puzzle = [];
    let counter = 1;
    
    for (let row = 0; row < size; row++) {
      puzzle[row] = [];
      for (let col = 0; col < size; col++) {
        if (row === size - 1 && col === size - 1) {
          puzzle[row][col] = 0; // Empty tile
          emptyPosition = { row: row, col: col };
        } else {
          puzzle[row][col] = counter++;
        }
      }
    }
  }
  
  // Shuffle puzzle (ensuring it's solvable)
  function shufflePuzzle(size) {
    // Make many random moves to shuffle
    const shuffleMoves = size * size * 20; // More moves for larger puzzles
    
    for (let i = 0; i < shuffleMoves; i++) {
      const possibleMoves = getPossibleMoves(emptyPosition.row, emptyPosition.col, size);
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        swapTiles(emptyPosition.row, emptyPosition.col, randomMove.row, randomMove.col);
        emptyPosition = randomMove;
      }
    }
  }
  
  // Get possible moves from a position
  function getPossibleMoves(row, col, size) {
    const moves = [];
    if (row > 0) moves.push({ row: row - 1, col: col }); // Up
    if (row < size - 1) moves.push({ row: row + 1, col: col }); // Down
    if (col > 0) moves.push({ row: row, col: col - 1 }); // Left
    if (col < size - 1) moves.push({ row: row, col: col + 1 }); // Right
    return moves;
  }
  
  // Swap two tiles
  function swapTiles(row1, col1, row2, col2) {
    const temp = puzzle[row1][col1];
    puzzle[row1][col1] = puzzle[row2][col2];
    puzzle[row2][col2] = temp;
  }
  
  // Get target row for a number in solved state
  function getTargetRowForNumber(number, size) {
    if (number === 0) return size - 1; // Empty tile goes to bottom row
    return Math.floor((number - 1) / size);
  }
  
  // Render puzzle with colors based on target row
  function renderPuzzle(size) {
    $('#puzzle-board').empty();
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = puzzle[row][col];
        const targetRow = getTargetRowForNumber(value, size);
        
        const tile = $('<div>', {
          class: `puzzle-tile color-row-${targetRow}`,
          'data-row': row,
          'data-col': col,
          'data-value': value,
          'data-target-row': targetRow
        });
        
        if (value === 0) {
          tile.addClass('empty');
        } else {
          tile.text(value);
          
          // Add click handler
          tile.on('click', function() {
            handleTileClick($(this));
          });
        }
        
        $('#puzzle-board').append(tile);
      }
    }
  }
  
  // Handle tile click
  function handleTileClick($tile) {
    if (gameWon || isAnimating) return;
    
    const row = parseInt($tile.data('row'));
    const col = parseInt($tile.data('col'));
    
    // Start timer on first move
    if (!gameStarted) {
      startTimer();
      gameStarted = true;
    }
    
    // Check if tile is adjacent to empty space
    if (isAdjacentToEmpty(row, col)) {
      // Move tile with slide animation
      moveTileWithAnimation(row, col, $tile);
    }
  }
  
  // Check if tile is adjacent to empty space
  function isAdjacentToEmpty(row, col) {
    const possibleMoves = getPossibleMoves(emptyPosition.row, emptyPosition.col, currentSize);
    
    return possibleMoves.some(move => move.row === row && move.col === col);
  }
  
  // Move tile to empty position with slide animation
  function moveTileWithAnimation(row, col, $tile) {
    isAnimating = true;
    
    // Calculate direction and distance
    const direction = getSlideDirection(row, col, emptyPosition.row, emptyPosition.col);
    const tileSize = $tile.outerWidth(); // Get actual tile width including border
    const gap = 4; // Gap between tiles
    
    // Calculate exact translation based on direction
    let translateX = 0;
    let translateY = 0;
    
    switch(direction) {
      case 'up':
        translateY = -(tileSize + gap);
        break;
      case 'down':
        translateY = tileSize + gap;
        break;
      case 'left':
        translateX = -(tileSize + gap);
        break;
      case 'right':
        translateX = tileSize + gap;
        break;
    }
    
    // Animate the tile sliding
    $tile.css({
      'transform': `translate(${translateX}px, ${translateY}px)`,
      'transition': 'transform 0.3s ease',
      'z-index': 2
    });
    
    // After animation completes, update puzzle state
    setTimeout(() => {
      // Reset transform and transition
      $tile.css({
        'transform': '',
        'transition': '',
        'z-index': ''
      });
      
      // Swap in puzzle array
      swapTiles(row, col, emptyPosition.row, emptyPosition.col);
      
      // Update empty position
      const oldEmptyPos = { ...emptyPosition };
      emptyPosition = { row: row, col: col };
      
      // Re-render puzzle to update positions
      renderPuzzle(currentSize);
      
      // Complete the move
      moves++;
      $('#moves-counter').text(moves);
      
      // Check win condition
      checkWinCondition();
      
      isAnimating = false;
    }, 300); // Match animation duration
  }
  
  // Get slide direction based on positions
  function getSlideDirection(fromRow, fromCol, toRow, toCol) {
    if (fromRow < toRow) return 'down';    // Tile moves down into empty space
    if (fromRow > toRow) return 'up';      // Tile moves up into empty space
    if (fromCol < toCol) return 'right';   // Tile moves right into empty space
    if (fromCol > toCol) return 'left';    // Tile moves left into empty space
    return 'up';
  }
  
  // Check win condition
  function checkWinCondition() {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    
    let counter = 1;
    let isSolved = true;
    
    // Check all tiles are in order
    for (let row = 0; row < currentSize && isSolved; row++) {
      for (let col = 0; col < currentSize && isSolved; col++) {
        // Last position should be empty (0)
        if (row === currentSize - 1 && col === currentSize - 1) {
          if (puzzle[row][col] !== 0) {
            isSolved = false;
          }
        } else if (puzzle[row][col] !== counter) {
          isSolved = false;
        }
        counter++;
      }
    }
    
    if (isSolved) {
      gameWon = true;
      stopTimer();
      
      // Show victory screen after 0.5s delay (like minesweeper)
      victoryTimeout = setTimeout(() => {
        showVictoryScreen();
      }, 500);
    }
  }
  
  // Calculate Sliding Puzzle score
  function calculateSlidingPuzzleScore(moves, timeSeconds, difficulty) {
    let baseScore = 1000;
    
    const movePenalty = moves * 5; // Penalización por movimientos
    const timePenalty = timeSeconds * 3; // Penalización por tiempo
    
    let difficultyMultiplier = 1;
    if (difficulty === 'medium') difficultyMultiplier = 1.5;
    if (difficulty === 'hard') difficultyMultiplier = 2;
    
    const score = Math.max(100, baseScore - movePenalty - timePenalty);
    return Math.round(score * difficultyMultiplier);
  }
  
  // Save score to API
  async function saveSlidingPuzzleScore(timeSeconds, difficulty, moves) {
    if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
      console.log('User not logged in, score not saved');
      return null;
    }
    
    const score = calculateSlidingPuzzleScore(moves, timeSeconds, difficulty);
    
    const gameData = {
      game: 'sliding_puzzle',
      difficulty: difficulty,
      score: score,
      moves: moves,
      time_seconds: timeSeconds
    };
    
    try {
      const result = await window.ArcadeAPI.saveScore(gameData);
      if (result.success) {
        console.log('Sliding Puzzle score saved:', result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error saving sliding puzzle score:', error);
      return null;
    }
  }
  
  // Victory screen functions
  async function showVictoryScreen() {
    const difficulty = $('#difficulty-select').val();
    const settings = difficultySettings[difficulty];
    
    // Calculate score
    let calculatedScore = calculateSlidingPuzzleScore(moves, elapsedTime, difficulty);
    let savedScore = null;
    
    // Save score if user is logged in
    if (window.ArcadeAPI && window.ArcadeAPI.isLoggedIn()) {
      savedScore = await saveSlidingPuzzleScore(elapsedTime, difficulty, moves);
    }
    
    // Update victory screen stats
    $('#victory-moves').text(moves);
    $('#victory-time').text($('#time-counter').text());
    $('#victory-difficulty').text(settings.displayName);
    $('#victory-score').text(calculatedScore); // CAMBIADO: Ahora muestra el score
    
    // Update message if user is not logged in
    if (!window.ArcadeAPI || !window.ArcadeAPI.isLoggedIn()) {
      $('#victory-message').html('Puzzle Solved!<br><small>Log in to save your score.</small>');
    } else if (savedScore) {
      $('#victory-message').html('Puzzle Solved!<br><small>Score saved to leaderboard.</small>');
    } else {
      $('#victory-message').html('Puzzle Solved!');
    }
    
    // Update game status
    $('#game-status').text('Puzzle Solved!').addClass('win');
    
    // Show victory screen
    $('#victory-screen').removeClass('hidden');
  }
  
  function hideVictoryScreen() {
    $('#victory-screen').addClass('hidden');
  }
  
  // Timer functions
  function startTimer() {
    startTime = Date.now() - elapsedTime * 1000;
    timerInterval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      updateTimerDisplay();
    }, 1000);
  }
  
  function stopTimer() {
    clearInterval(timerInterval);
  }
  
  function updateTimerDisplay() {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    $('#time-counter').text(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
  }
  
  // Event Listeners
  $('#restart-btn').on('click', initializeGame);
  $('#difficulty-select').on('change', initializeGame);
  $('#victory-restart').on('click', function() {
    initializeGame();
  });
  $('#victory-close').on('click', hideVictoryScreen);
  
  // Initialize Game
  initializeGame();
});
