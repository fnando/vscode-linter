import { camelCase, isObject, isArray } from "lodash";

type Dictionary = {
  [key: string]: any;
};

export function camelizeObject(target: any): any {
  if (isArray(target)) {
    return target.map((item) => camelizeObject(item));
  }

  if (isObject(target)) {
    return Object.keys(target).reduce((buffer, key) => {
      buffer[camelCase(key)] = camelizeObject((target as Dictionary)[key]);
      return buffer;
    }, {} as Dictionary);
  }

  return target;
}
