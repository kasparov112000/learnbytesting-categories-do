import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let connection: { readyState: number };

  beforeEach(async () => {
    connection = {
      readyState: 1,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // healthCheck()
  // =========================================================================
  describe('healthCheck()', () => {
    it('should return status "ok"', () => {
      const result = controller.healthCheck();

      expect(result.status).toBe('ok');
    });

    it('should return service name "categories"', () => {
      const result = controller.healthCheck();

      expect(result.service).toBe('categories');
    });

    it('should return a valid ISO 8601 timestamp', () => {
      const result = controller.healthCheck();

      expect(result.timestamp).toBeDefined();
      // Verify it parses as a valid date
      const parsed = new Date(result.timestamp);
      expect(parsed.getTime()).not.toBeNaN();
      // Verify ISO format (contains 'T' separator and ends with 'Z')
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // =========================================================================
  // ping()
  // =========================================================================
  describe('ping()', () => {
    it('should return status "ok"', () => {
      const result = controller.ping();

      expect(result.status).toBe('ok');
    });

    it('should return a message indicating the service is running', () => {
      const result = controller.ping();

      expect(result.message).toBe('Categories service is running');
    });
  });

  // =========================================================================
  // pingDb()
  // =========================================================================
  describe('pingDb()', () => {
    it('should return status "ok" and database "connected" when readyState is 1', () => {
      connection.readyState = 1;

      const result = controller.pingDb();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
    });

    it('should return status "error" and database "disconnected" when readyState is 0', () => {
      connection.readyState = 0;

      const result = controller.pingDb();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
    });

    it('should return status "error" and database "connecting" when readyState is 2', () => {
      connection.readyState = 2;

      const result = controller.pingDb();

      expect(result.status).toBe('error');
      expect(result.database).toBe('connecting');
    });

    it('should return status "error" and database "disconnecting" when readyState is 3', () => {
      connection.readyState = 3;

      const result = controller.pingDb();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnecting');
    });

    it('should return status "error" and database "unknown" for unexpected readyState values', () => {
      connection.readyState = 99;

      const result = controller.pingDb();

      expect(result.status).toBe('error');
      expect(result.database).toBe('unknown');
    });
  });
});
