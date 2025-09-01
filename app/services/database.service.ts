export interface DatabaseService {
  findOne: (query: any) => Promise<any>;
  find: (query: any) => Promise<any[]>;
  insertOne: (doc: any) => Promise<any>;
  updateOne: (query: any, update: any) => Promise<any>;
  deleteOne: (query: any) => Promise<any>;
} 