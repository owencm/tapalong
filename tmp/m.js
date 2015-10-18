// This function merges styles

"use strict";

module.exports = function () {
  for (var _len = arguments.length, objs = Array(_len), _key = 0; _key < _len; _key++) {
    objs[_key] = arguments[_key];
  }

  return Object.assign.apply(Object, [{}].concat(objs));
};
