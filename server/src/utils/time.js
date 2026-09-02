const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeToDate(value) {
  if (value instanceof Date) return value;
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error('Time must use HH:mm in 24-hour format');
  return new Date(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2])));
}

export function validateTimeRange(startTime, endTime) {
  return timeToDate(startTime).getTime() < timeToDate(endTime).getTime();
}
