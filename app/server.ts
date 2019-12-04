import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';
import { logger } from '@easydevops/pwc-us-agc-logger';
import * as swaggerUi from 'swagger-ui-express';
import * as yamljs from 'yamljs';
// import * as appdynamics from 'appdynamics';
import { DbService } from './services/db.service';
import { serviceConfigs, appDynamicsConfigs } from '../config/global.config';
import routeBinder from './lib/router-binder';
import { CategoryService } from './services/category.service';
import { Auth } from '@easydevops/openid-middleware';
import config from '../config/config';

const app = express();
const dbService = new DbService();
let service: CategoryService;

// Get environment vars
dotenv.config();

// TODO: Configure appdynamics for each microservice built
// if (appDynamicsConfigs.enableAppdynamics) {
//   appdynamics.profile(appDynamicsConfigs.appdynamicsProfile);
// }

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

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

Auth.Configure({
  discoveryUrl: config.serviceSettings.discoveryUrl,
  cacheRetriever: (async (key) => {
    logger.log('Retriever: ', key);
    return null;
  }),
  cacheCallback: (key, data) => {
    logger.log('Callback: ', key, data);
  }
});

function databaseConnect() {
  logger.log('info', 'Attempting to connect to database');
  dbService.connect()
    .then(connectionInfo => {
      logger.log('info', `Successfully connected to database!  Connection Info: ${connectionInfo}`);

      bindServices();
      // Binding the routes file with the service file and
      // registering the routes.
      routeBinder(app, express, service);
    }, err => {
      logger.log('error', `Unable to connect to database : ${err}`);
    });
}

function bindServices() {
  try {
    service = new CategoryService(dbService);
  } catch (err) {
    logger.log(`Error occurred binding services : ${err}`);
  }
}

// Let's get our Swagger going on.
const yaml = yamljs;
const swaggerDocument = yaml.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
logger.log('info', `You can view your swagger documentation at <host>:${serviceConfigs.port}/api-docs`);
// expose static swagger docs
app.use(express.static('./docs'));
// Start Server: Main point of entry
app.listen(serviceConfigs.port, () => {
  logger.log('info', `Service listening on port ${serviceConfigs.port} in ${serviceConfigs.envName}`, {
    timestamp: Date.now()
  });

  // Connect to database
  databaseConnect();
});

process.on('SIGINT', async () => {
  logger.log('info', 'exit process');
  if (dbService) {
    await dbService.close();
    logger.log('info', 'DB is closed');
    process.exit();
  }
});
