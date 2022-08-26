import { HttpException } from './http-exception';

export class UnauthorizedException extends HttpException {
    public name: string = 'UnauthorizedException';
    constructor(message?: string) {
        super(401, message);
    }
}