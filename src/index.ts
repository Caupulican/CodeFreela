import express from 'express';
import dotenv from 'dotenv';
const routes = require('./routes');
dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use('/',routes);
app.listen(port, () => console.log('Listening on ',port));