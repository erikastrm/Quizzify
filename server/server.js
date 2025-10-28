const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.IO konfiguration med CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Vue.js dev server
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Import databas och routes
const db = require('./models/database');
const questionsRouter = require('./routes/questions');
const authRouter = require('./routes/auth');
const quizzesRouter = require('./routes/quizzes');

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Session konfiguration
app.use(session({
  secret: 'quiz-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // sätt till true för HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 timmar
  }
}));

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizzesRouter);

// Spel-state som lagras i minnet (kan senare flyttas till databas)
let gameState = {
  isActive: false,
  currentQuestion: null,
  questionStartTime: null, // När frågan visades
  questionIndex: 0,
  players: new Map(), // spelarID -> { name, score, socketId }
  answers: new Map(), // questionId -> Map(playerId -> answer)
  timeLeft: 0,
  questionTimer: null, // Timer för aktuell fråga
  // Quiz-relaterat
  currentQuiz: null, // Aktuellt quiz { id, name, questions: [] }
  currentQuizQuestionIndex: 0, // Index i quiz-frågelistan
  totalQuestionsInQuiz: 0 // Totalt antal frågor i aktuellt quiz
};

// Socket.IO hantering för realtidskommunikation
io.on('connection', (socket) => {
  console.log('Ny klient ansluten:', socket.id);

  /**
   * EVENT: player_join
   * När en spelare ansluter med sitt användarnamn
   */
  socket.on('player_join', (playerName) => {
    try {
      // Kontrollera att namnet inte redan finns
      const existingPlayer = Array.from(gameState.players.values())
        .find(player => player.name === playerName);
      
      if (existingPlayer) {
        socket.emit('join_error', 'Namnet är redan taget');
        return;
      }

      // Lägg till spelare i spel-state
      const playerId = socket.id;
      gameState.players.set(playerId, {
        name: playerName,
        score: 0,
        socketId: socket.id
      });

      // Bekräfta anslutning till spelaren
      socket.emit('join_success', {
        playerId: playerId,
        playerName: playerName
      });

      // Uppdatera alla klienter med ny spellista
      io.emit('players_updated', Array.from(gameState.players.values()));
      
      // Skicka aktuell spelstatus till ny spelare
      socket.emit('game_status', {
        isActive: gameState.isActive,
        currentQuestion: gameState.currentQuestion,
        timeLeft: gameState.timeLeft
      });

      console.log(`Spelare ansluten: ${playerName} (${socket.id})`);
    } catch (error) {
      console.error('Fel vid spelaranslutning:', error);
      socket.emit('join_error', 'Något gick fel vid anslutning');
    }
  });

  /**
   * EVENT: start_game
   * Admin startar spelet (endast autentiserade användare)
   */
  socket.on('start_game', (data) => {
    // Här skulle vi kontrollera admin-rättigheter
    if (gameState.isActive) {
      socket.emit('error', 'Spelet är redan igång');
      return;
    }

    gameState.isActive = true;
    gameState.questionIndex = 0;
    gameState.currentQuestion = null;
    gameState.answers.clear();
    gameState.timeLeft = 0;
    
    // Återställ alla spelares poäng
    gameState.players.forEach(player => {
      player.score = 0;
    });

    // Meddela alla att spelet har startat
    io.emit('game_started');
    
    // Skicka uppdaterad spelstatus till alla (speciellt admin)
    io.emit('game_state', {
      isActive: gameState.isActive,
      currentQuestion: gameState.currentQuestion,
      players: Array.from(gameState.players.values()),
      timeLeft: gameState.timeLeft
    });
    
    console.log('Spelet har startats av admin');
  });

  /**
   * EVENT: start_quiz
   * Admin startar ett quiz med förvald frågeordning
   */
  socket.on('start_quiz', async (quizData) => {
    try {
      if (gameState.isActive) {
        socket.emit('error', 'Spelet är redan igång');
        return;
      }

      const { quizzes } = require('./models/database');
      
      // Hämta quiz och dess frågor
      const quiz = await quizzes.getById(quizData.quizId);
      if (!quiz) {
        socket.emit('error', 'Quiz inte funnet');
        return;
      }

      const questions = await quizzes.getQuestions(quizData.quizId);
      if (questions.length === 0) {
        socket.emit('error', 'Quiz har inga frågor');
        return;
      }

      // Sätt upp quiz-state
      gameState.isActive = true;
      gameState.currentQuiz = {
        id: quiz.id,
        name: quiz.name,
        questions: questions
      };
      gameState.currentQuizQuestionIndex = 0;
      gameState.totalQuestionsInQuiz = questions.length;
      gameState.currentQuestion = null;
      gameState.answers.clear();
      gameState.timeLeft = 0;

      // Återställ alla spelares poäng
      gameState.players.forEach(player => {
        player.score = 0;
      });

      // Meddela alla att quiz har startats
      io.emit('quiz_started', {
        quizId: quiz.id,
        quizName: quiz.name,
        totalQuestions: questions.length
      });

      // Skicka uppdaterad spelstatus
      io.emit('game_state', {
        isActive: gameState.isActive,
        currentQuestion: gameState.currentQuestion,
        players: Array.from(gameState.players.values()),
        timeLeft: gameState.timeLeft,
        currentQuiz: {
          id: quiz.id,
          name: quiz.name,
          totalQuestions: questions.length,
          currentQuestionIndex: 0
        }
      });

      console.log(`Quiz "${quiz.name}" startat med ${questions.length} frågor`);

      // Admin kan nu manuellt visa första frågan

    } catch (error) {
      console.error('Fel vid start av quiz:', error);
      socket.emit('error', 'Kunde inte starta quiz');
    }
  });

  /**
   * EVENT: show_question
   * Admin visar nästa fråga för alla spelare
   */
  socket.on('show_question', async (questionData) => {
    try {
      if (!gameState.isActive) {
        socket.emit('error', 'Spelet är inte aktivt');
        return;
      }

      gameState.currentQuestion = questionData;
      gameState.questionStartTime = Date.now(); // Spara när frågan visades
      gameState.timeLeft = questionData.timeLimit || 30; // 30 sekunder default
      
      // Skicka frågan till alla spelare (utan rätt svar)
      const questionForPlayers = {
        id: questionData.id,
        question: questionData.question,
        options: questionData.options,
        timeLimit: questionData.timeLimit,
        image_url: questionData.image_url,
        category: questionData.category,
        difficulty: questionData.difficulty
      };

      io.emit('question_shown', questionForPlayers);
      
      // Skicka uppdaterad spelstatus till admin
      io.emit('game_state', {
        isActive: gameState.isActive,
        currentQuestion: gameState.currentQuestion,
        players: Array.from(gameState.players.values()),
        timeLeft: gameState.timeLeft
      });
      
      // Starta timer för frågan
      startQuestionTimer(questionData.timeLimit || 30);
      
      console.log(`Fråga visad: ${questionData.question}`);
    } catch (error) {
      console.error('Fel vid visning av fråga:', error);
      socket.emit('error', 'Kunde inte visa fråga');
    }
  });

  /**
   * EVENT: submit_answer
   * Spelare skickar sitt svar på aktuell fråga
   */
  socket.on('submit_answer', (answerData) => {
    try {
      const playerId = socket.id;
      const player = gameState.players.get(playerId);
      
      if (!player) {
        socket.emit('error', 'Spelare inte funnen');
        return;
      }

      if (!gameState.currentQuestion) {
        socket.emit('error', 'Ingen aktiv fråga');
        return;
      }

      // Lagra svaret
      if (!gameState.answers.has(gameState.currentQuestion.id)) {
        gameState.answers.set(gameState.currentQuestion.id, new Map());
      }
      
      gameState.answers.get(gameState.currentQuestion.id).set(playerId, {
        answer: answerData.answer,
        timestamp: Date.now(),
        playerName: player.name
      });

      // Bekräfta att svaret mottogs
      socket.emit('answer_submitted');
      
      // Beräkna svarstid
      const responseTime = Date.now() - gameState.questionStartTime;
      
      // Meddela admin att en spelare har svarat med detaljerad info
      io.emit('player_answered', {
        playerName: player.name,
        playerId: playerId,
        answer: answerData.answer,
        responseTime: responseTime,
        timestamp: Date.now()
      });

      console.log(`${player.name} svarade: ${answerData.answer} (${Math.round(responseTime/1000)}s)`);
    } catch (error) {
      console.error('Fel vid svarsinlämning:', error);
      socket.emit('error', 'Kunde inte skicka svar');
    }
  });

  /**
   * EVENT: end_question
   * Admin avslutar aktuell fråga och visar resultat
   */
  socket.on('end_question', () => {
    if (!gameState.currentQuestion) {
      socket.emit('error', 'Ingen aktiv fråga');
      return;
    }

    // Stoppa timern
    if (gameState.questionTimer) {
      clearInterval(gameState.questionTimer);
      gameState.questionTimer = null;
    }

    const results = calculateQuestionResults();
    
    // Skicka resultat till alla
    io.emit('question_results', results);
    
    // Uppdatera poäng
    io.emit('scores_updated', Array.from(gameState.players.values()));
    
    gameState.currentQuestion = null;
    gameState.timeLeft = 0;

    // Skicka uppdaterad game state
    io.emit('game_state', {
      isActive: gameState.isActive,
      currentQuestion: null,
      players: Array.from(gameState.players.values()),
      timeLeft: 0,
      currentQuiz: gameState.currentQuiz ? {
        id: gameState.currentQuiz.id,
        name: gameState.currentQuiz.name,
        totalQuestions: gameState.totalQuestionsInQuiz,
        currentQuestionIndex: gameState.currentQuizQuestionIndex
      } : null
    });

    console.log('Fråga avslutad, resultat skickade');

    // Kolla om det finns fler frågor i quizet (men visa dem INTE automatiskt)
    if (gameState.currentQuiz && gameState.currentQuizQuestionIndex >= gameState.totalQuestionsInQuiz) {
      // Quiz är slut - alla frågor besvarade
      console.log('Quiz avslutat - alla frågor besvarade');
      io.emit('quiz_completed', {
        quizName: gameState.currentQuiz.name,
        totalQuestions: gameState.totalQuestionsInQuiz
      });
    }
  });

  /**
   * EVENT: show_next_quiz_question
   * Admin begär nästa fråga i quizet manuellt
   */
  socket.on('show_next_quiz_question', () => {
    if (!gameState.currentQuiz) {
      socket.emit('error', 'Inget aktivt quiz');
      return;
    }

    if (gameState.currentQuestion) {
      socket.emit('error', 'Avsluta nuvarande fråga först');
      return;
    }

    if (gameState.currentQuizQuestionIndex >= gameState.totalQuestionsInQuiz) {
      socket.emit('error', 'Inga fler frågor i quizet');
      return;
    }

    showNextQuizQuestion();
  });

  /**
   * EVENT: end_game
   * Admin avslutar hela spelet
   */
  socket.on('end_game', () => {
    // Stoppa timern om den körs
    if (gameState.questionTimer) {
      clearInterval(gameState.questionTimer);
      gameState.questionTimer = null;
    }
    
    gameState.isActive = false;
    gameState.currentQuestion = null;
    gameState.timeLeft = 0;
    gameState.currentQuiz = null;
    gameState.currentQuizQuestionIndex = 0;
    gameState.totalQuestionsInQuiz = 0;
    
    const finalScores = Array.from(gameState.players.values())
      .sort((a, b) => b.score - a.score);
    
    // Skicka slutresultat till alla
    io.emit('game_ended', {
      finalScores: finalScores,
      winner: finalScores[0] || null
    });
    
    console.log('Spelet har avslutats');
  });

  /**
   * EVENT: disconnect
   * Hanterar när en klient kopplar från
   */
  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      gameState.players.delete(socket.id);
      
      // Uppdatera spellista för alla
      io.emit('players_updated', Array.from(gameState.players.values()));
      console.log(`Spelare frånkopplad: ${player.name}`);
    }
    console.log('Klient frånkopplad:', socket.id);
  });

  /**
   * EVENT: get_game_state
   * Hämta aktuell spelstatus (för admin)
   */
  socket.on('get_game_state', () => {
    socket.emit('game_state', {
      isActive: gameState.isActive,
      currentQuestion: gameState.currentQuestion,
      players: Array.from(gameState.players.values()),
      timeLeft: gameState.timeLeft
    });
  });
});

