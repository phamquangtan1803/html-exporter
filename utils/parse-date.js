/**
 * @param {string} input
 */
export function parseDate(input) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!isoMatch) {
    throw new Error("Invalid date format");
  }
  const [, y, m, d] = isoMatch;
  return new Date(Number(y), Number(m) - 1, Number(d));
}
