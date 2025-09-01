// Import necessary functions. Just an example
// import baseFunction from '../services/entity.service';

export default function (app, express) {
  let healthcheckRouter = express.Router();
  healthcheckRouter.route('/healthcheck')
    .get((req, res) => {
      res.status(200).json({ message: 'Success' });
    });
  return healthcheckRouter;
}