/**
 * Hjälpfunktion: Visa nästa fråga i quiz
 */
function showNextQuizQuestion() {
  if (!gameState.currentQuiz || !gameState.isActive) {
    console.log('Inget aktivt quiz');
    return;
  }

  if (gameState.currentQuizQuestionIndex >= gameState.currentQuiz.questions.length) {
    console.log('Inga fler frågor i quiz');
    return;
  }

  const questionData = gameState.currentQuiz.questions[gameState.currentQuizQuestionIndex];
  
  gameState.currentQuestion = {
    id: questionData.id,
    question: questionData.question,
    options: {
      A: questionData.option_a,
      B: questionData.option_b,
      C: questionData.option_c,
      D: questionData.option_d
    },
    correctAnswer: questionData.correct_answer,
    timeLimit: questionData.time_limit,
    category: questionData.category,
    difficulty: questionData.difficulty,
    image_url: questionData.image_url
  };

  gameState.questionStartTime = Date.now();
  gameState.timeLeft = questionData.time_limit || 30;

  // Skicka frågan till alla spelare (utan rätt svar)
  const questionForPlayers = {
    id: questionData.id,
    question: questionData.question,
    options: {
      A: questionData.option_a,
      B: questionData.option_b,
      C: questionData.option_c,
      D: questionData.option_d
    },
    timeLimit: questionData.time_limit,
    image_url: questionData.image_url,
    category: questionData.category,
    difficulty: questionData.difficulty,
    questionNumber: gameState.currentQuizQuestionIndex + 1,
    totalQuestions: gameState.totalQuestionsInQuiz
  };

  io.emit('question_shown', questionForPlayers);

  // Skicka uppdaterad spelstatus till admin
  io.emit('game_state', {
    isActive: gameState.isActive,
    currentQuestion: gameState.currentQuestion,
    players: Array.from(gameState.players.values()),
    timeLeft: gameState.timeLeft,
    currentQuiz: gameState.currentQuiz ? {
      id: gameState.currentQuiz.id,
      name: gameState.currentQuiz.name,
      totalQuestions: gameState.totalQuestionsInQuiz,
      currentQuestionIndex: gameState.currentQuizQuestionIndex + 1
    } : null
  });

  // Starta timer för frågan
  startQuestionTimer(questionData.time_limit || 30);

  console.log(`Quiz-fråga ${gameState.currentQuizQuestionIndex + 1}/${gameState.totalQuestionsInQuiz} visad: ${questionData.question}`);
  
  // Öka index för nästa fråga
  gameState.currentQuizQuestionIndex++;
}

