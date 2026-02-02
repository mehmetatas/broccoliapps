// Generates a time sorted 20-char base36 id
const id = () => {
  // We use padStart to handle the future roll-over to 9 chars (in the year 2059)
  const stamp = Date.now().toString(36).padStart(9, "0");
  return stamp + token(11);
};

const token = (length = 32) => {
  const bytes = new Uint8Array(Math.ceil(length * Math.log2(36) / 8));
  crypto.getRandomValues(bytes);

  const num = bytes.reduce((acc, b) => acc * 256n + BigInt(b), 0n);
  return num.toString(36).padStart(length, "0").slice(0, length);
};

export const random = {
  id,
  token,
};
