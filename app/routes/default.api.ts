export default function (app, express, serviceobject) {
  let router = express.Router();

  /* Initial route for testing!! */
  router.get('/categories', (req, res) => {
    serviceobject.get(req, res);
  });

  router.get('/categories/:id', (req, res) => {
    serviceobject.getById(req, res);
  });

  router.post('/categories', (req, res) => {
    serviceobject.post(req, res);
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
