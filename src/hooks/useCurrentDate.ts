export const useCurrentDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const parsedMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const parsedDay = String(currentDate.getDate()).padStart(2, "0");

  return {
    currentDate: `${year}-${parsedMonth}-${parsedDay}`,
    year,
    month,
    day,
  };
};
