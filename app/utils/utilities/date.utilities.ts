import { range } from "lodash";

export class DateUtilities {
    constructor() {}

    public static getPerformanceYears(): Array<{
        name: string;
        value: number;
    }> {
        return range(2015, this.currentPerformanceYear() + 2).map((year) => {
            return { name: year.toString(), value: year };
        });
    }

    public static currentPerformanceYear(): number {
        const date = new Date();
        let year = date.getFullYear();
        if (date >= new Date(year, 4, 1)) {
            year = year + 1;
            return year;
        } else {
            return year;
        }
    }
}
