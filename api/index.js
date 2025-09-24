import app from '../server/index.js';

// Exporta o Express para a Vercel como Serverless Function
export default app;

export const config = {
  api: { bodyParser: false }
};
