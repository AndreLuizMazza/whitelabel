// api/[...all].js
import app from '../server/index.js';

// Reaproveita seu Express para QUALQUER rota que comece com /api/*
export default app;

export const config = {
  api: { bodyParser: false },
};
