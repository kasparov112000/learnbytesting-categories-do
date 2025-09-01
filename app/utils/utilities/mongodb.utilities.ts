export class MongoDBUtilities {
    constructor() {}
    public static escapeRegex(input: string): string {
        if (input) {
            return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        } else {
            return input;
        }
    }
}
