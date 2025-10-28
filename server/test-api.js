const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/questions/12',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
    
    if (json.data && json.data.image_url) {
      console.log('\n✅ image_url finns i API response!');
      console.log('image_url:', json.data.image_url);
    } else {
      console.log('\n❌ image_url SAKNAS i API response!');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
