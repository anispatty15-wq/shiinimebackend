import app from './app';
import { env } from './config/env';

const server = app.listen(env.port, () => {
  console.log(`SHIINIME API running on http://localhost:${env.port}`);
});

export default server;
