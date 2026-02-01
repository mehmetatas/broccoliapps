import { isLambda } from "./env";

type Printer = typeof console.debug | typeof console.info | typeof console.warn | typeof console.error;

const isLambdaEnv = isLambda();

const printLog = (
  print: Printer,
  level: "dbg" | "inf" | "wrn" | "err",
  message: string,
  data?: Record<string, unknown>
) => {
  if (data?.error instanceof Error) {
    data.error = {
      name: data.error.name,
      message: data.error.message,
      stack: data.error.stack,
    };
  }

  const isRunningOnLocalhost = !isLambdaEnv;

  if (isRunningOnLocalhost) {
    print(level.toUpperCase(), new Date().toISOString(), message, data ? JSON.stringify(data, null, 2) : "");
    return;
  }

  if (data?.text !== undefined) {
    data._text = data.text;
    delete data.text;
  }

  // See: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-logging.html
  print({ text: message, ...(data ?? {}) });
};

export const dbg = (message: string, data?: Record<string, unknown>) => {
  printLog(console.debug, "dbg", message, data);
};

export const inf = (message: string, data?: Record<string, unknown>) => {
  printLog(console.info, "inf", message, data);
};

export const wrn = (message: string, data?: Record<string, unknown>) => {
  printLog(console.warn, "wrn", message, data);
};

export const err = (message: string, data?: Record<string, unknown>) => {
  printLog(console.error, "err", message, data);
};

const startTimer = (timerId: string, startData?: Record<string, unknown>) => {
  const startTime = Date.now();
  return {
    stop: (stopData?: Record<string, unknown>) => {
      inf(timerId, {
        ...(startData ?? {}),
        ...(stopData ?? {}),
        __duration: Date.now() - startTime,
        __timer: timerId,
        __logType: "timer",
      });
    },
  };
};

export const log = { dbg, inf, wrn, err, startTimer };
