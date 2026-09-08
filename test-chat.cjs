const http = require('http');

const data = JSON.stringify({
  message: "Find me some handmade baskets",
  products: [
    { id: "p1", titleEn: "Woven Basket", price: 100, artisanId: "a1", category: "Basket" }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/ai/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', console.error);
req.write(data);
req.end();
