import { DbService } from "../services/db.service";

export default function (app, express, serviceobject) {
  let router = express.Router();
  const dbService = new DbService();
  const status = require("http-status");
  const baseUrl = "/categories";
  
  console.log("Categories routes loaded, serviceobject type:", typeof serviceobject);
  console.log("serviceobject methods:", serviceobject ? Object.getOwnPropertyNames(Object.getPrototypeOf(serviceobject)) : "No serviceobject");

  router.get("/pingcategories", (req, res) => {
    console.log("info", "GET Ping Categories", {
      timestamp: Date.now(),
      txnId: req.id,
    });
    res.status(200).json({ message: "pong from categories" });
  });

  router.get(baseUrl, (req, res) => {
    serviceobject.getAll(req, res);
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

  // More specific routes should come first
  router.post(`${baseUrl}/getByCategory`, (req, res) => {
    serviceobject.getByCategory(req, res);
  });

  router.post(`${baseUrl}/sync/create`, (req, res) => {
    serviceobject.syncCreateCategories(req, res);
  });

  router.post(`${baseUrl}/create`, (req, res) => {
    console.log("ROUTE HIT: POST /categories/create");
    console.log("========== CATEGORY CREATE ROUTE ==========");
    console.log("Route hit: POST /categories/create");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Request Body Size:", JSON.stringify(req.body).length, "bytes");
    console.log("Has req.body:", !!req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", req.body ? Object.keys(req.body) : "No body");
    console.log("Calling serviceobject.createCategory...");
    serviceobject.createCategory(req, res);
  });

  // Get category with resolved (inherited) aiConfig
  router.get(`${baseUrl}/:id/ai-config`, (req, res) => {
    console.log("ROUTE HIT: GET /categories/:id/ai-config");
    console.log("Category ID:", req.params.id);
    serviceobject.getCategoryWithResolvedAiConfig(req, res);
  });

  // Update aiConfig for a category (handles nested document structure)
  router.put(`${baseUrl}/:id/ai-config`, (req, res) => {
    console.log("ROUTE HIT: PUT /categories/:id/ai-config");
    console.log("Category ID:", req.params.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    serviceobject.updateCategoryAiConfig(req, res);
  });

  // Import category tree from JSON
  router.post(`${baseUrl}/import`, (req, res) => {
    console.log("ROUTE HIT: POST /categories/import");
    console.log("Categories count:", req.body.categories?.length || 0);
    console.log("Options:", req.body.options || {});
    serviceobject.importCategoryTree(req, res);
  });

  // Export category tree to JSON
  router.get(`${baseUrl}/export`, (req, res) => {
    console.log("ROUTE HIT: GET /categories/export");
    console.log("Query params:", req.query);
    serviceobject.exportCategoryTree(req, res);
  });

  // Less specific routes should come after
  router.post(`${baseUrl}/:id`, (req, res) => {
    serviceobject.getByLineOfService(req, res);
  });

  router.post(baseUrl, (req, res) => {
    serviceobject.getByCategory(req, res);
  });

  router.put(`${baseUrl}/:id`, (req, res) => {
    console.log("========== CATEGORY PUT REQUEST ==========");
    console.log("Category ID:", req.params.id);
    console.log("Request Body Keys:", Object.keys(req.body));
    console.log("Has allowedQuestionTypes:", !!req.body.allowedQuestionTypes);

    if (req.body.allowedQuestionTypes) {
      console.log("allowedQuestionTypes count:", req.body.allowedQuestionTypes.length);
      req.body.allowedQuestionTypes.forEach((qt, index) => {
        console.log(`QuestionType[${index}]:`, {
          type: qt.type,
          displayName: qt.displayName,
          isEnabled: qt.isEnabled,
          visibleToChildren: qt.visibleToChildren,
          allKeys: Object.keys(qt)
        });
      });
    }

    serviceobject.put(req, res);
  });

  router.delete(`${baseUrl}/:id`, (req, res) => {
    console.log("info", `DELETE Category request received - ID: ${req.params.id}`, {
      timestamp: Date.now(),
      txnId: req.id,
      categoryId: req.params.id,
      requestHeaders: req.headers,
      requestQuery: req.query
    });
    
    try {
      console.log("debug", `Attempting to delete category with ID: ${req.params.id}`);
      
      // Call the service method with a callback to log the outcome
      const originalDelete = serviceobject.delete;
      serviceobject.delete = function(request, response) {
        console.log("debug", "Inside delete method - before service call");
        
        // Wrap the response object to intercept the result
        const originalJson = response.json;
        const originalStatus = response.status;
        
        response.json = function(data) {
          console.log("info", `Delete operation result:`, {
            result: data,
            success: data && (data.success || data.deletedCount > 0)
          });
          return originalJson.call(this, data);
        };
        
        response.status = function(code) {
          console.log("info", `Delete operation status code: ${code}`);
          return originalStatus.call(this, code);
        };
        
        // Call the original delete method
        return originalDelete.call(this, request, response);
      };
      
      serviceobject.delete(req, res);
      
      // Restore the original method
      serviceobject.delete = originalDelete;
    } catch (error) {
      console.error("error", `Error in delete category endpoint: ${error.message}`, {
        error: error.stack,
        categoryId: req.params.id
      });
      
      // Let the original error handling take over
      serviceobject.delete(req, res);
    }
  });

  return router;
}
