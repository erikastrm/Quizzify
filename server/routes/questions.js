const express = require('express');
const router = express.Router();
const { questions } = require('../models/database');

/**
 * GET /api/questions
 * Hämta alla frågor (för admin)
 */
router.get('/', async (req, res) => {
  try {
    const allQuestions = await questions.getAll();
    res.json({
      success: true,
      data: allQuestions,
      count: allQuestions.length
    });
  } catch (error) {
    console.error('Fel vid hämtning av frågor:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta frågor',
      error: error.message
    });
  }
});

/**
 * GET /api/questions/:id
 * Hämta specifik fråga
 */
router.get('/:id', async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const question = await questions.getById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Fel vid hämtning av fråga:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta fråga',
      error: error.message
    });
  }
});

/**
 * GET /api/questions/random/:count
 * Hämta slumpmässiga frågor för quiz
 */
router.get('/random/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 10;
    const randomQuestions = await questions.getRandom(count);
    
    // Ta bort rätt svar för säkerhet (admin kan se dem separat)
    const questionsForGame = randomQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d
      },
      timeLimit: q.time_limit,
      category: q.category,
      difficulty: q.difficulty,
      image_url: q.image_url
    }));

    res.json({
      success: true,
      data: questionsForGame,
      count: questionsForGame.length
    });
  } catch (error) {
    console.error('Fel vid hämtning av slumpmässiga frågor:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte hämta frågor',
      error: error.message
    });
  }
});

/**
 * POST /api/questions
 * Skapa ny fråga (endast admin)
 */
router.post('/', async (req, res) => {
  try {
    // Här skulle vi kontrollera admin-rättigheter
    
    const { question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url } = req.body;

    // Validering
    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({
        success: false,
        message: 'Alla fält måste fyllas i'
      });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({
        success: false,
        message: 'Rätt svar måste vara A, B, C eller D'
      });
    }

    const newQuestion = await questions.create({
      question,
      option_a,
      option_b, 
      option_c,
      option_d,
      correct_answer,
      time_limit: time_limit || 30,
      category: category || 'Allmän',
      difficulty: difficulty || 'medium',
      image_url: image_url || null
    });

    res.status(201).json({
      success: true,
      data: newQuestion,
      message: 'Fråga skapad'
    });
  } catch (error) {
    console.error('Fel vid skapande av fråga:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte skapa fråga',
      error: error.message
    });
  }
});

/**
 * PUT /api/questions/:id
 * Uppdatera fråga (endast admin)
 */
router.put('/:id', async (req, res) => {
  try {
    // Här skulle vi kontrollera admin-rättigheter
    
    const questionId = parseInt(req.params.id);
    const { question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url } = req.body;

    // Kontrollera att frågan finns
    const existingQuestion = await questions.getById(questionId);
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen'
      });
    }

    // Validering
    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({
        success: false,
        message: 'Alla fält måste fyllas i'
      });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({
        success: false,
        message: 'Rätt svar måste vara A, B, C eller D'
      });
    }

    const result = await questions.update(questionId, {
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      time_limit: time_limit || 30,
      category: category || 'Allmän',
      difficulty: difficulty || 'medium',
      image_url: image_url || null
    });

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen'
      });
    }

    // Hämta uppdaterad fråga
    const updatedQuestion = await questions.getById(questionId);

    res.json({
      success: true,
      data: updatedQuestion,
      message: 'Fråga uppdaterad'
    });
  } catch (error) {
    console.error('Fel vid uppdatering av fråga:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte uppdatera fråga',
      error: error.message
    });
  }
});

/**
 * DELETE /api/questions/:id
 * Ta bort fråga (endast admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Här skulle vi kontrollera admin-rättigheter
    
    const questionId = parseInt(req.params.id);
    
    // Kontrollera att frågan finns
    const existingQuestion = await questions.getById(questionId);
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen'
      });
    }

    const result = await questions.delete(questionId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fråga inte funnen'
      });
    }

    res.json({
      success: true,
      message: 'Fråga borttagen',
      deletedId: questionId
    });
  } catch (error) {
    console.error('Fel vid borttagning av fråga:', error);
    res.status(500).json({
      success: false,
      message: 'Kunde inte ta bort fråga',
      error: error.message
    });
  }
});

module.exports = router;