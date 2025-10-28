const { questions } = require('./models/database');

async function test() {
  try {
    const allQuestions = await questions.getAll();
    console.log('Antal frågor:', allQuestions.length);
    console.log('\nFråga 12:');
    const q12 = allQuestions.find(q => q.id === 12);
    console.log(JSON.stringify(q12, null, 2));
    
    if (q12 && q12.image_url) {
      console.log('\n✅ image_url finns i getAll()!');
    } else {
      console.log('\n❌ image_url SAKNAS i getAll()!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
