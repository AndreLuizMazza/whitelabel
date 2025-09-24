// api/[...all].js
import app from '../server/index.js';

// encaminha qualquer /api/* para o Express
export default app;

export const config = {
  api: { bodyParser: false },
};
