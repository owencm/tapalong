import React from 'react';

let If = ({condition, children}) => {
  if (children.length > 1) {
    console.error('If tag only supports one child');
  }

  // Pure functions must render something, so render a tag the browser won't
  // understand and will ignore
  return condition ? children : <no-thing />;
}

module.exports = If;
