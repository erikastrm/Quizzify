const { quizzes, questions } = require('./models/database');

async function testQuizCreation() {
  try {
    console.log('Testing quiz creation...\n');

    // 1. Hämta några frågor
    console.log('1. Fetching questions...');
    const allQuestions = await questions.getAll();
    console.log(`   Found ${allQuestions.length} questions`);

    if (allQuestions.length < 3) {
      console.log('   Not enough questions to create a quiz. Please add some questions first.');
      return;
    }

    // 2. Skapa ett quiz
    console.log('\n2. Creating quiz...');
    const newQuiz = await quizzes.create({
      name: 'Test Quiz',
      description: 'Detta är ett test-quiz'
    });
    console.log('   Quiz created:', newQuiz);

    // 3. Lägg till frågor till quizet
    console.log('\n3. Adding questions to quiz...');
    const questionIds = allQuestions.slice(0, 3).map(q => q.id);
    for (let i = 0; i < questionIds.length; i++) {
      await quizzes.addQuestion(newQuiz.id, questionIds[i], i + 1);
      console.log(`   Added question ${questionIds[i]} at position ${i + 1}`);
    }

    // 4. Hämta quizet med frågor
    console.log('\n4. Fetching quiz with questions...');
    const quiz = await quizzes.getById(newQuiz.id);
    console.log('   Quiz:', quiz);

    const quizQuestions = await quizzes.getQuestions(newQuiz.id);
    console.log('   Questions in quiz:', quizQuestions.length);
    quizQuestions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question} (Order: ${q.order_position})`);
    });

    // 5. Lista alla quiz
    console.log('\n5. Listing all quizzes...');
    const allQuizzes = await quizzes.getAll();
    console.log(`   Total quizzes: ${allQuizzes.length}`);
    allQuizzes.forEach(q => {
      console.log(`   - ${q.name} (${q.question_count} questions)`);
    });

    console.log('\n✅ Quiz test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during quiz test:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Kör testet
testQuizCreation();