/**
 * Hjälpfunktion: Starta timer för fråga
 */
function startQuestionTimer(duration) {
  // Stoppa eventuell tidigare timer
  if (gameState.questionTimer) {
    clearInterval(gameState.questionTimer);
  }
  
  gameState.timeLeft = duration;
  
  gameState.questionTimer = setInterval(() => {
    gameState.timeLeft--;
    
    // Skicka uppdaterad tid till alla
    io.emit('timer_update', gameState.timeLeft);
    
    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.questionTimer);
      gameState.questionTimer = null;
      
      // Auto-avsluta frågan när tiden tar slut
      const results = calculateQuestionResults();
      io.emit('question_results', results);
      io.emit('scores_updated', Array.from(gameState.players.values()));
      
      gameState.currentQuestion = null;
      gameState.timeLeft = 0;

      // Skicka uppdaterad game state så att UI uppdateras
      io.emit('game_state', {
        isActive: gameState.isActive,
        currentQuestion: null,
        players: Array.from(gameState.players.values()),
        timeLeft: 0,
        currentQuiz: gameState.currentQuiz ? {
          id: gameState.currentQuiz.id,
          name: gameState.currentQuiz.name,
          totalQuestions: gameState.totalQuestionsInQuiz,
          currentQuestionIndex: gameState.currentQuizQuestionIndex
        } : null
      });

      // Kolla om quiz är slut men visa INTE nästa fråga automatiskt
      if (gameState.currentQuiz && gameState.currentQuizQuestionIndex >= gameState.totalQuestionsInQuiz) {
        console.log('Quiz avslutat - alla frågor besvarade');
        io.emit('quiz_completed', {
          quizName: gameState.currentQuiz.name,
          totalQuestions: gameState.totalQuestionsInQuiz
        });
      }
    }
  }, 1000);
}

