const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});
