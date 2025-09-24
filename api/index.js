// api/index.js
import app from '../server/index.js';

// Exporta o Express para a Vercel como Serverless Function
export default app;

// (opcional) desativa bodyParser interno da Vercel, já usamos express.json()
export const config = {
  api: {
    bodyParser: false,
  },
};
