import React from 'react';

let If = ({condition, children}) => {
  return condition ? children : null;
}

module.exports = If;
