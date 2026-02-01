import * as v from "valibot";

const baseEnvSchema = v.object({
  TABLE_NAME: v.string(),
  BA_APP_ID: v.pipe(v.string(), v.minLength(1)),
});

type BaseEnv = v.InferOutput<typeof baseEnvSchema>;

let _env: BaseEnv | undefined;

/**
 * Returns validated environment variables.
 * Validates on first access (Lambda cold start) and caches the result.
 * Throws immediately if required variables are missing.
 */
export const env = (): BaseEnv => {
  if (_env) {
    return _env;
  }
  _env = v.parse(baseEnvSchema, process.env);
  return _env;
};

/** Whether the code is running inside an AWS Lambda function. */
export const isLambda = (): boolean => !!process.env.LAMBDA_TASK_ROOT;
