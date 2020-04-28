import { logger } from '@quicksuite/commons-logger';

export default function (app, express, serviceobject) {
  let router = express.Router();

  router.get('/pingcategories', (req, res) => {
    logger.log('info', 'GET Ping Categories', {
      timestamp: Date.now(),
       txnId: req.id
     });
    res.status(200).json({ message: 'pong from categories' });
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
