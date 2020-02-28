import * as path from 'path';
import { ConnectionConfig } from '@mdr/framework';

const environment = process.env.ENV_NAME || 'local';
let database = process.env.MONGO_NAME || 'categories';
if(environment === 'local'){
  database = 'mdr-'+database;
}

const host = process.env.MONGO_HOST || 'localhost';
const mongoport = process.env.MONGO_PORT || 27017;
const password = process.env.MONGO_PASSWORD || '';
const username = process.env.MONGO_USER || '';
const ssl = process.env.MONGO_SSL || false;
const credentials = username ? `${username}:${encodeURIComponent(password)}@` : '';
const poolSize = process.env.MONGO_POOL_SIZE ? parseInt(process.env.MONGO_POOL_SIZE, 10) : 100;

const connection = new ConnectionConfig({
  env: environment,
  host: host,
  modelName: 'Categories',
  schemaPath: path.join(__dirname, '..', 'app', 'models'),
  dbUrl: (process.env.ENV_NAME || 'LOCAL') !== 'LOCAL' ?
    `mongodb+srv://${credentials}${host}/${database}?retryWrites=true` :
    `mongodb://${credentials}${host}:${mongoport}/${database}?ssl=${ssl}`,
  options: {
    poolSize: poolSize,
    useNewUrlParser: true,
  },
});

export { connection };
