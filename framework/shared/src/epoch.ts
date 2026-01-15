const unixEpoch = Date.UTC(1970);

const millis = (epoch = unixEpoch) => Date.now() - epoch;
const seconds = (epoch = unixEpoch) => Math.round(millis(epoch) / 1000);
const minutes = (epoch = unixEpoch) => Math.round(millis(epoch) / (1000 * 60));
const hours = (epoch = unixEpoch) => Math.round(millis(epoch) / (1000 * 60 * 60));
const days = (epoch = unixEpoch) => Math.round(millis(epoch) / (1000 * 60 * 60 * 24));
const months = (epoch = unixEpoch) => Math.round(millis(epoch) / (1000 * 60 * 60 * 24 * (365.25 / 12)));
const years = (epoch = unixEpoch) => Math.round(millis(epoch) / (1000 * 60 * 60 * 24 * 365.25));

export const epoch = {
  millis,
  seconds,
  minutes,
  hours,
  days,
  months,
  years,
};
