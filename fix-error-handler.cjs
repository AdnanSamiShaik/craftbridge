const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
const errorHandler = `
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
`;
code = code.replace('app.listen(PORT, "0.0.0.0", () => {', errorHandler);
fs.writeFileSync('server.ts', code);
