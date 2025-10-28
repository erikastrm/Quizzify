const axios = require('axios');

async function testQuizAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('Testing Quiz API endpoints...\n');

    // 1. Hämta alla quiz
    console.log('1. GET /api/quizzes');
    const getAllResponse = await axios.get(`${baseURL}/quizzes`);
    console.log('   Response:', getAllResponse.data);

    // 2. Skapa ett nytt quiz
    console.log('\n2. POST /api/quizzes');
    const createResponse = await axios.post(`${baseURL}/quizzes`, {
      name: 'API Test Quiz',
      description: 'Created via API test',
      questionIds: [1, 2, 3]
    });
    console.log('   Response:', createResponse.data);

    const quizId = createResponse.data.data.id;

    // 3. Hämta quiz med ID
    console.log(`\n3. GET /api/quizzes/${quizId}`);
    const getByIdResponse = await axios.get(`${baseURL}/quizzes/${quizId}`);
    console.log('   Response:', getByIdResponse.data);

    // 4. Hämta frågor i quiz
    console.log(`\n4. GET /api/quizzes/${quizId}/questions`);
    const getQuestionsResponse = await axios.get(`${baseURL}/quizzes/${quizId}/questions`);
    console.log('   Response:', getQuestionsResponse.data);

    // 5. Uppdatera quiz
    console.log(`\n5. PUT /api/quizzes/${quizId}`);
    const updateResponse = await axios.put(`${baseURL}/quizzes/${quizId}`, {
      name: 'Updated API Test Quiz',
      description: 'Updated description',
      questionIds: [1, 2]
    });
    console.log('   Response:', updateResponse.data);

    console.log('\n✅ All API tests passed!');

  } catch (error) {
    console.error('\n❌ API test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testQuizAPI();
