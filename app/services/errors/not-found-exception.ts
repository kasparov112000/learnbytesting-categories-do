import { HttpException } from './http-exception';
export class NotFoundException extends HttpException {
    public name: string = 'NotFoundException';

    constructor(message?: string) {
        super(404, message);
    }
}