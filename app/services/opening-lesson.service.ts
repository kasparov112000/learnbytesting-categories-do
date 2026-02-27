import { OpeningLessonModel, IOpeningLesson } from '../models/opening-lesson.model';

/**
 * Service for managing opening lessons
 * Provides CRUD operations and queries by ECO code and difficulty
 */
export class OpeningLessonService {
  constructor() {
    console.log('[OpeningLessonService] Initialized');
  }

  /**
   * Get all lessons for an ECO code, sorted by difficulty + order
   */
  public async getByEco(req, res) {
    try {
      const { eco } = req.params;

      if (!eco) {
        return res.status(400).json({
          success: false,
          message: 'ECO code is required'
        });
      }

      const lessons = await OpeningLessonModel.find({
        eco: { $regex: `^${eco}`, $options: 'i' },
        isActive: true
      })
        .sort({ difficulty: 1, order: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        result: lessons,
        count: lessons.length
      });
    } catch (error) {
      console.error('[OpeningLessonService.getByEco] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve lessons by ECO',
        message: error.message
      });
    }
  }

  /**
   * Get lessons filtered by ECO code and difficulty
   */
  public async getByEcoAndDifficulty(req, res) {
    try {
      const { eco, difficulty } = req.params;

      if (!eco || !difficulty) {
        return res.status(400).json({
          success: false,
          message: 'ECO code and difficulty are required'
        });
      }

      const lessons = await OpeningLessonModel.find({
        eco: { $regex: `^${eco}`, $options: 'i' },
        difficulty,
        isActive: true
      })
        .sort({ order: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        result: lessons,
        count: lessons.length
      });
    } catch (error) {
      console.error('[OpeningLessonService.getByEcoAndDifficulty] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve lessons by ECO and difficulty',
        message: error.message
      });
    }
  }

  /**
   * Get a single lesson by ID
   */
  public async getById(req, res) {
    try {
      const { id } = req.params;

      const lesson = await OpeningLessonModel.findById(id).lean();

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: `Lesson with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: lesson
      });
    } catch (error) {
      console.error('[OpeningLessonService.getById] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve lesson',
        message: error.message
      });
    }
  }

  /**
   * Search lessons by opening name or title
   */
  public async search(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q || String(q).length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const searchRegex = new RegExp(String(q), 'i');

      const lessons = await OpeningLessonModel.find({
        isActive: true,
        $or: [
          { openingName: searchRegex },
          { title: searchRegex },
          { eco: searchRegex },
          { variationName: searchRegex }
        ]
      })
        .sort({ eco: 1, difficulty: 1, order: 1 })
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        success: true,
        result: lessons,
        count: lessons.length
      });
    } catch (error) {
      console.error('[OpeningLessonService.search] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }
  }

  /**
   * Create a new lesson
   */
  public async create(req, res) {
    try {
      const lessonData: IOpeningLesson = req.body;

      console.log('[OpeningLessonService.create] Creating lesson:', lessonData.title);

      const requiredFields = ['eco', 'openingName', 'title', 'pgn'];
      const missing = requiredFields.filter(field => !lessonData[field]);

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(', ')}`
        });
      }

      // Auto-compute moveCount if not provided
      if (!lessonData.moveCount && lessonData.pgn) {
        lessonData.moveCount = lessonData.pgn
          .replace(/\d+\.\s*/g, '')
          .trim()
          .split(/\s+/)
          .filter(m => m.length > 0).length;
      }

      const lesson = new OpeningLessonModel(lessonData);
      await lesson.save();

      console.log('[OpeningLessonService.create] Lesson created:', lesson._id);

      return res.status(201).json({
        success: true,
        result: lesson,
        message: 'Lesson created successfully'
      });
    } catch (error) {
      console.error('[OpeningLessonService.create] Error:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate lesson',
          message: 'A lesson with this data already exists'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to create lesson',
        message: error.message
      });
    }
  }

  /**
   * Update a lesson by ID
   */
  public async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('[OpeningLessonService.update] Updating lesson:', id);

      delete updateData._id;
      updateData.updatedAt = new Date();

      // Re-compute moveCount if pgn changed
      if (updateData.pgn && !updateData.moveCount) {
        updateData.moveCount = updateData.pgn
          .replace(/\d+\.\s*/g, '')
          .trim()
          .split(/\s+/)
          .filter(m => m.length > 0).length;
      }

      const lesson = await OpeningLessonModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: `Lesson with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: lesson,
        message: 'Lesson updated successfully'
      });
    } catch (error) {
      console.error('[OpeningLessonService.update] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update lesson',
        message: error.message
      });
    }
  }

  /**
   * Delete a lesson (soft delete by setting isActive = false)
   */
  public async delete(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      console.log('[OpeningLessonService.delete] Deleting lesson:', id, { permanent });

      if (permanent === 'true' || permanent === true) {
        const result = await OpeningLessonModel.findByIdAndDelete(id);

        if (!result) {
          return res.status(404).json({
            success: false,
            message: `Lesson with ID ${id} not found`
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Lesson permanently deleted'
        });
      } else {
        const lesson = await OpeningLessonModel.findByIdAndUpdate(
          id,
          { $set: { isActive: false, updatedAt: new Date() } },
          { new: true }
        );

        if (!lesson) {
          return res.status(404).json({
            success: false,
            message: `Lesson with ID ${id} not found`
          });
        }

        return res.status(200).json({
          success: true,
          result: lesson,
          message: 'Lesson deactivated'
        });
      }
    } catch (error) {
      console.error('[OpeningLessonService.delete] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete lesson',
        message: error.message
      });
    }
  }

  /**
   * Get all lessons with optional filters and pagination
   */
  public async getAll(req, res) {
    try {
      const {
        eco,
        difficulty,
        openingName,
        isActive = true,
        limit = 100,
        skip = 0
      } = req.query;

      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive === 'true' || isActive === true;
      }
      if (eco) query.eco = eco;
      if (difficulty) query.difficulty = difficulty;
      if (openingName) query.openingName = { $regex: openingName, $options: 'i' };

      console.log('[OpeningLessonService.getAll] Query:', query);

      const lessons = await OpeningLessonModel.find(query)
        .sort({ eco: 1, difficulty: 1, order: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean();

      const total = await OpeningLessonModel.countDocuments(query);

      return res.status(200).json({
        success: true,
        result: lessons,
        count: lessons.length,
        total
      });
    } catch (error) {
      console.error('[OpeningLessonService.getAll] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve lessons',
        message: error.message
      });
    }
  }
}
