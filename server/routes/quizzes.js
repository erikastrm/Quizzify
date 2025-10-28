const express = require('express');
const router = express.Router();
const { quizzes } = require('../models/database');

/**
 * GET /api/quizzes
 * Hämta alla quiz
 */
router.get('/', async (req, res) => {
  try {
    const allQuizzes = await quizzes.getAll();
    res.json({
      success: true,
      data: allQuizzes,
      count: allQuizzes.length
    });
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta quiz',
      error: error.message
    });
  }
});

/**
 * GET /api/quizzes/:id
 * Hämta specifikt quiz
 */
router.get('/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const quiz = await quizzes.getById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta quiz',
      error: error.message
    });
  }
});

/**
 * GET /api/quizzes/:id/questions
 * Hämta alla frågor i ett quiz i rätt ordning
 */
router.get('/:id/questions', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    // Kontrollera att quiz finns
    const quiz = await quizzes.getById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    const questions = await quizzes.getQuestions(quizId);
    
    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error('Fel vid hämtning av quiz-frågor:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta frågor',
      error: error.message
    });
  }
});

/**
 * POST /api/quizzes
 * Skapa nytt quiz
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, questionIds } = req.body;

    // Validering
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Quiz måste ha ett namn'
      });
    }

    // Skapa quiz
    const newQuiz = await quizzes.create({
      name: name.trim(),
      description: description || null
    });

    // Lägg till frågor om de finns
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      for (let i = 0; i < questionIds.length; i++) {
        await quizzes.addQuestion(newQuiz.id, questionIds[i], i + 1);
      }
    }

    // Hämta fullständigt quiz med frågeantal
    const fullQuiz = await quizzes.getById(newQuiz.id);

    res.status(201).json({
      success: true,
      data: fullQuiz,
      message: 'Quiz skapat'
    });
  } catch (error) {
    console.error('Fel vid skapande av quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte skapa quiz',
      error: error.message
    });
  }
});

/**
 * PUT /api/quizzes/:id
 * Uppdatera quiz
 */
router.put('/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { name, description, questionIds } = req.body;

    // Kontrollera att quiz finns
    const existingQuiz = await quizzes.getById(quizId);
    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    // Validering
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Quiz måste ha ett namn'
      });
    }

    // Uppdatera quiz-info
    await quizzes.update(quizId, {
      name: name.trim(),
      description: description || null
    });

    // Om questionIds finns, uppdatera frågor
    if (questionIds && Array.isArray(questionIds)) {
      // Hämta nuvarande frågor
      const currentQuestions = await quizzes.getQuestions(quizId);
      const currentQuestionIds = currentQuestions.map(q => q.id);

      // Ta bort frågor som inte längre finns i listan
      for (const currentQ of currentQuestions) {
        if (!questionIds.includes(currentQ.id)) {
          await quizzes.removeQuestion(quizId, currentQ.id);
        }
      }

      // Lägg till nya frågor och uppdatera ordning
      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i];
        if (!currentQuestionIds.includes(questionId)) {
          // Lägg till ny fråga
          await quizzes.addQuestion(quizId, questionId, i + 1);
        }
      }

      // Uppdatera ordning för alla frågor
      const questionOrders = questionIds.map((qId, index) => ({
        questionId: qId,
        orderPosition: index + 1
      }));
      await quizzes.updateQuestionOrder(quizId, questionOrders);
    }

    // Hämta uppdaterat quiz
    const updatedQuiz = await quizzes.getById(quizId);

    res.json({
      success: true,
      data: updatedQuiz,
      message: 'Quiz uppdaterat'
    });
  } catch (error) {
    console.error('Fel vid uppdatering av quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte uppdatera quiz',
      error: error.message
    });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Ta bort quiz
 */
router.delete('/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    // Kontrollera att quiz finns
    const existingQuiz = await quizzes.getById(quizId);
    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    const result = await quizzes.delete(quizId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    res.json({
      success: true,
      message: 'Quiz borttaget',
      deletedId: quizId
    });
  } catch (error) {
    console.error('Fel vid borttagning av quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte ta bort quiz',
      error: error.message
    });
  }
});

/**
 * POST /api/quizzes/:id/questions/:questionId
 * Lägg till fråga till quiz
 */
router.post('/:id/questions/:questionId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const questionId = parseInt(req.params.questionId);
    const { orderPosition } = req.body;

    // Kontrollera att quiz finns
    const quiz = await quizzes.getById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz inte funnet'
      });
    }

    // Lägg till fråga
    await quizzes.addQuestion(quizId, questionId, orderPosition || 999);

    res.status(201).json({
      success: true,
      message: 'Fråga tillagd till quiz'
    });
  } catch (error) {
    console.error('Fel vid tillägg av fråga till quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte lägga till fråga',
      error: error.message
    });
  }
});

/**
 * DELETE /api/quizzes/:id/questions/:questionId
 * Ta bort fråga från quiz
 */
router.delete('/:id/questions/:questionId', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const questionId = parseInt(req.params.questionId);

    const result = await quizzes.removeQuestion(quizId, questionId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen i quiz'
      });
    }

    res.json({
      success: true,
      message: 'Fråga borttagen från quiz'
    });
  } catch (error) {
    console.error('Fel vid borttagning av fråga från quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte ta bort fråga',
      error: error.message
    });
  }
});

module.exports = router;
