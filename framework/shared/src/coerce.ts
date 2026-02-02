import * as v from "valibot";

/**
 * Coerce string to number (for query/path params)
 * "123" → 123, "-45.67" → -45.67, "0xa" → validation error
 */
export const coerceNumber = () =>
  v.pipe(
    v.string(),
    v.transform((val: string) => {
      if (!/^-?\d+(\.\d+)?$/.test(val)) {
        throw new Error(`"${val}" is not a valid number`);
      }
      return Number(val);
    }),
    v.number()
  );

/**
 * Coerce string to boolean (for query/path params)
 * "true" → true, "false" → false, "1" → true, "0" → false
 */
export const coerceBoolean = () =>
  v.pipe(
    v.string(),
    v.transform((val: string) => {
      if (val === "true" || val === "1") {
        return true;
      }
      if (val === "false" || val === "0") {
        return false;
      }
      throw new Error(`Cannot convert "${val}" to boolean`);
    }),
    v.boolean()
  );

/**
 * Coerce string to integer (for query/path params)
 * "123" → 123, "123.5" → validation error, "0xa" → validation error
 */
export const coerceInteger = () =>
  v.pipe(
    v.string(),
    v.transform((val: string) => {
      if (!/^\d+$/.test(val)) {
        throw new Error(`"${val}" is not a valid integer`);
      }
      return Number(val);
    }),
    v.integer()
  );

/**
 * Coerce comma-separated string to array of strings (for query params)
 * "a,b,c" → ["a", "b", "c"]
 */
export const coerceStringArray = () =>
  v.pipe(
    v.string(),
    v.transform((val: string) => val.split(",")),
    v.array(v.string())
  );

/**
 * Coerce comma-separated string to array of numbers (for query params)
 * "1,2,3" → [1, 2, 3], "1,0xa" → validation error
 */
export const coerceNumberArray = () =>
  v.pipe(
    v.string(),
    v.transform((val: string) =>
      val.split(",").map((s: string) => {
        if (!/^-?\d+(\.\d+)?$/.test(s)) {
          throw new Error(`"${s}" is not a valid number`);
        }
        return Number(s);
      })
    ),
    v.array(v.number())
  );
