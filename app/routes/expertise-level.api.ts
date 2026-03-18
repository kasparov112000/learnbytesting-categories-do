import { ExpertiseLevelService } from '../services/expertise-level.service';

export default function (app, express, _serviceobject) {
  const router = express.Router();
  const service = new ExpertiseLevelService();
  const baseUrl = '/expertise-levels';

  console.log('[ExpertiseLevelRoutes] Routes loaded');

  router.get('/ping-expertise-levels', (req, res) => {
    res.status(200).json({ message: 'pong from expertise-levels' });
  });

  // Get levels by root category
  router.get(baseUrl, (req, res) => {
    service.getByRootCategory(req, res);
  });

  // Reorder levels (must be before :id)
  router.put(`${baseUrl}/reorder`, (req, res) => {
    service.reorder(req, res);
  });

  // Create a new level
  router.post(baseUrl, (req, res) => {
    service.create(req, res);
  });

  // Get a single level by ID
  router.get(`${baseUrl}/:id`, (req, res) => {
    service.getById(req, res);
  });

  // Update a level
  router.put(`${baseUrl}/:id`, (req, res) => {
    service.update(req, res);
  });

  // Delete a level
  router.delete(`${baseUrl}/:id`, (req, res) => {
    service.delete(req, res);
  });

  return router;
}
