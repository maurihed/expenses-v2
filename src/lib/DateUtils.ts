// import { CalendarDate, parseDate } from "@internationalized/date";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Dicdiembre",
];
const WEEK_DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
export const formatTransactionDate = (date: string) => {
  const _date = new Date(date).getTime();
  const currentDate = new Date().getTime();
  const diff = currentDate - _date;
  const diffDays = Math.floor(diff / (1000 * 3600 * 24));

  if (diffDays < 1) {
    return "Hoy";
  }

  if (diffDays < 2) {
    return "Ayer";
  }

  return formatDateName(new Date(date));
};

// 08-09-2024
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}-${year}`;
};

export const formatDateName = (date: Date) => {
  const weekDay = date.getDay();
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}, ${WEEK_DAYS[weekDay]}`;
};

// export const toDatePickerFormat = (date: Date) => {
//   const year = date.getFullYear();
//   const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   const day = date.getDate().toString().padStart(2, "0");
//   return parseDate(`${year}-${month}-${day}`);
// }

// export const parseDatePickerValue = (calendarDate: CalendarDate) => {
//   return new Date(`${calendarDate.month}-${calendarDate.day}-${calendarDate.year}`);
// }

export const getMonthDays = (month: number, year: number): number => {
  return +new Date(year, month, 0).getDate();
};

export const getCurrentDate = (): { day: number; month: number; year: number } => {
  const date = new Date();
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
};

export const getCurrentYear = (): number => new Date().getFullYear();

export const getMonthName = (month: number): string => {
  return MONTHS[month];
};

export const getDateString = (date: Date): string => {
  const month = getMonthName(date.getMonth());
  const day = date.getDate().toString().padStart(2, "0");
  return `${day} ${month}`;
};
