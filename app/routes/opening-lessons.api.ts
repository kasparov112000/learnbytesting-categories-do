import { OpeningLessonService } from '../services/opening-lesson.service';

/**
 * Opening Lesson API Routes
 * All routes for managing opening lessons (multiple lessons per opening, by difficulty)
 */
export default function (app, express, _serviceobject) {
  const router = express.Router();
  const lessonService = new OpeningLessonService();
  const baseUrl = '/opening-lessons';

  console.log('[OpeningLessonRoutes] Opening lesson routes loaded');

  // Health check
  router.get('/pingopeninglessons', (req, res) => {
    console.log('[OpeningLessonRoutes] GET /pingopeninglessons');
    res.status(200).json({ message: 'pong from opening-lessons' });
  });

  // Search lessons (must come before :id)
  router.get(`${baseUrl}/search`, (req, res) => {
    console.log('[OpeningLessonRoutes] GET /opening-lessons/search', req.query);
    lessonService.search(req, res);
  });

  // Get lessons by ECO and difficulty (must come before eco/:eco)
  router.get(`${baseUrl}/eco/:eco/difficulty/:difficulty`, (req, res) => {
    console.log('[OpeningLessonRoutes] GET /opening-lessons/eco/:eco/difficulty/:difficulty', req.params);
    lessonService.getByEcoAndDifficulty(req, res);
  });

  // Get all lessons by ECO code
  router.get(`${baseUrl}/eco/:eco`, (req, res) => {
    console.log('[OpeningLessonRoutes] GET /opening-lessons/eco/:eco', req.params.eco);
    lessonService.getByEco(req, res);
  });

  // Get all lessons (with optional filters)
  router.get(baseUrl, (req, res) => {
    console.log('[OpeningLessonRoutes] GET /opening-lessons', req.query);
    lessonService.getAll(req, res);
  });

  // Create a new lesson
  router.post(baseUrl, (req, res) => {
    console.log('[OpeningLessonRoutes] POST /opening-lessons', req.body.title);
    lessonService.create(req, res);
  });

  // Get a single lesson by ID (must be after specific routes)
  router.get(`${baseUrl}/:id`, (req, res) => {
    console.log('[OpeningLessonRoutes] GET /opening-lessons/:id', req.params.id);
    lessonService.getById(req, res);
  });

  // Update a lesson
  router.put(`${baseUrl}/:id`, (req, res) => {
    console.log('[OpeningLessonRoutes] PUT /opening-lessons/:id', req.params.id);
    lessonService.update(req, res);
  });

  // Delete a lesson
  router.delete(`${baseUrl}/:id`, (req, res) => {
    console.log('[OpeningLessonRoutes] DELETE /opening-lessons/:id', req.params.id);
    lessonService.delete(req, res);
  });

  return router;
}
