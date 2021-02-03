import * as mongoose from 'mongoose';
import { connection } from '../../config/connection';
import { DbServiceBase } from 'hipolito-framework';

export class DbService extends DbServiceBase {
  constructor() {
    super(connection, mongoose);
  }
}
