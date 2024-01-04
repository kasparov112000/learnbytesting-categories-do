import moment from "moment";

export class GridFilterSearchHelper {
  public static handleSearchFilter(searchFilter, gridData) {
    let filters = [];
    for (let key in searchFilter) {
      if (searchFilter[key]) {
        filters.push({
          key,
          searchFilter: searchFilter[key],
        });
      }
    }

    if (filters.length === 0) {
      return [gridData];
    }

    return filters.map((filter) => {
      let categories: any;
      switch (filter.searchFilter.filterType) {
        case "text":
          categories = this.getTextFilter({
            key: filter.key,
            searchParams: { ...filter },
            gridData,
          });
          return categories;
        case "number":
          categories = this.getNumberFilter({
            key: filter.key,
            searchFilter: { ...filter },
            gridData,
          });
          return categories;
        case "boolean":
          categories = this.getBooleanFilter({
            key: filter.key,
            searchFilter: { ...filter },
            gridData,
          });
          return categories;
        default:
          return [gridData];
      }
    });
  }

  private static getTextFilter({ key, searchParams, gridData }) {
    let res: any[] = [];
    switch (searchParams?.searchFilter.type) {
      case "equals":
        gridData.forEach((item) => {
          if (
            item[key].toLowerCase() ===
            searchParams.searchFilter.filter.toLowerCase()
          ) {
            res.push(item);
          }
        });
        break;
      case "notEqual":
        gridData.forEach((item) => {
          if (
            item[key].toLowerCase() !==
            searchParams.searchFilter.filter.toLowerCase()
          ) {
            res.push(item);
          }
        });
        break;
      case "contains":
        gridData.forEach((item) => {
          if (
            item[key]
              .toLowerCase()
              .includes(searchParams.searchFilter.filter.toLowerCase())
          ) {
            res.push(item);
          }
        });
        break;
      case "notContains":
        gridData.forEach((item) => {
          if (
            !item[key]
              .toLowerCase()
              .includes(searchParams.searchFilter.filter.toLowerCase())
          ) {
            res.push(item);
          }
        });
        break;
      case "startsWith":
        gridData.forEach((item) => {
          if (
            item[key]
              .toLowerCase()
              .startsWith(searchParams.searchFilter.filter.toLowerCase())
          ) {
            res.push(item);
          }
        });
        break;
      case "endsWith":
        gridData.forEach((item) => {
          if (
            item[key]
              .toLowerCase()
              .endsWith(searchParams.searchFilter.filter.toLowerCase())
          ) {
            res.push(item);
          }
        });
        break;
      case "blank":
        gridData.forEach((item) => {
          if (item[key].trim() === "") {
            res.push(item);
          }
        });
        break;
      case "notBlank":
        gridData.forEach((item) => {
          if (item[key]) {
            res.push(item);
          }
        });
        break;
      default:
        res = gridData;
        break;
    }

    return res;
  }

  private static getNumberFilter({ key, searchFilter, gridData }) {
    switch (searchFilter.type) {
      case "equals":
        return gridData.map((item) => item[key] === searchFilter.filter);
      case "notEqual":
        return gridData.map((item) => item[key] !== searchFilter.filter);
      case "greaterThan":
        return gridData.map((item) => item[key] > searchFilter.filter);
      case "greaterThanOrEqual":
        return gridData.map((item) => item[key] >= searchFilter.filter);
      case "lessThan":
        return gridData.map((item) => item[key] < searchFilter.filter);
      case "lessThanOrEqual":
        return gridData.map((item) => item[key] <= searchFilter.filter);
      default:
        return gridData;
    }
  }

  private static getDateFilter({ key, searchFilter, gridData }) {
    const date = moment
      .utc(searchFilter.dateFrom)
      .format("YYYY-MM-DD HH:mm:ss");

    switch (searchFilter.type) {
      case "equals":
        return gridData.map((item) => item[key] === date);
      case "notEqual":
        return gridData.map((item) => item[key] !== date);
      case "greaterThan":
        return gridData.map((item) => item[key] > date);
      case "greaterThanOrEqual":
        return gridData.map((item) => item[key] >= date);
      case "lessThan":
        return gridData.map((item) => item[key] < date);
      case "lessThanOrEqual":
        return gridData.map((item) => item[key] <= date);
      default:
        return gridData;
    }
  }

  private static getBooleanFilter({ key, searchFilter, gridData }) {
    switch (searchFilter.type) {
      case "equals":
        return gridData.map((item) => item[key] === searchFilter.filter);
      case "notEqual":
        return gridData.map((item) => item[key] !== searchFilter.filter);
      default:
        return gridData;
    }
  }

  private static getSortOrder({ key, searchFilter, gridData }) {
    switch (searchFilter.type) {
      case "asc":
        return gridData.sort((a, b) => {
          if (a[key] > b[key]) {
            return 1;
          }
          if (a[key] < b[key]) {
            return -1;
          }
          return 0;
        });
      case "desc":
        return gridData.sort((a, b) => {
          if (a[key] > b[key]) {
            return -1;
          }
          if (a[key] < b[key]) {
            return 1;
          }
          return 0;
        });
      default:
        return gridData;
    }
  }
}
