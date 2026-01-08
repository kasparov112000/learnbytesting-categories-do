import { TrapService } from '../services/trap.service';

/**
 * Trap API Routes
 * All routes for managing chess opening traps
 */
export default function (app, express, _serviceobject) {
  const router = express.Router();
  const trapService = new TrapService();
  const baseUrl = '/traps';

  console.log('[TrapRoutes] Traps routes loaded');

  // Health check
  router.get('/pingtraps', (req, res) => {
    console.log('[TrapRoutes] GET /pingtraps');
    res.status(200).json({ message: 'pong from traps' });
  });

  // Get all traps with optional filters
  router.get(baseUrl, (req, res) => {
    console.log('[TrapRoutes] GET /traps', req.query);
    trapService.getAll(req, res);
  });

  // Search traps
  router.get(`${baseUrl}/search`, (req, res) => {
    console.log('[TrapRoutes] GET /traps/search', req.query);
    trapService.search(req, res);
  });

  // Get trap statistics
  router.get(`${baseUrl}/stats`, (req, res) => {
    console.log('[TrapRoutes] GET /traps/stats');
    trapService.getStats(req, res);
  });

  // Find traps by ECO code
  router.get(`${baseUrl}/eco/:eco`, (req, res) => {
    console.log('[TrapRoutes] GET /traps/eco/:eco', req.params.eco);
    trapService.findByEco(req, res);
  });

  // Find traps by category ID
  router.get(`${baseUrl}/category/:categoryId`, (req, res) => {
    console.log('[TrapRoutes] GET /traps/category/:categoryId', req.params.categoryId);
    trapService.findByCategoryId(req, res);
  });

  // Find traps by FEN position
  router.post(`${baseUrl}/find-by-fen`, (req, res) => {
    console.log('[TrapRoutes] POST /traps/find-by-fen');
    trapService.findByFen(req, res);
  });

  // Bulk import traps
  router.post(`${baseUrl}/import`, (req, res) => {
    console.log('[TrapRoutes] POST /traps/import');
    trapService.bulkImport(req, res);
  });

  // Create a new trap
  router.post(baseUrl, (req, res) => {
    console.log('[TrapRoutes] POST /traps', req.body.name);
    trapService.create(req, res);
  });

  // Get a single trap by ID
  router.get(`${baseUrl}/:id`, (req, res) => {
    console.log('[TrapRoutes] GET /traps/:id', req.params.id);
    trapService.getById(req, res);
  });

  // Update a trap
  router.put(`${baseUrl}/:id`, (req, res) => {
    console.log('[TrapRoutes] PUT /traps/:id', req.params.id);
    trapService.update(req, res);
  });

  // Delete a trap
  router.delete(`${baseUrl}/:id`, (req, res) => {
    console.log('[TrapRoutes] DELETE /traps/:id', req.params.id);
    trapService.delete(req, res);
  });

  return router;
}
