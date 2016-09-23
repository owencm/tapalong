require('datejs')

const validatePlan = (plan) => {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['description', 'startTime', 'title'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && plan.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'A portion of the response was missing'};
  }
  if (plan.title == '') {
    return {isValid: false, reason: 'A title must be provided'};
  }
  if (!plan.startTime || !(plan.startTime instanceof Date)) {
    return {isValid: false, reason: 'A date and time must be provided'};
  }
  if (plan.startTime && plan.startTime instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (plan.startTime < now) {
      return {isValid: false, reason: `New plans cannot be in the past`};
    }
  }
  return { isValid: true };
};

export default validatePlan
