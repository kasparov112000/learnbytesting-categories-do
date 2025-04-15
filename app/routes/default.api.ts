import { DbService } from "../services/db.service";

export default function (app, express, serviceobject) {
  let router = express.Router();
  const dbService = new DbService();
  const status = require("http-status");
  const baseUrl = "/categories";

  router.get("/pingcategories", (req, res) => {
    console.log("info", "GET Ping Categories", {
      timestamp: Date.now(),
      txnId: req.id,
    });
    res.status(200).json({ message: "pong from categories" });
  });

  router.post(`${baseUrl}/grid`, (req, res) => {
    serviceobject.grid({ ...req.body.session.body }, res);
  });

  router.post(`${baseUrl}/grid-flatten`, (req, res) => {
    serviceobject.gridFlatten(req, res);
  });

  router.post(`${baseUrl}/lbt-categories`, (req, res) => {
    serviceobject.gridFlatten(req, res);
  });

  router.post(`${baseUrl}/search`, (req, res) => {
    serviceobject.search(req, res);
  });

  app.get("/pingcategoriesdb", (req, res) => {
    console.log("info", "Attempting to ping categories database");
    dbService.connect().then(
      (connectionInfo) => {
        res
          .status(status.OK)
          .json(`<div><h1>categories service DB is Up and running </h1></div>`);

        console.log("info", "Successfully pinged database!  ");
      },
      (err) => {
        res
          .status(status.INTERNAL_SERVER_ERROR)
          .json("<div><h1>categories DB service is down </h1></div>");
        console.log("error", `Unable to ping categories database : ${err}`);
      }
    );
    dbService.close();
  });

  router.post(`${baseUrl}/:id`, (req, res) => {
    serviceobject.getByLineOfService(req, res);
  });

  router.post(baseUrl, (req, res) => {
    serviceobject.getByCategory(req, res);
  });

  router.post(`${baseUrl}/getByCategory`, (req, res) => {
    serviceobject.getByCategory(req, res);
  });

  router.post(`${baseUrl}/sync/create`, (req, res) => {
    serviceobject.syncCreateCategories(req, res);
  });

  router.put(`${baseUrl}/:id`, (req, res) => {
    serviceobject.put(req, res);
  });

  router.delete(`${baseUrl}/:id`, (req, res) => {
    serviceobject.delete(req, res);
  });

  return router;
}
