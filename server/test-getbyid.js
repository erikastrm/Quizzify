const { questions } = require('./models/database');

async function test() {
  try {
    const question = await questions.getById(12);
    console.log('Question from database:');
    console.log(JSON.stringify(question, null, 2));
    
    if (question && question.image_url) {
      console.log('\n✅ image_url finns i databasen!');
    } else {
      console.log('\n❌ image_url SAKNAS!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
