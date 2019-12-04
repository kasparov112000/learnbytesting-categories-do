import {DbService} from './db.service';

export class users {

    get() {
    const object = new DbService;
    const user = await object.find();
    if (!user) return user;
    const { firstName, lastName, id } = user;
    return {
      id,
      firstName,
      lastName,
    };
   }
   
   getbyId(Id:any) {
    const object = new DbService
    const user = await object.findbyId(Id);
    if (!user) return user;
    const { firstName, lastName, id } = user;
    return {
      id,  
      firstName,
      lastName,
    };
   }

  post() {
    const object = new DbService
    const user = await object.create();
    if (!user) return user;
    const { firstName, lastName, id } = user;
    return {
      response: `${firstName} ${lastName}`+"was created";
    };
   }

  put() {
    const object = new DbService
    const user = await object.update();
    if (!user) return user;
    const { firstName, lastName, id } = user;
    return {
      response: `${firstName} ${lastName}`+"was updated"
    };
   }

  delete() {
    const object = new DbService
    const user = await object.update();
    if (!user) return user;
    const { firstName, lastName, id } = user;
    return {
      id,
      firstName,
      lastName,
      response: `${firstName} ${lastName}`+"was deleted"
    };
   }
}