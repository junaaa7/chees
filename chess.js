class ChessGame {
  constructor() {
    this.board = this.initializeBoard()
    this.currentPlayer = "white"
    this.selectedSquare = null
    this.gameStatus = "playing"
    this.capturedPieces = { white: [], black: [] }
    this.moveHistory = []

    this.pieceSymbols = {
      white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙",
      },
      black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟",
      },
    }

    this.initializeGame()
  }

  initializeBoard() {
    const board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    // Place black pieces
    board[0] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"].map((piece) => ({
      type: piece,
      color: "black",
    }))
    board[1] = Array(8).fill({ type: "pawn", color: "black" })

    // Place white pieces
    board[6] = Array(8).fill({ type: "pawn", color: "white" })
    board[7] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"].map((piece) => ({
      type: piece,
      color: "white",
    }))

    return board
  }

  initializeGame() {
    this.createBoard()
    this.updateDisplay()
    this.setupEventListeners()
  }

  createBoard() {
    const chessboard = document.getElementById("chessboard")
    chessboard.innerHTML = ""

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div")
        square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`
        square.dataset.row = row
        square.dataset.col = col

        const piece = this.board[row][col]
        if (piece) {
          const pieceElement = document.createElement("div")
          pieceElement.className = "piece"
          pieceElement.textContent = this.pieceSymbols[piece.color][piece.type]
          square.appendChild(pieceElement)
        }

        square.addEventListener("click", (e) => this.handleSquareClick(row, col))
        chessboard.appendChild(square)
      }
    }
  }

  handleSquareClick(row, col) {
    if (this.gameStatus !== "playing") return

    const clickedPiece = this.board[row][col]

    if (this.selectedSquare) {
      const [selectedRow, selectedCol] = this.selectedSquare

      if (selectedRow === row && selectedCol === col) {
        // Deselect current square
        this.selectedSquare = null
        this.clearHighlights()
        return
      }

      if (this.isValidMove(selectedRow, selectedCol, row, col)) {
        this.makeMove(selectedRow, selectedCol, row, col)
        this.selectedSquare = null
        this.clearHighlights()
        this.switchPlayer()
        this.checkGameStatus()
      } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
        // Select new piece
        this.selectedSquare = [row, col]
        this.highlightPossibleMoves(row, col)
      } else {
        this.selectedSquare = null
        this.clearHighlights()
      }
    } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
      // Select piece
      this.selectedSquare = [row, col]
      this.highlightPossibleMoves(row, col)
    }
  }

  isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol]
    if (!piece) return false

    const targetPiece = this.board[toRow][toCol]
    if (targetPiece && targetPiece.color === piece.color) return false

    // Check if move is within board bounds
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false

    switch (piece.type) {
      case "pawn":
        return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color)
      case "rook":
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol)
      case "knight":
        return this.isValidKnightMove(fromRow, fromCol, toRow, toCol)
      case "bishop":
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol)
      case "queen":
        return this.isValidQueenMove(fromRow, fromCol, toRow, toCol)
      case "king":
        return this.isValidKingMove(fromRow, fromCol, toRow, toCol)
      default:
        return false
    }
  }

  isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
    const direction = color === "white" ? -1 : 1
    const startRow = color === "white" ? 6 : 1
    const targetPiece = this.board[toRow][toCol]

    // Forward move
    if (fromCol === toCol) {
      if (toRow === fromRow + direction && !targetPiece) {
        return true
      }
      // Initial two-square move
      if (fromRow === startRow && toRow === fromRow + 2 * direction && !targetPiece) {
        return true
      }
    }

    // Diagonal capture
    if (
      Math.abs(fromCol - toCol) === 1 &&
      toRow === fromRow + direction &&
      targetPiece &&
      targetPiece.color !== color
    ) {
      return true
    }

    return false
  }

  isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false
    return this.isPathClear(fromRow, fromCol, toRow, toCol)
  }

  isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow)
    const colDiff = Math.abs(fromCol - toCol)
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
  }

  isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false
    return this.isPathClear(fromRow, fromCol, toRow, toCol)
  }

  isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return (
      this.isValidRookMove(fromRow, fromCol, toRow, toCol) || this.isValidBishopMove(fromRow, fromCol, toRow, toCol)
    )
  }

  isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow)
    const colDiff = Math.abs(fromCol - toCol)
    return rowDiff <= 1 && colDiff <= 1
  }

  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowDirection = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
    const colDirection = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0

    let currentRow = fromRow + rowDirection
    let currentCol = fromCol + colDirection

    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.board[currentRow][currentCol]) return false
      currentRow += rowDirection
      currentCol += colDirection
    }

    return true
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol]
    const capturedPiece = this.board[toRow][toCol]

    if (capturedPiece) {
      this.capturedPieces[capturedPiece.color].push(capturedPiece)
      this.updateCapturedPieces()

      if (capturedPiece.type === "king") {
        this.gameStatus = "king-captured"
        this.board[toRow][toCol] = piece
        this.board[fromRow][fromCol] = null
        this.createBoard()

        // Show winner and loser
        const winner = this.currentPlayer === "white" ? "White" : "Black"
        const loser = this.currentPlayer === "white" ? "Black" : "White"
        document.getElementById("game-status").innerHTML = `
          <div style="font-size: 1.2em; font-weight: bold; color: #d4af37;">
            🏆 ${winner} MENANG! 🏆<br>
            💔 ${loser} Kalah - Raja Dimakan!
          </div>
        `
        return
      }
    }

    this.board[toRow][toCol] = piece
    this.board[fromRow][fromCol] = null

    // Pawn promotion
    if (piece.type === "pawn" && (toRow === 0 || toRow === 7)) {
      this.board[toRow][toCol] = { type: "queen", color: piece.color }
    }

    this.moveHistory.push({ from: [fromRow, fromCol], to: [toRow, toCol], piece, capturedPiece })
    this.createBoard()
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "white" ? "black" : "white"
    this.updateDisplay()
  }

  highlightPossibleMoves(row, col) {
    this.clearHighlights()

    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
    square.classList.add("selected")

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isValidMove(row, col, r, c)) {
          const targetSquare = document.querySelector(`[data-row="${r}"][data-col="${c}"]`)
          if (this.board[r][c]) {
            targetSquare.classList.add("capture-move")
          } else {
            targetSquare.classList.add("possible-move")
          }
        }
      }
    }
  }

  clearHighlights() {
    document.querySelectorAll(".square").forEach((square) => {
      square.classList.remove("selected", "possible-move", "capture-move")
    })
  }

  checkGameStatus() {
    const kingInCheck = this.isKingInCheck(this.currentPlayer)
    const hasValidMoves = this.hasValidMoves(this.currentPlayer)

    if (kingInCheck && !hasValidMoves) {
      this.gameStatus = "checkmate"
      document.getElementById("game-status").textContent =
        `Checkmate! ${this.currentPlayer === "white" ? "Black" : "White"} wins!`
    } else if (!hasValidMoves) {
      this.gameStatus = "stalemate"
      document.getElementById("game-status").textContent = "Stalemate! It's a draw!"
    } else if (kingInCheck) {
      document.getElementById("game-status").textContent =
        `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} king is in check!`
    } else {
      document.getElementById("game-status").textContent = ""
    }
  }

  isKingInCheck(color) {
    // Find king position
    let kingRow, kingCol
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c]
        if (piece && piece.type === "king" && piece.color === color) {
          kingRow = r
          kingCol = c
          break
        }
      }
    }

    // Check if any opponent piece can attack the king
    const opponentColor = color === "white" ? "black" : "white"
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c]
        if (piece && piece.color === opponentColor) {
          if (this.isValidMove(r, c, kingRow, kingCol)) {
            return true
          }
        }
      }
    }

    return false
  }

  hasValidMoves(color) {
    for (let fromR = 0; fromR < 8; fromR++) {
      for (let fromC = 0; fromC < 8; fromC++) {
        const piece = this.board[fromR][fromC]
        if (piece && piece.color === color) {
          for (let toR = 0; toR < 8; toR++) {
            for (let toC = 0; toC < 8; toC++) {
              if (this.isValidMove(fromR, fromC, toR, toC)) {
                return true
              }
            }
          }
        }
      }
    }
    return false
  }

  updateDisplay() {
    document.getElementById("current-player").textContent =
      this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)
  }

  updateCapturedPieces() {
    const capturedWhiteDiv = document.getElementById("captured-white")
    const capturedBlackDiv = document.getElementById("captured-black")

    capturedWhiteDiv.innerHTML = this.capturedPieces.white
      .map((piece) => `<span class="captured-piece">${this.pieceSymbols.white[piece.type]}</span>`)
      .join("")

    capturedBlackDiv.innerHTML = this.capturedPieces.black
      .map((piece) => `<span class="captured-piece">${this.pieceSymbols.black[piece.type]}</span>`)
      .join("")
  }

  setupEventListeners() {
    document.getElementById("reset-btn").addEventListener("click", () => {
      this.resetGame()
    })
  }

  resetGame() {
    this.board = this.initializeBoard()
    this.currentPlayer = "white"
    this.selectedSquare = null
    this.gameStatus = "playing"
    this.capturedPieces = { white: [], black: [] }
    this.moveHistory = []

    this.createBoard()
    this.updateDisplay()
    this.updateCapturedPieces()
    document.getElementById("game-status").textContent = ""
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new ChessGame()
})
