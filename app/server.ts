import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';

import * as swaggerUi from 'swagger-ui-express';
import * as yamljs from 'yamljs';
import * as helmet from 'helmet';
import * as mongoSanitize from 'express-mongo-sanitize';
// import * as appdynamics from 'appdynamics';
import { DbService } from './services/db.service';
import { serviceConfigs, appDynamicsConfigs } from '../config/global.config';
import routeBinder from './lib/router-binder';
import { CategoryService } from './services/category.service';

const app = express();
const dbService = new DbService();
let service: CategoryService;

// Get environment vars
dotenv.config();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(helmet());

app.use(mongoSanitize({
  replaceWith: '_'
}))

app.use(morgan(function (tokens, req, res) {
  return [
    req.hostname,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));

async function databaseConnect(): Promise<void> {
  console.log('info', 'Attempting to connect to database');
  try {
    const connectionInfo = await dbService.connect();
    console.log('info', `Successfully connected to database!  Connection Info: ${connectionInfo}`);
  } catch (err) {
    console.log('error', `Unable to connect to database : ${err}`);
    throw err; // Re-throw to prevent server from accepting requests without DB
  }
}

function bindServices() {
  try {
    service = new CategoryService(dbService);
  } catch (err) {
    console.log(`Error occurred binding services : ${err}`);
  }
}

// Let's get our Swagger going on.
const yaml = yamljs;
const swaggerDocument = yaml.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log('info', `You can view your swagger documentation at <host>:${serviceConfigs.port}/api-docs`);
// expose static swagger docs
app.use(express.static('./docs'));
// Start Server: Main point of entry
// Connect to database FIRST, then start accepting requests
async function startServer() {
  try {
    // Connect to database first
    await databaseConnect();

    // Now bind services and routes
    bindServices();
    routeBinder(app, express, service);

    // Start listening only after DB is connected
    app.listen(serviceConfigs.port, () => {
      console.log('info', `Service listening on port ${serviceConfigs.port} in ${serviceConfigs.envName}`, {
        timestamp: Date.now()
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  console.log('info', 'exit process');
  if (dbService) {
    await dbService.close();
    console.log('info', 'DB is closed');
    process.exit();
  }
});
