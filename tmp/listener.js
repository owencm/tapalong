"use strict";

module.exports = function () {
  var listeners = [];
  var change = function change() {
    listeners.map(function (listener) {
      listener();
    });
  };
  var addListener = function addListener(listener) {
    listeners.push(listener);
  };
  return {
    addListener: addListener,
    change: change
  };
};
