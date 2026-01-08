/*
    A Route Loader Module:
    Loads all routes from src/routes folder and bind it with web app.
 */


import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
export default function routeBinder(app, express, service) {
  const pathToRoutes = path.join(__dirname, '..', 'routes');
  let routerBind = undefined;
  let moduleName = undefined;

  console.log('[RouterBinder] Loading routes from:', pathToRoutes);

  const files = fs.readdirSync(pathToRoutes);
  console.log('[RouterBinder] Found route files:', files);

  files.forEach((file) => {
    try {
      if (_.endsWith(file, '.ts')) {
        moduleName = _.replace(file, '.ts', '');
      } else if (_.endsWith(file, '.js')) {
        moduleName = _.replace(file, '.js', '');
      } else {
        console.log('[RouterBinder] Skipping non-ts/js file:', file);
        return; // Skip non-ts/js files
      }

      console.log(`[RouterBinder] Loading route module: ${moduleName}`);
      routerBind = require(`./../routes/${moduleName}`); // eslint-disable-line global-require, import/no-dynamic-require

      if (routerBind && routerBind.default) {
        const router = routerBind.default(app, express, service);
        app.use('/', router);
        console.log(`[RouterBinder] Successfully registered routes from: ${moduleName}`);
      } else {
        console.warn(`[RouterBinder] Module ${moduleName} does not have a default export`);
      }
    } catch (err) {
      console.error(`[RouterBinder] Error loading route ${file}:`, err.message);
      console.error(err.stack);
    }
  });

  console.log('[RouterBinder] Finished loading routes');
}
