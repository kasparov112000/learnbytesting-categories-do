export class StringUtilities {
    constructor() {}

    public static enumToOptions(
        inputEnum: any
    ): Array<{ name: string; value: string }> {
        return Object.keys(inputEnum).map((item) => {
            return {
                name: inputEnum[item],
                value: inputEnum[item],
            };
        });
    }
}
