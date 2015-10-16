module.exports = function () {
  var listeners = [];
  var change = function () {
    listeners.map(function (listener){
      listener();
    });
  };
  var addListener = function (listener) {
    listeners.push(listener);
  };
  return {
    addListener: addListener,
    change: change
  };
};
