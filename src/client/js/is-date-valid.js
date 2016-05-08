module.exports = (date) => {
  if (Object.prototype.toString.call(date) === "[object Date]") {
    if (isNaN(date.getTime())) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}