/**
 * Hjälpfunktion: Beräkna resultat för aktuell fråga
 */
function calculateQuestionResults() {
  if (!gameState.currentQuestion || !gameState.questionStartTime) return null;

  const questionId = gameState.currentQuestion.id;
  const correctAnswer = gameState.currentQuestion.correctAnswer;
  const questionAnswers = gameState.answers.get(questionId) || new Map();
  const timeLimit = gameState.currentQuestion.timeLimit || 30;
  
  const results = {
    questionId: questionId,
    correctAnswer: correctAnswer,
    answers: [],
    correctCount: 0,
    totalCount: questionAnswers.size
  };

  // Hjälpfunktion för att beräkna poäng baserat på svarstid
  function calculateTimeBasedPoints(responseTime, timeLimit) {
    const MAX_POINTS = 1000;
    const MIN_POINTS_PERCENT = 0.25; // 25% av max poäng
    const INSTANT_RESPONSE_THRESHOLD = 1000; // 1 sekund i millisekunder
    
    // Om svaret kom inom 1 sekund - ge max poäng
    if (responseTime <= INSTANT_RESPONSE_THRESHOLD) {
      return MAX_POINTS;
    }
    
    // Beräkna poäng linjärt baserat på tid
    // responseTime är i millisekunder, timeLimit är i sekunder
    const timeLimitMs = timeLimit * 1000;
    const remainingTime = Math.max(0, timeLimitMs - responseTime);
    const timeRatio = remainingTime / (timeLimitMs - INSTANT_RESPONSE_THRESHOLD);
    
    // Poäng mellan MIN_POINTS och MAX_POINTS baserat på hur snabbt svaret kom
    const pointsRange = MAX_POINTS * (1 - MIN_POINTS_PERCENT);
    const points = (MIN_POINTS_PERCENT * MAX_POINTS) + (pointsRange * timeRatio);
    
    return Math.round(Math.max(MIN_POINTS_PERCENT * MAX_POINTS, points));
  }

  // Gå igenom alla svar och uppdatera poäng
  questionAnswers.forEach((answerData, playerId) => {
    const player = gameState.players.get(playerId);
    if (!player) return;

    const isCorrect = answerData.answer === correctAnswer;
    const responseTime = answerData.timestamp - gameState.questionStartTime;
    
    let pointsEarned = 0;
    
    // Beräkna poäng endast för rätta svar
    if (isCorrect) {
      pointsEarned = calculateTimeBasedPoints(responseTime, timeLimit);
      player.score += pointsEarned;
      results.correctCount++;
    }

    results.answers.push({
      playerName: player.name,
      answer: answerData.answer,
      isCorrect: isCorrect,
      timestamp: answerData.timestamp,
      responseTime: responseTime,
      pointsEarned: pointsEarned
    });
  });

  return results;
}

// Initiera databasen och starta servern
const PORT = process.env.PORT || 3001;

db.initializeDatabase()
  .then(() => {
    console.log('Databas initierad');
    server.listen(PORT, () => {
      console.log(`Quiz-server körs på port ${PORT}`);
      console.log(`Socket.IO aktiverat för realtidskommunikation`);
    });
  })
  .catch((err) => {
    console.error('Fel vid initiering av databas:', err);
    process.exit(1);
  });