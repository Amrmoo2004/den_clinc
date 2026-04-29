import 'dotenv/config';
import http from 'http';
import { bootstrap } from './app.js';

const app = await bootstrap();
const server = http.createServer(app);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Dental Clinic API running at http://localhost:${port}`);
    console.log(`📚 Swagger Docs at http://localhost:${port}/api-docs`);
});