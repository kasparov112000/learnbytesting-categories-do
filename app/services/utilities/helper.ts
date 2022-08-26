export class Helper {

    public static findNestedObjectByPropertyValue(object: Object, propertyName: string, value: any) {
        let result = null;
        if (object instanceof Array) {
            for (let prop of object) {
                result = this.findNestedObjectByPropertyValue(prop, propertyName, value);
                if (result) {
                    break;
                }
            }
        }
        else {
            for (let prop in object) {
                if (prop === propertyName && object[prop] === value) {
                    return object;
                }
                if (object[prop] instanceof Object || object[prop] instanceof Array) {
                    result = this.findNestedObjectByPropertyValue(object[prop], propertyName, value);
                    if (result) {
                        break;
                    }
                }
            }
        }
        return result;
    }
}