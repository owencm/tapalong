// TODO: Import datejs

export const isDateValid = (date) => {
  if (Object.prototype.toString.call(date) === "[object Date]") {
    if (isNaN(date.getTime())) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}

// Provide dates and times for the input elements
// Documentation for date formatting: https://code.google.com/p/datejs/wiki/FormatSpecifiers
export const getHyphenSeparatedTime = (date) => {
  return date.toString('HH:mm');
}
export const getHyphenSeparatedDate = (date) => {
  return date.toString('yyyy-MM-dd');
}
export const getHyphenSeparatedToday = () => {
  return Date.today().toString('yyyy-MM-dd');
}
export const getHyphenSeparatedTomorrow = () => {
  return Date.today().add(1).days().toString('yyyy-MM-dd');
}
