import axios from 'axios';
import { microservices } from '../../config/global.config';

export class getUserDataHelper {
    public static async getUserData(userId) {
        const url = microservices.users.getFullURL();
        const response = await axios.get(`${url}/${userId}`);
        return response?.data;
    } 
}
