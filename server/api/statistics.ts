import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';
import { DateTime, Interval } from 'luxon';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const query = z
    .object({
      start: z
        .string()
        //.datetime()
        .default(() => DateTime.now().minus({ hours: 23 }).toISO()),
      end: z
        .string()
        //.datetime()
        .default(() => DateTime.now().toISO()),
    })
    .parse(getQuery(event));

  const dataPoints = Object.fromEntries(
    Interval.fromDateTimes(
      DateTime.fromISO(query.start),
      DateTime.fromISO(query.end)
    )
      .splitBy({ minutes: 30 })
      .map((interval) => [interval.start?.toSeconds(), null])
  );

  const [[scrollRows], [dragonsRows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(
      `SELECT recorded_on, value FROM recordings
        WHERE record_type = 'total_scrolls'
        AND recorded_on BETWEEN ? AND ?`,
      [query.start, query.end]
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT recorded_on, value FROM recordings
      WHERE record_type = 'total_dragons'
      AND recorded_on BETWEEN ? AND ?`,
      [query.start, query.end]
    ),
  ]);

  const scrolls = { ...dataPoints };
  const dragons = { ...dataPoints };

  scrollRows.forEach((row) => {
    scrolls[row.recorded_on.getTime() / 1000] = row.value;
  });

  dragonsRows.forEach((row) => {
    dragons[row.recorded_on.getTime() / 1000] = row.value;
  });

  return {
    scrolls,
    dragons,
  } as {
    scrolls: Record<number, string>;
    dragons: Record<number, string>;
  };
});
