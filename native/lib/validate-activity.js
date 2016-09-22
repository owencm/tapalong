require('datejs')

const validateActivity = (activity) => {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['description', 'startTime', 'title'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && activity.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'A portion of the response was missing'};
  }
  if (activity.title == '') {
    return {isValid: false, reason: 'A title must be provided'};
  }
  if (!activity.startTime || !(activity.startTime instanceof Date)) {
    return {isValid: false, reason: 'A date and time must be provided'};
  }
  if (activity.startTime && activity.startTime instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (activity.startTime < now) {
      return {isValid: false, reason: `The date must be in the future (${activity.startTime.toString()} was provided)`};
    }
  }
  return { isValid: true };
};

export default validateActivity
