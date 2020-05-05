import { logger } from '@quicksuite/commons-logger';
import { DbService } from 'services/db.service';

export default function (app, express, serviceobject) {
  let router = express.Router();
  const dbService = new DbService();
  // tslint:disable-next-line: no-require-imports
  const status = require('http-status');


  router.get('/pingcategories', (req, res) => {
    logger.log('info', 'GET Ping Categories', {
      timestamp: Date.now(),
       txnId: req.id
     });
    res.status(200).json({ message: 'pong from categories' });
  });

 app.get('/pingcategoriesdb', (req, res) => {
  logger.log('info', 'Attempting to ping categories database');
  dbService.connect()
  .then(connectionInfo => {
    res.status(status.OK).json(`<div><h1>categories service DB is Up and running </h1></div>`);

    logger.log('info', 'Successfully pinged database!  ');
  }, err => {
    res.status(status.INTERNAL_SERVER_ERROR).json('<div><h1>categories DB service is down </h1></div>');
    logger.log('error', `Unable to ping categories database : ${err}`);
  });
  dbService.close();
});

  router.post('/categories/:id', (req, res) => {
    serviceobject.getByLineOfService(req, res);
  });

  router.post('/categories', (req, res) => {
    serviceobject.getByLineOfService(req, res);
  });

  router.post('/categories/sync/create', (req, res) => {
    serviceobject.syncCreateCategories(req, res);
  });

  router.put('/categories/:id', (req, res) => {
    serviceobject.put(req, res);
  });

  router.delete('/categories/:id', (req, res) => {
    serviceobject.delete(req, res);
  });

  return router;
}
