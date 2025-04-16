import { Collection } from 'mongodb';


export interface DatabaseService {
  grid(): Collection<any>;
} 