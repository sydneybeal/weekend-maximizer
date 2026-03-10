import { addDays, isFriday } from 'date-fns'

export interface LongWeekend {
  start: Date
  end: Date
  nights: number
  label: string
  type: '3-day' | '4-day' | '5-day'
}

// US Federal Holidays (approximate — Mon/Fri observed dates are computed)
function getFederalHolidays(year: number): Date[] {
  const holidays: Date[] = []

  // New Year's Day
  holidays.push(new Date(year, 0, 1))
  // MLK Day: 3rd Monday in January
  holidays.push(nthWeekday(year, 0, 1, 3))
  // Presidents' Day: 3rd Monday in February
  holidays.push(nthWeekday(year, 1, 1, 3))
  // Memorial Day: Last Monday in May
  holidays.push(lastWeekday(year, 4, 1))
  // Juneteenth
  holidays.push(new Date(year, 5, 19))
  // Independence Day
  holidays.push(new Date(year, 6, 4))
  // Labor Day: 1st Monday in September
  holidays.push(nthWeekday(year, 8, 1, 1))
  // Columbus Day: 2nd Monday in October
  holidays.push(nthWeekday(year, 9, 1, 2))
  // Veterans Day
  holidays.push(new Date(year, 10, 11))
  // Thanksgiving: 4th Thursday in November
  holidays.push(nthWeekday(year, 10, 4, 4))
  // Christmas Day
  holidays.push(new Date(year, 11, 25))

  return holidays
}

function nthWeekday(year: number, month: number, dow: number, nth: number): Date {
  let count = 0
  const date = new Date(year, month, 1)
  while (true) {
    if (date.getDay() === dow) {
      count++
      if (count === nth) return new Date(date)
    }
    date.setDate(date.getDate() + 1)
  }
}

function lastWeekday(year: number, month: number, dow: number): Date {
  const date = new Date(year, month + 1, 0) // last day of month
  while (date.getDay() !== dow) {
    date.setDate(date.getDate() - 1)
  }
  return new Date(date)
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getUpcomingLongWeekends(fromDate: Date = new Date(), count = 8): LongWeekend[] {
  const results: LongWeekend[] = []
  const years = [fromDate.getFullYear(), fromDate.getFullYear() + 1]
  const holidays: Date[] = years.flatMap(getFederalHolidays)

  const isHoliday = (d: Date) => holidays.some((h) => isSameDay(h, d))

  const cursor = new Date(fromDate)
  cursor.setDate(cursor.getDate() + 1)

  // Look ahead 18 months max
  const limit = addDays(fromDate, 548)

  while (cursor < limit && results.length < count) {
    if (isFriday(cursor)) {
      const fri = new Date(cursor)
      const mon = addDays(fri, 3)
      const thu = addDays(fri, -1)
      const tue = addDays(fri, 4)

      if (isHoliday(fri) && isHoliday(mon)) {
        // Fri holiday + Mon holiday = 5-day
        results.push({
          start: fri,
          end: mon,
          nights: 3,
          label: `${fmt(fri)} – ${fmt(mon)}`,
          type: '5-day',
        })
      } else if (isHoliday(fri)) {
        // Friday holiday → Thu–Sun (4-day)
        results.push({
          start: thu,
          end: addDays(fri, 2),
          nights: 3,
          label: `${fmt(thu)} – ${fmt(addDays(fri, 2))}`,
          type: '4-day',
        })
      } else if (isHoliday(mon)) {
        // Monday holiday → Fri–Mon (4-day)
        results.push({
          start: fri,
          end: mon,
          nights: 3,
          label: `${fmt(fri)} – ${fmt(mon)}`,
          type: '4-day',
        })
      } else if (isHoliday(thu)) {
        // Thursday holiday → Thu–Sun (4-day)
        results.push({
          start: thu,
          end: addDays(fri, 2),
          nights: 3,
          label: `${fmt(thu)} – ${fmt(addDays(fri, 2))}`,
          type: '4-day',
        })
      } else if (isHoliday(tue)) {
        // Tuesday holiday → Fri–Tue (4-day)
        results.push({
          start: fri,
          end: tue,
          nights: 4,
          label: `${fmt(fri)} – ${fmt(tue)}`,
          type: '4-day',
        })
      } else {
        // Regular 3-day weekend (Fri–Sun or Sat–Mon with no holiday)
        results.push({
          start: fri,
          end: addDays(fri, 2),
          nights: 2,
          label: `${fmt(fri)} – ${fmt(addDays(fri, 2))}`,
          type: '3-day',
        })
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return results
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function longWeekendDays(weekends: LongWeekend[]): Date[] {
  const days: Date[] = []
  for (const wk of weekends) {
    const cursor = new Date(wk.start)
    while (cursor <= wk.end) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return days
}
