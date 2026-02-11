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

  router.post(`${baseUrl}/sync/create`, (req, res) => {
    serviceobject.syncCreateCategories(req, res);
  });

  router.post(`${baseUrl}/create`, (req, res) => {
    serviceobject.createCategory(req, res);
  });

  // Find a category anywhere in the tree by ID (includes nested categories)
  router.get(`${baseUrl}/find/:id`, (req, res) => {
    console.log("ROUTE HIT: GET /categories/find/:id");
    console.log("Category ID:", req.params.id);
    serviceobject.findCategoryInTree(req, res);
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

  // Ensure subcategory exists (idempotent - creates if not exists, returns existing if it does)
  // Used by n8n workflows to dynamically create categories suggested by LLM
  router.post(`${baseUrl}/ensure-subcategory`, (req, res) => {
    console.log("ROUTE HIT: POST /categories/ensure-subcategory");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    serviceobject.ensureSubcategory(req, res);
  });

  // Get categories with translated names
  router.get(`${baseUrl}/translated`, async (req, res) => {
    try {
      const targetLang = req.query.lang as string || 'en';
      console.log("ROUTE HIT: GET /categories/translated?lang=" + targetLang);
      const categories = await serviceobject.getCategoriesWithTranslation(targetLang);
      res.json({ result: categories, count: categories.length });
    } catch (error) {
      console.error('Error getting translated categories:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Translate opening name with ECO code preservation
  router.post(`${baseUrl}/translate-opening`, async (req, res) => {
    try {
      const { openingName, eco, targetLang } = req.body;
      console.log("ROUTE HIT: POST /categories/translate-opening", { openingName, eco, targetLang });
      if (!openingName) {
        return res.status(400).json({ error: 'openingName is required' });
      }
      const translated = await serviceobject.translateOpeningName(
        openingName,
        eco || '',
        targetLang || 'es'
      );
      res.json({ original: openingName, translated, eco });
    } catch (error) {
      console.error('Error translating opening name:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Specific named routes must come before the :id wildcard
  router.post(`${baseUrl}/query`, (req, res) => {
    serviceobject.getByCategory(req, res);
  });

  // Wildcard :id route - must be last among POST routes
  router.post(`${baseUrl}/:id`, (req, res) => {
    serviceobject.getByLineOfService(req, res);
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

    // Use updateCategoryById which handles nested category traversal
    // This allows updating categories at any nesting level, not just root
    serviceobject.updateCategoryById(req, res);
  });

  router.delete(`${baseUrl}/:id`, (req, res) => {
    serviceobject.delete(req, res);
  });

  return router;
}
