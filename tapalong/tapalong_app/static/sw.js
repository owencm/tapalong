(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2014, Klaus Ganser <http://kganser.com>
// MIT Licensed, with this copyright and permission notice
// <http://opensource.org/licenses/MIT>

'use strict';

var objectDB = (function () {

  var makeKey = function makeKey(path) {
    var key = path.length ? path[path.length - 1] : '';
    return [path.length < 2 && !key ? 0 : path.slice(0, -1).map(encodeURIComponent).join('/'), key];
  };
  var scopedRange = function scopedRange(parent, lower, upper, le, ue) {
    parent = parent.map(encodeURIComponent).join('/');
    ue = upper == null || ue;
    lower = lower == null ? [parent] : [parent, lower];
    upper = upper == null ? [parent + '\0'] : [parent, upper];
    return IDBKeyRange.bound(lower, upper, le, ue);
  };
  var resolvePath = function resolvePath(store, path, callback) {
    // substitute array indices in path with numeric keys;
    // second argument to callback is true if path is an empty array slot
    path = path ? path.split('/').map(decodeURIComponent) : [];
    (function advance(i, empty) {
      while (i < path.length && !/0|[1-9][0-9]*/.test(path[i])) i++;
      if (i == path.length) return callback(path, empty);
      var position = parseInt(path[i]);
      store.get(makeKey(path.slice(0, i))).onsuccess = function (e) {
        var result = e.target.result;
        if (!result) return callback(path, empty);
        if (result.type != 'array') return advance(i + 1);
        // set to numeric index initially, and to key if element is found
        path[i] = position;
        store.openCursor(scopedRange(path.slice(0, i))).onsuccess = function (e) {
          var cursor = e.target.result;
          if (cursor && position) {
            cursor.advance(position);
            position = 0;
          } else {
            if (cursor) path[i] = cursor.value.key;
            advance(i + 1, !cursor);
          }
        };
      };
    })(0);
  };
  var get = function get(store, path, callback, cursor) {
    var next;
    if (typeof cursor != 'function') cursor = function () {};
    store.get(makeKey(path)).onsuccess = function (e) {
      var result = e.target.result;
      if (!result) return next || callback();
      (next = function (result, parent, path, callback) {
        var value = result.value,
            type = result.type,
            pending = 1,
            index = 0;
        if (type != 'object' && type != 'array') return callback(value);
        var array = type == 'array',
            c = cursor(path, array);
        value = array ? [] : {};
        if (c === false) return callback(value);
        if (!c || typeof c != 'object') c = { action: c || {} };
        if (typeof c.action != 'function') c.action = function () {};
        store.openCursor(scopedRange(parent, c.lowerBound, c.upperBound, c.lowerExclusive, c.upperExclusive), c.descending ? 'prev' : 'next').onsuccess = function (e) {
          var cursor = e.target.result;
          if (!cursor) return --pending || callback(value);
          var result = cursor.value,
              key = array ? index++ : result.key,
              action = c.action(key);
          if (action == 'stop') return --pending || callback(value);
          if (action != 'skip') {
            value[key] = pending++;
            next(result, parent.concat([result.key]), path.concat([key]), function (child) {
              value[key] = child;
              if (! --pending) callback(value);
            });
          }
          cursor['continue']();
        };
      })(result, path, [], callback);
    };
  };
  var _put = function _put(store, path, value, callback) {
    // { key: (key or index relative to parent)
    //   parent: (path of parent entry)
    //   type: (string|number|boolean|null|array|object)
    //   value: (or null if array or object) }
    var type = Array.isArray(value) ? 'array' : typeof value == 'object' ? value ? 'object' : 'null' : typeof value,
        key = makeKey(path),
        pending = 1,
        cb = function cb() {
      if (! --pending) callback();
    };
    store.put({ parent: key[0], key: key[1], type: type, value: typeof value == 'object' ? null : value }).onsuccess = cb;
    if (type == 'array') {
      value.forEach(function (value, i) {
        pending++;
        _put(store, path.concat([i]), value, cb);
      });
    } else if (type == 'object') {
      Object.keys(value).forEach(function (key) {
        pending++;
        _put(store, path.concat([key]), value[key], cb);
      });
    }
  };
  var _append = function _append(store, path, value, callback) {
    store.openCursor(scopedRange(path), 'prev').onsuccess = function (e) {
      var cursor = e.target.result;
      _put(store, path.concat([cursor ? cursor.value.key + 1 : 0]), value, callback);
    };
  };
  var deleteChildren = function deleteChildren(store, path, callback) {
    var pending = 1,
        cb = function cb() {
      if (! --pending) callback();
    };
    store.openCursor(scopedRange(path)).onsuccess = function (e) {
      var cursor = e.target.result;
      if (!cursor) return cb();
      var result = cursor.value;
      pending++;
      store['delete']([result.parent, result.key]).onsuccess = cb;
      if (result.type == 'object' || result.type == 'array') {
        pending++;
        deleteChildren(store, path.concat([result.key]), cb);
      }
      cursor['continue']();
    };
  };

  return {
    open: function open(database, upgrade, version, onError) {
      /** objectDB: {
            open: function(database:string, upgrade=`{}`:json|function(UpgradeTransaction), version=1:number, onError=undefined:function(error:DOMError, blocked:boolean)) -> Database,
            delete: function(database:string, callback:function(error:undefined|DOMError, blocked:boolean)),
            list: function(callback:function(DOMStringList))
          }
           ObjectDB is backed by `indexedDB`. An upgrade transaction runs on `open` if the database version is less than
          the requested version or does not exist. If `upgrade` is a json value, the data stores in the first transaction
          operation on this `Database` will be populated with this value on an upgrade event. Otherwise, an upgrade will
          be handled by the given function via `UpgradeTransaction`. */
      var self,
          db,
          queue,
          _close,
          open = function open(stores, callback) {
        if (db) return callback();
        if (queue) return queue.push(callback);
        queue = [callback];
        var request = indexedDB.open(database, version || 1);
        request.onupgradeneeded = function (e) {
          var self,
              db = e.target.result,
              data = upgrade === undefined || typeof upgrade == 'function' ? {} : upgrade;
          if (typeof upgrade != 'function') upgrade = function (db) {
            (Array.isArray(stores) ? stores : [stores]).forEach(function (name) {
              db.createObjectStore(name, data);
            });
          };
          /** UpgradeTransaction: {
                oldVersion: number,
                newVersion: number,
                createObjectStore: function(name:string, data=`{}`:json) -> UpgradeTransaction,
                deleteObjectStore: function(name:string) -> UpgradeTransaction
              } */
          upgrade(self = {
            oldVersion: e.oldVersion,
            newVersion: e.newVersion,
            createObjectStore: function createObjectStore(name, data) {
              if (db.objectStoreNames.contains(name)) throw 'objectStore already exists';
              _put(db.createObjectStore(name, { keyPath: ['parent', 'key'] }), [], data === undefined ? {} : data, function () {});
              return self;
            },
            deleteObjectStore: function deleteObjectStore(name) {
              if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
              return self;
            }
          });
        };
        request.onsuccess = function (e) {
          db = e.target.result;
          while (callback = queue.shift()) callback();
          if (_close) {
            db.close();
            _close = null;
          }
        };
        if (onError) {
          request.onerror = function (e) {
            onError(e.target.error, false);
          };
          request.onblocked = function () {
            onError(null, true);
          };
        }
      };
      var _transaction = function _transaction(type, stores, callback) {
        var trans,
            pending = 0,
            values = [],
            self = {
          get: get,
          put: function put(store, path, callback, value, insert, empty) {
            var parentPath = path.slice(0, -1);
            store.get(makeKey(parentPath)).onsuccess = function (e) {
              var parent = e.target.result,
                  key = path[path.length - 1];
              if (!parent && path.length) return callback('Parent resource does not exist');
              if (insert && (!path.length || parent.type != 'array')) return callback('Parent resource is not an array');
              if (parent && parent.type != 'object' && parent.type != 'array') return callback('Parent resource is not an object or array');
              if (parent && parent.type == 'array' && typeof key != 'number') return callback('Invalid index to array resource');
              if (empty) {
                // array slot
                _append(store, parentPath, value, callback);
              } else if (insert) {
                var i = 0,
                    lastShiftKey = key;
                store.openCursor(scopedRange(parentPath, key)).onsuccess = function (e) {
                  var cursor = e.target.result;
                  if (cursor && cursor.value.key == key + i++) {
                    // all contiguous keys after desired position must be shifted by one
                    lastShiftKey = cursor.value.key;
                    return cursor['continue']();
                  }
                  // found last key to shift; now shift subsequent elements' keys
                  var pending = 1,
                      cb = function cb() {
                    if (! --pending) callback();
                  };
                  store.openCursor(scopedRange(parentPath, key, lastShiftKey), 'prev').onsuccess = function (e) {
                    cursor = e.target.result;
                    if (!cursor) return _put(store, path, value, cb);
                    var index = cursor.value.key,
                        currentPath = parentPath.concat([index]);
                    pending++;
                    get(store, currentPath, function (result) {
                      // TODO: delete/put within cursor
                      deleteChildren(store, currentPath, function () {
                        _put(store, parentPath.concat([index + 1]), result, cb);
                        cursor['continue']();
                      });
                    });
                  };
                };
              } else {
                deleteChildren(store, path, function () {
                  _put(store, path, value, callback);
                });
              }
            };
          },
          append: function append(store, path, callback, value) {
            store.get(makeKey(path)).onsuccess = function (e) {
              var parent = e.target.result;
              if (!parent) return callback('Parent resource does not exist');
              if (parent.type != 'array') return callback('Parent resource is not an array');
              _append(store, path, value, callback);
            };
          },
          'delete': function _delete(store, path, callback) {
            store['delete'](makeKey(path));
            deleteChildren(store, path, callback);
          }
        };
        Object.keys(self).forEach(function (name) {
          var method = self[name];
          var wrapped = function wrapped(store, path, value, insert) {
            var i = values.push(pending++) - 1,
                p = path;
            resolvePath(store = trans.objectStore(store), path, function (path, empty) {
              method(store, path, function (value) {
                values[i] = value;
                if (! --pending) {
                  var v = values;
                  values = [];
                  callback.apply(null, v);
                }
              }, value, insert, empty);
            });
          };
          self[name] = function (store, path, value, insert) {
            if (trans) return wrapped(store, path, value, insert);
            open(stores, function () {
              if (!trans) trans = db.transaction(stores, type);
              wrapped(store, path, value, insert);
            });
          };
        });
        return self;
      };
      /** Database: {
            transaction: function(writable=false:boolean, stores='data':[string, ...]|string) -> Transaction|ScopedTransaction,
            get: function(path='':string, writable=false:boolean, cursor=undefined:Cursor, store='data':string) -> ScopedTransaction,
            put: function(path='':string, value:json, store='data':string) -> ScopedTransaction,
            insert: function(path='':string, value:json, store='data':string) -> ScopedTransaction,
            append: function(path='':string, value:json, store='data':string) -> ScopedTransaction,
            delete: function(path='':string, store='data':string) -> ScopedTransaction,
            close: function
          }
           `get`, `put`, `insert`, `append`, and `delete` are convenience methods that operate through `transaction` for
          a single objectStore and return the corresponding `ScopedTransaction`. `get` initiates a read-only
          transaction by default. `transaction` returns a `ScopedTransaction` if a single (string) objectStore is
          specified, and a `Transaction` if operating on multiple objectStores. */
      return self = {
        transaction: function transaction(writable, stores) {
          if (stores == null) stores = 'data';
          var self,
              cb,
              trans = _transaction(writable ? 'readwrite' : 'readonly', stores, function () {
            if (cb) cb.apply(self, arguments);
          });
          /** Transaction: {
                get: function(store:string, path='':string, cursor=undefined:Cursor) -> Transaction,
                put: null|function(store:string, path='':string, value:json) -> Transaction,
                insert: null|function(store:string, path='':string, value:json) -> Transaction,
                append: null|function(store:string, path='':string, value:json) -> Transaction,
                delete: null|function(store:string, path='':string) -> Transaction,
                then: function(callback:function(this:Transaction, json|undefined, ...))
              }
               A `Transaction` acting on multiple data stores must specify a data store as the first argument to every
              operation. Otherwise, these methods correspond to `ScopedTransaction` methods. */

          /** ScopedTransaction: {
                get: function(path='':string, cursor=undefined:Cursor) -> ScopedTransaction,
                put: null|function(path='':string, value:json) -> ScopedTransaction,
                insert: null|function(path='':string, value:json) -> ScopedTransaction,
                append: null|function(path='':string, value:json) -> ScopedTransaction,
                delete: null|function(path='':string) -> ScopedTransaction,
                then: function(callback:function(this:ScopedTransaction, json|undefined, ...))
              }
               All methods except `then` are chainable and execute on the same transaction in parallel. If the
              transaction is not writable, `put`, `insert`, `append`, and `delete` are null.
               `path` is a `/`-separated string of array indices and `encodeURIComponent`-encoded object keys denoting
              the path to the desired element within the object store's json data structure; e.g.
              `'users/123/firstName'`. If undefined, `cursor` buffers all data at the requested path as the result of a
              `get` operation. `insert` will splice the given `value` into the parent array at the specified position,
              shifting any subsequent elements forward.
               When all pending operations complete, `callback` is called with the result of each queued operation in
              order. More operations can be queued onto the same transaction at that time via `this`.
               Results from `put`, `insert`, `append`, and `delete` are error strings or undefined if successful. `get`
              results are json data or undefined if no value exists at the requested path. */

          /** Cursor: function(path:[string|number, ...], array:boolean) -> boolean|Action|{
                lowerBound=null: string|number,
                lowerExclusive=false: boolean,
                upperBound=null: string|number,
                upperExclusive=false: boolean,
                descending=false: boolean,
                action: Action
              } */

          /** Action:function(key:string|number) -> undefined|string
               `Cursor` is a function called for each array or object encountered in the requested json structure. It is
              called with a `path` array (of strings and/or numeric indices) relative to the requested path (i.e. `[]`
              represents the path as requested in `get`) and an `array` boolean that is true if the substructure is an
              array. It returns an `Action` callback or object with a range and `action`, or false to prevent
              recursion into the structure. `lowerBound` and `upperBound` restrict the keys/indices traversed for this
              object/array, and the `Action` function is called with each `key` in the requested range, in order. The
              `Action` callback can optionally return either `'skip'` or `'stop'` to exclude the element at the given
              key from the structure or to exclude and stop iterating, respectively.
               For example, the following call uses a cursor to fetch only the immediate members of the object at the
              requested path. Object and array values will be empty:
              `db.get('path/to/object', function(path) {
                return !path.length;
              });`
               The following call will get immediate members of the requested object sorted lexicographically (by code
              unit value) up to and including key value `'c'`, but excluding key `'abc'` (if any):
              `db.get('path/to/object', function(path) {
                return path.length ? false : {
                  upperBound: 'c',
                  action: function(key) {
                    if (key == 'abc') return 'skip';
                  }
                };
              });` */
          return self = Array.isArray(stores) ? {
            get: function get(store, path, cursor) {
              trans.get(store, path, cursor);
              return self;
            },
            put: !writable ? null : function (store, path, value) {
              trans.put(store, path, value);
              return self;
            },
            insert: !writable ? null : function (store, path, value) {
              trans.put(store, path, value, true);
              return self;
            },
            append: !writable ? null : function (store, path, value) {
              trans.append(store, path, value);
              return self;
            },
            // Removed to avoid error with grunt
            // delete: !writable ? null : function(store, store, path) {
            //   trans.delete(store, store, path);
            //   return self;
            // },
            then: function then(callback) {
              cb = callback;
            }
          } : {
            get: function get(path, cursor) {
              trans.get(stores, path, cursor);
              return self;
            },
            put: !writable ? null : function (path, value) {
              trans.put(stores, path, value);
              return self;
            },
            insert: !writable ? null : function (path, value) {
              trans.put(stores, path, value, true);
              return self;
            },
            append: !writable ? null : function (path, value) {
              trans.append(stores, path, value);
              return self;
            },
            'delete': !writable ? null : function (path) {
              trans['delete'](stores, path);
              return self;
            },
            then: function then(callback) {
              cb = callback;
            }
          };
        },
        get: function get(path, writable, cursor, store) {
          return self.transaction(writable, store).get(path, cursor);
        },
        put: function put(path, value, store) {
          return self.transaction(true, store).put(path, value);
        },
        insert: function insert(path, value, store) {
          return self.transaction(true, store).insert(path, value);
        },
        append: function append(path, value, store) {
          return self.transaction(true, store).append(path, value);
        },
        'delete': function _delete(path, store) {
          return self.transaction(true, store)['delete'](path);
        },
        close: function close() {
          if (db) {
            db.close();
            db = null;
          } else {
            _close = true;
          }
        }
      };
    },
    'delete': function _delete(database, callback) {
      var request = indexedDB.deleteDatabase(database);
      request.onsuccess = request.onerror = function (e) {
        callback(e.target.error, false);
      };
      request.onblocked = function () {
        callback(null, true);
      };
    },
    list: function list(callback) {
      indexedDB.webkitGetDatabaseNames().onsuccess = function (e) {
        callback(e.target.result);
      };
    }
  };
})();

module.exports = objectDB;


},{}],2:[function(require,module,exports){
'use strict';
var objectDB = require('./objectdb.js');

var version = 1;
var logging = true;

var log = function log() {
  if (logging) {
    console.log.apply(console, arguments);
  }
};

self.addEventListener('install', function (e) {
  //Automatically take over the previous worker.
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (e) {
  log('Activated ServiceWorker version: ' + version);
});

//Handle the push received event.
self.addEventListener('push', function (e) {
  log('push listener', e);
  e.waitUntil(new Promise(function (resolve, reject) {
    getNotifications().then(function (notifications) {
      // This is async so resolve once it's done and the notifications are showing
      notifications = notifications.filter(function (notification) {
        return notification.fetched_previously == false;
      });
      notShownOnThisClientBefore(notifications).then(function (notifications) {
        return showNotifications(notifications);
      }).then(resolve);
    }, function (reason) {
      reject(reason);
    });
  }));
});

function getNotifications() {
  return new Promise(function (resolve, reject) {
    // Get the session tokens etc from IDB
    var db = objectDB.open('db-1');
    // Note objectDB does not use actual promises so we can't properly chain this
    db.get().then(function (data) {
      var sessionToken = data.sessionToken;
      var userId = data.userId;
      if (sessionToken == undefined || userId == undefined) {
        throw new Error('User was not logged in. Cannot request notifications.');
      }
      // TODO: Unify networking library with main app
      fetch('/../v1/notifications/', {
        headers: {
          'Session-Token': sessionToken,
          'User-Id': userId
        }
      }).then(function (response) {
        return response.text();
      }).then(function (txt) {
        var notifications = JSON.parse(txt);
        log('Fetched notifications: ', notifications);
        resolve(notifications);
      })['catch'](function (ex) {
        reject();
        console.log(ex);
      });
    });
  });
}

self.addEventListener('notificationclick', function (e) {
  log('notificationclick listener', e);
  e.waitUntil(handleNotificationClick(e));
});

//Utility function to handle the click
function handleNotificationClick(e) {
  log('Notification clicked: ', e.notification);
  e.notification.close();
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: false
  })['catch'](function (ex) {
    console.log(ex);
  }).then(function (clientList) {
    return clients.openWindow(e.notification.data.url);
  });
}

function notShownOnThisClientBefore(notifications) {
  return new Promise(function (resolve, reject) {
    var result = [];
    var db = objectDB.open('db-1');
    db.get().then(function (data) {
      console.log('Database of previously shown notification IDs: ', data);
      for (var i = 0; i < notifications.length; i++) {
        var note = notifications[i];
        if (data.notificationIds.indexOf(note.id) < 0) {
          console.log('This client hasn\t shown notification ' + note.id + ' before');
          result.push(note);
        }
      }
      resolve(result);
    });
  });
}

function showNotifications(notifications) {
  return new Promise(function (resolve, reject) {
    var db = objectDB.open('db-1');
    db.get().then(function (data) {
      if (data.notificationIds == undefined) {
        console.log('SW has never shown a notification before. Creating state in DB.');
        data.notificationIds = [];
      }
      for (var i = 0; i < notifications.length; i++) {
        var note = notifications[i];
        showNotification(note.title, note.body, note.url, note.icon, note.id);
        // We only show notifications never shown before, so we will never add the same ID here twice
        data.notificationIds.push(note.id);
      }
      // Note objectDB does not use real promises so we can't chain this
      db.put('notificationIds', data.notificationIds).then(function () {
        // Resolve one second late just in case it took a while to show the notifications earlier
        // TODO: Move the resolve to happen after at least one showNotification promise has resolved
        setTimeout(resolve, 1000);
      });
    });
  });
}

//Utility function to actually show the notification.
function showNotification(title, body, url, icon, tag) {
  var options = {
    body: body,
    tag: tag,
    // lang: 'test lang',
    icon: icon,
    data: { url: url },
    vibrate: 1000,
    noscreen: false
  };
  if (self.registration && self.registration.showNotification) {
    // TODO: ensure this works after the page is closed
    self.registration.showNotification(title, options);
  }
}


},{"./objectdb.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0bXAvb2JqZWN0ZGIuanMiLCJ0bXAvc3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDE0LCBLbGF1cyBHYW5zZXIgPGh0dHA6Ly9rZ2Fuc2VyLmNvbT5cbi8vIE1JVCBMaWNlbnNlZCwgd2l0aCB0aGlzIGNvcHlyaWdodCBhbmQgcGVybWlzc2lvbiBub3RpY2Vcbi8vIDxodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUPlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3REQiA9IChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIG1ha2VLZXkgPSBmdW5jdGlvbiBtYWtlS2V5KHBhdGgpIHtcbiAgICB2YXIga2V5ID0gcGF0aC5sZW5ndGggPyBwYXRoW3BhdGgubGVuZ3RoIC0gMV0gOiAnJztcbiAgICByZXR1cm4gW3BhdGgubGVuZ3RoIDwgMiAmJiAha2V5ID8gMCA6IHBhdGguc2xpY2UoMCwgLTEpLm1hcChlbmNvZGVVUklDb21wb25lbnQpLmpvaW4oJy8nKSwga2V5XTtcbiAgfTtcbiAgdmFyIHNjb3BlZFJhbmdlID0gZnVuY3Rpb24gc2NvcGVkUmFuZ2UocGFyZW50LCBsb3dlciwgdXBwZXIsIGxlLCB1ZSkge1xuICAgIHBhcmVudCA9IHBhcmVudC5tYXAoZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcvJyk7XG4gICAgdWUgPSB1cHBlciA9PSBudWxsIHx8IHVlO1xuICAgIGxvd2VyID0gbG93ZXIgPT0gbnVsbCA/IFtwYXJlbnRdIDogW3BhcmVudCwgbG93ZXJdO1xuICAgIHVwcGVyID0gdXBwZXIgPT0gbnVsbCA/IFtwYXJlbnQgKyAnXFwwJ10gOiBbcGFyZW50LCB1cHBlcl07XG4gICAgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKGxvd2VyLCB1cHBlciwgbGUsIHVlKTtcbiAgfTtcbiAgdmFyIHJlc29sdmVQYXRoID0gZnVuY3Rpb24gcmVzb2x2ZVBhdGgoc3RvcmUsIHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgLy8gc3Vic3RpdHV0ZSBhcnJheSBpbmRpY2VzIGluIHBhdGggd2l0aCBudW1lcmljIGtleXM7XG4gICAgLy8gc2Vjb25kIGFyZ3VtZW50IHRvIGNhbGxiYWNrIGlzIHRydWUgaWYgcGF0aCBpcyBhbiBlbXB0eSBhcnJheSBzbG90XG4gICAgcGF0aCA9IHBhdGggPyBwYXRoLnNwbGl0KCcvJykubWFwKGRlY29kZVVSSUNvbXBvbmVudCkgOiBbXTtcbiAgICAoZnVuY3Rpb24gYWR2YW5jZShpLCBlbXB0eSkge1xuICAgICAgd2hpbGUgKGkgPCBwYXRoLmxlbmd0aCAmJiAhLzB8WzEtOV1bMC05XSovLnRlc3QocGF0aFtpXSkpIGkrKztcbiAgICAgIGlmIChpID09IHBhdGgubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2socGF0aCwgZW1wdHkpO1xuICAgICAgdmFyIHBvc2l0aW9uID0gcGFyc2VJbnQocGF0aFtpXSk7XG4gICAgICBzdG9yZS5nZXQobWFrZUtleShwYXRoLnNsaWNlKDAsIGkpKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHJldHVybiBjYWxsYmFjayhwYXRoLCBlbXB0eSk7XG4gICAgICAgIGlmIChyZXN1bHQudHlwZSAhPSAnYXJyYXknKSByZXR1cm4gYWR2YW5jZShpICsgMSk7XG4gICAgICAgIC8vIHNldCB0byBudW1lcmljIGluZGV4IGluaXRpYWxseSwgYW5kIHRvIGtleSBpZiBlbGVtZW50IGlzIGZvdW5kXG4gICAgICAgIHBhdGhbaV0gPSBwb3NpdGlvbjtcbiAgICAgICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXRoLnNsaWNlKDAsIGkpKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIGlmIChjdXJzb3IgJiYgcG9zaXRpb24pIHtcbiAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gMDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGN1cnNvcikgcGF0aFtpXSA9IGN1cnNvci52YWx1ZS5rZXk7XG4gICAgICAgICAgICBhZHZhbmNlKGkgKyAxLCAhY3Vyc29yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pKDApO1xuICB9O1xuICB2YXIgZ2V0ID0gZnVuY3Rpb24gZ2V0KHN0b3JlLCBwYXRoLCBjYWxsYmFjaywgY3Vyc29yKSB7XG4gICAgdmFyIG5leHQ7XG4gICAgaWYgKHR5cGVvZiBjdXJzb3IgIT0gJ2Z1bmN0aW9uJykgY3Vyc29yID0gZnVuY3Rpb24gKCkge307XG4gICAgc3RvcmUuZ2V0KG1ha2VLZXkocGF0aCkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgaWYgKCFyZXN1bHQpIHJldHVybiBuZXh0IHx8IGNhbGxiYWNrKCk7XG4gICAgICAobmV4dCA9IGZ1bmN0aW9uIChyZXN1bHQsIHBhcmVudCwgcGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlLFxuICAgICAgICAgICAgdHlwZSA9IHJlc3VsdC50eXBlLFxuICAgICAgICAgICAgcGVuZGluZyA9IDEsXG4gICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGlmICh0eXBlICE9ICdvYmplY3QnICYmIHR5cGUgIT0gJ2FycmF5JykgcmV0dXJuIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgdmFyIGFycmF5ID0gdHlwZSA9PSAnYXJyYXknLFxuICAgICAgICAgICAgYyA9IGN1cnNvcihwYXRoLCBhcnJheSk7XG4gICAgICAgIHZhbHVlID0gYXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICBpZiAoYyA9PT0gZmFsc2UpIHJldHVybiBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIGlmICghYyB8fCB0eXBlb2YgYyAhPSAnb2JqZWN0JykgYyA9IHsgYWN0aW9uOiBjIHx8IHt9IH07XG4gICAgICAgIGlmICh0eXBlb2YgYy5hY3Rpb24gIT0gJ2Z1bmN0aW9uJykgYy5hY3Rpb24gPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXJlbnQsIGMubG93ZXJCb3VuZCwgYy51cHBlckJvdW5kLCBjLmxvd2VyRXhjbHVzaXZlLCBjLnVwcGVyRXhjbHVzaXZlKSwgYy5kZXNjZW5kaW5nID8gJ3ByZXYnIDogJ25leHQnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgaWYgKCFjdXJzb3IpIHJldHVybiAtLXBlbmRpbmcgfHwgY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJzb3IudmFsdWUsXG4gICAgICAgICAgICAgIGtleSA9IGFycmF5ID8gaW5kZXgrKyA6IHJlc3VsdC5rZXksXG4gICAgICAgICAgICAgIGFjdGlvbiA9IGMuYWN0aW9uKGtleSk7XG4gICAgICAgICAgaWYgKGFjdGlvbiA9PSAnc3RvcCcpIHJldHVybiAtLXBlbmRpbmcgfHwgY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICAgIGlmIChhY3Rpb24gIT0gJ3NraXAnKSB7XG4gICAgICAgICAgICB2YWx1ZVtrZXldID0gcGVuZGluZysrO1xuICAgICAgICAgICAgbmV4dChyZXN1bHQsIHBhcmVudC5jb25jYXQoW3Jlc3VsdC5rZXldKSwgcGF0aC5jb25jYXQoW2tleV0pLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgdmFsdWVba2V5XSA9IGNoaWxkO1xuICAgICAgICAgICAgICBpZiAoISAtLXBlbmRpbmcpIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHJlc3VsdCwgcGF0aCwgW10sIGNhbGxiYWNrKTtcbiAgICB9O1xuICB9O1xuICB2YXIgX3B1dCA9IGZ1bmN0aW9uIF9wdXQoc3RvcmUsIHBhdGgsIHZhbHVlLCBjYWxsYmFjaykge1xuICAgIC8vIHsga2V5OiAoa2V5IG9yIGluZGV4IHJlbGF0aXZlIHRvIHBhcmVudClcbiAgICAvLyAgIHBhcmVudDogKHBhdGggb2YgcGFyZW50IGVudHJ5KVxuICAgIC8vICAgdHlwZTogKHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsfGFycmF5fG9iamVjdClcbiAgICAvLyAgIHZhbHVlOiAob3IgbnVsbCBpZiBhcnJheSBvciBvYmplY3QpIH1cbiAgICB2YXIgdHlwZSA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gJ2FycmF5JyA6IHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyA/IHZhbHVlID8gJ29iamVjdCcgOiAnbnVsbCcgOiB0eXBlb2YgdmFsdWUsXG4gICAgICAgIGtleSA9IG1ha2VLZXkocGF0aCksXG4gICAgICAgIHBlbmRpbmcgPSAxLFxuICAgICAgICBjYiA9IGZ1bmN0aW9uIGNiKCkge1xuICAgICAgaWYgKCEgLS1wZW5kaW5nKSBjYWxsYmFjaygpO1xuICAgIH07XG4gICAgc3RvcmUucHV0KHsgcGFyZW50OiBrZXlbMF0sIGtleToga2V5WzFdLCB0eXBlOiB0eXBlLCB2YWx1ZTogdHlwZW9mIHZhbHVlID09ICdvYmplY3QnID8gbnVsbCA6IHZhbHVlIH0pLm9uc3VjY2VzcyA9IGNiO1xuICAgIGlmICh0eXBlID09ICdhcnJheScpIHtcbiAgICAgIHZhbHVlLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpKSB7XG4gICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgX3B1dChzdG9yZSwgcGF0aC5jb25jYXQoW2ldKSwgdmFsdWUsIGNiKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PSAnb2JqZWN0Jykge1xuICAgICAgT2JqZWN0LmtleXModmFsdWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgIF9wdXQoc3RvcmUsIHBhdGguY29uY2F0KFtrZXldKSwgdmFsdWVba2V5XSwgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICB2YXIgX2FwcGVuZCA9IGZ1bmN0aW9uIF9hcHBlbmQoc3RvcmUsIHBhdGgsIHZhbHVlLCBjYWxsYmFjaykge1xuICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGF0aCksICdwcmV2Jykub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBfcHV0KHN0b3JlLCBwYXRoLmNvbmNhdChbY3Vyc29yID8gY3Vyc29yLnZhbHVlLmtleSArIDEgOiAwXSksIHZhbHVlLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgfTtcbiAgdmFyIGRlbGV0ZUNoaWxkcmVuID0gZnVuY3Rpb24gZGVsZXRlQ2hpbGRyZW4oc3RvcmUsIHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBlbmRpbmcgPSAxLFxuICAgICAgICBjYiA9IGZ1bmN0aW9uIGNiKCkge1xuICAgICAgaWYgKCEgLS1wZW5kaW5nKSBjYWxsYmFjaygpO1xuICAgIH07XG4gICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXRoKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBpZiAoIWN1cnNvcikgcmV0dXJuIGNiKCk7XG4gICAgICB2YXIgcmVzdWx0ID0gY3Vyc29yLnZhbHVlO1xuICAgICAgcGVuZGluZysrO1xuICAgICAgc3RvcmVbJ2RlbGV0ZSddKFtyZXN1bHQucGFyZW50LCByZXN1bHQua2V5XSkub25zdWNjZXNzID0gY2I7XG4gICAgICBpZiAocmVzdWx0LnR5cGUgPT0gJ29iamVjdCcgfHwgcmVzdWx0LnR5cGUgPT0gJ2FycmF5Jykge1xuICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgIGRlbGV0ZUNoaWxkcmVuKHN0b3JlLCBwYXRoLmNvbmNhdChbcmVzdWx0LmtleV0pLCBjYik7XG4gICAgICB9XG4gICAgICBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgb3BlbjogZnVuY3Rpb24gb3BlbihkYXRhYmFzZSwgdXBncmFkZSwgdmVyc2lvbiwgb25FcnJvcikge1xuICAgICAgLyoqIG9iamVjdERCOiB7XG4gICAgICAgICAgICBvcGVuOiBmdW5jdGlvbihkYXRhYmFzZTpzdHJpbmcsIHVwZ3JhZGU9YHt9YDpqc29ufGZ1bmN0aW9uKFVwZ3JhZGVUcmFuc2FjdGlvbiksIHZlcnNpb249MTpudW1iZXIsIG9uRXJyb3I9dW5kZWZpbmVkOmZ1bmN0aW9uKGVycm9yOkRPTUVycm9yLCBibG9ja2VkOmJvb2xlYW4pKSAtPiBEYXRhYmFzZSxcbiAgICAgICAgICAgIGRlbGV0ZTogZnVuY3Rpb24oZGF0YWJhc2U6c3RyaW5nLCBjYWxsYmFjazpmdW5jdGlvbihlcnJvcjp1bmRlZmluZWR8RE9NRXJyb3IsIGJsb2NrZWQ6Ym9vbGVhbikpLFxuICAgICAgICAgICAgbGlzdDogZnVuY3Rpb24oY2FsbGJhY2s6ZnVuY3Rpb24oRE9NU3RyaW5nTGlzdCkpXG4gICAgICAgICAgfVxuICAgICAgICAgICBPYmplY3REQiBpcyBiYWNrZWQgYnkgYGluZGV4ZWREQmAuIEFuIHVwZ3JhZGUgdHJhbnNhY3Rpb24gcnVucyBvbiBgb3BlbmAgaWYgdGhlIGRhdGFiYXNlIHZlcnNpb24gaXMgbGVzcyB0aGFuXG4gICAgICAgICAgdGhlIHJlcXVlc3RlZCB2ZXJzaW9uIG9yIGRvZXMgbm90IGV4aXN0LiBJZiBgdXBncmFkZWAgaXMgYSBqc29uIHZhbHVlLCB0aGUgZGF0YSBzdG9yZXMgaW4gdGhlIGZpcnN0IHRyYW5zYWN0aW9uXG4gICAgICAgICAgb3BlcmF0aW9uIG9uIHRoaXMgYERhdGFiYXNlYCB3aWxsIGJlIHBvcHVsYXRlZCB3aXRoIHRoaXMgdmFsdWUgb24gYW4gdXBncmFkZSBldmVudC4gT3RoZXJ3aXNlLCBhbiB1cGdyYWRlIHdpbGxcbiAgICAgICAgICBiZSBoYW5kbGVkIGJ5IHRoZSBnaXZlbiBmdW5jdGlvbiB2aWEgYFVwZ3JhZGVUcmFuc2FjdGlvbmAuICovXG4gICAgICB2YXIgc2VsZixcbiAgICAgICAgICBkYixcbiAgICAgICAgICBxdWV1ZSxcbiAgICAgICAgICBfY2xvc2UsXG4gICAgICAgICAgb3BlbiA9IGZ1bmN0aW9uIG9wZW4oc3RvcmVzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoZGIpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICBpZiAocXVldWUpIHJldHVybiBxdWV1ZS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcXVldWUgPSBbY2FsbGJhY2tdO1xuICAgICAgICB2YXIgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKGRhdGFiYXNlLCB2ZXJzaW9uIHx8IDEpO1xuICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIHNlbGYsXG4gICAgICAgICAgICAgIGRiID0gZS50YXJnZXQucmVzdWx0LFxuICAgICAgICAgICAgICBkYXRhID0gdXBncmFkZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB1cGdyYWRlID09ICdmdW5jdGlvbicgPyB7fSA6IHVwZ3JhZGU7XG4gICAgICAgICAgaWYgKHR5cGVvZiB1cGdyYWRlICE9ICdmdW5jdGlvbicpIHVwZ3JhZGUgPSBmdW5jdGlvbiAoZGIpIHtcbiAgICAgICAgICAgIChBcnJheS5pc0FycmF5KHN0b3JlcykgPyBzdG9yZXMgOiBbc3RvcmVzXSkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShuYW1lLCBkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgICAgLyoqIFVwZ3JhZGVUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgICAgIG9sZFZlcnNpb246IG51bWJlcixcbiAgICAgICAgICAgICAgICBuZXdWZXJzaW9uOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgY3JlYXRlT2JqZWN0U3RvcmU6IGZ1bmN0aW9uKG5hbWU6c3RyaW5nLCBkYXRhPWB7fWA6anNvbikgLT4gVXBncmFkZVRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGRlbGV0ZU9iamVjdFN0b3JlOiBmdW5jdGlvbihuYW1lOnN0cmluZykgLT4gVXBncmFkZVRyYW5zYWN0aW9uXG4gICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICB1cGdyYWRlKHNlbGYgPSB7XG4gICAgICAgICAgICBvbGRWZXJzaW9uOiBlLm9sZFZlcnNpb24sXG4gICAgICAgICAgICBuZXdWZXJzaW9uOiBlLm5ld1ZlcnNpb24sXG4gICAgICAgICAgICBjcmVhdGVPYmplY3RTdG9yZTogZnVuY3Rpb24gY3JlYXRlT2JqZWN0U3RvcmUobmFtZSwgZGF0YSkge1xuICAgICAgICAgICAgICBpZiAoZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhuYW1lKSkgdGhyb3cgJ29iamVjdFN0b3JlIGFscmVhZHkgZXhpc3RzJztcbiAgICAgICAgICAgICAgX3B1dChkYi5jcmVhdGVPYmplY3RTdG9yZShuYW1lLCB7IGtleVBhdGg6IFsncGFyZW50JywgJ2tleSddIH0pLCBbXSwgZGF0YSA9PT0gdW5kZWZpbmVkID8ge30gOiBkYXRhLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZU9iamVjdFN0b3JlOiBmdW5jdGlvbiBkZWxldGVPYmplY3RTdG9yZShuYW1lKSB7XG4gICAgICAgICAgICAgIGlmIChkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKG5hbWUpKSBkYi5kZWxldGVPYmplY3RTdG9yZShuYW1lKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBkYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB3aGlsZSAoY2FsbGJhY2sgPSBxdWV1ZS5zaGlmdCgpKSBjYWxsYmFjaygpO1xuICAgICAgICAgIGlmIChfY2xvc2UpIHtcbiAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICBfY2xvc2UgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgb25FcnJvcihlLnRhcmdldC5lcnJvciwgZmFsc2UpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgcmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvbkVycm9yKG51bGwsIHRydWUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB2YXIgX3RyYW5zYWN0aW9uID0gZnVuY3Rpb24gX3RyYW5zYWN0aW9uKHR5cGUsIHN0b3JlcywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHRyYW5zLFxuICAgICAgICAgICAgcGVuZGluZyA9IDAsXG4gICAgICAgICAgICB2YWx1ZXMgPSBbXSxcbiAgICAgICAgICAgIHNlbGYgPSB7XG4gICAgICAgICAgZ2V0OiBnZXQsXG4gICAgICAgICAgcHV0OiBmdW5jdGlvbiBwdXQoc3RvcmUsIHBhdGgsIGNhbGxiYWNrLCB2YWx1ZSwgaW5zZXJ0LCBlbXB0eSkge1xuICAgICAgICAgICAgdmFyIHBhcmVudFBhdGggPSBwYXRoLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgIHN0b3JlLmdldChtYWtlS2V5KHBhcmVudFBhdGgpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gZS50YXJnZXQucmVzdWx0LFxuICAgICAgICAgICAgICAgICAga2V5ID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICBpZiAoIXBhcmVudCAmJiBwYXRoLmxlbmd0aCkgcmV0dXJuIGNhbGxiYWNrKCdQYXJlbnQgcmVzb3VyY2UgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgICAgICAgaWYgKGluc2VydCAmJiAoIXBhdGgubGVuZ3RoIHx8IHBhcmVudC50eXBlICE9ICdhcnJheScpKSByZXR1cm4gY2FsbGJhY2soJ1BhcmVudCByZXNvdXJjZSBpcyBub3QgYW4gYXJyYXknKTtcbiAgICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSAhPSAnb2JqZWN0JyAmJiBwYXJlbnQudHlwZSAhPSAnYXJyYXknKSByZXR1cm4gY2FsbGJhY2soJ1BhcmVudCByZXNvdXJjZSBpcyBub3QgYW4gb2JqZWN0IG9yIGFycmF5Jyk7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnR5cGUgPT0gJ2FycmF5JyAmJiB0eXBlb2Yga2V5ICE9ICdudW1iZXInKSByZXR1cm4gY2FsbGJhY2soJ0ludmFsaWQgaW5kZXggdG8gYXJyYXkgcmVzb3VyY2UnKTtcbiAgICAgICAgICAgICAgaWYgKGVtcHR5KSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgc2xvdFxuICAgICAgICAgICAgICAgIF9hcHBlbmQoc3RvcmUsIHBhcmVudFBhdGgsIHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5zZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICBsYXN0U2hpZnRLZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXJlbnRQYXRoLCBrZXkpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJzb3IgJiYgY3Vyc29yLnZhbHVlLmtleSA9PSBrZXkgKyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIGNvbnRpZ3VvdXMga2V5cyBhZnRlciBkZXNpcmVkIHBvc2l0aW9uIG11c3QgYmUgc2hpZnRlZCBieSBvbmVcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNoaWZ0S2V5ID0gY3Vyc29yLnZhbHVlLmtleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnNvclsnY29udGludWUnXSgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gZm91bmQgbGFzdCBrZXkgdG8gc2hpZnQ7IG5vdyBzaGlmdCBzdWJzZXF1ZW50IGVsZW1lbnRzJyBrZXlzXG4gICAgICAgICAgICAgICAgICB2YXIgcGVuZGluZyA9IDEsXG4gICAgICAgICAgICAgICAgICAgICAgY2IgPSBmdW5jdGlvbiBjYigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgLS1wZW5kaW5nKSBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGFyZW50UGF0aCwga2V5LCBsYXN0U2hpZnRLZXkpLCAncHJldicpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHJldHVybiBfcHV0KHN0b3JlLCBwYXRoLCB2YWx1ZSwgY2IpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBjdXJzb3IudmFsdWUua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGggPSBwYXJlbnRQYXRoLmNvbmNhdChbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZysrO1xuICAgICAgICAgICAgICAgICAgICBnZXQoc3RvcmUsIGN1cnJlbnRQYXRoLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZGVsZXRlL3B1dCB3aXRoaW4gY3Vyc29yXG4gICAgICAgICAgICAgICAgICAgICAgZGVsZXRlQ2hpbGRyZW4oc3RvcmUsIGN1cnJlbnRQYXRoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHV0KHN0b3JlLCBwYXJlbnRQYXRoLmNvbmNhdChbaW5kZXggKyAxXSksIHJlc3VsdCwgY2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yWydjb250aW51ZSddKCk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGV0ZUNoaWxkcmVuKHN0b3JlLCBwYXRoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBfcHV0KHN0b3JlLCBwYXRoLCB2YWx1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXBwZW5kOiBmdW5jdGlvbiBhcHBlbmQoc3RvcmUsIHBhdGgsIGNhbGxiYWNrLCB2YWx1ZSkge1xuICAgICAgICAgICAgc3RvcmUuZ2V0KG1ha2VLZXkocGF0aCkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgIGlmICghcGFyZW50KSByZXR1cm4gY2FsbGJhY2soJ1BhcmVudCByZXNvdXJjZSBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgICAgICAgICBpZiAocGFyZW50LnR5cGUgIT0gJ2FycmF5JykgcmV0dXJuIGNhbGxiYWNrKCdQYXJlbnQgcmVzb3VyY2UgaXMgbm90IGFuIGFycmF5Jyk7XG4gICAgICAgICAgICAgIF9hcHBlbmQoc3RvcmUsIHBhdGgsIHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uIF9kZWxldGUoc3RvcmUsIHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBzdG9yZVsnZGVsZXRlJ10obWFrZUtleShwYXRoKSk7XG4gICAgICAgICAgICBkZWxldGVDaGlsZHJlbihzdG9yZSwgcGF0aCwgY2FsbGJhY2spO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmtleXMoc2VsZikuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIHZhciBtZXRob2QgPSBzZWxmW25hbWVdO1xuICAgICAgICAgIHZhciB3cmFwcGVkID0gZnVuY3Rpb24gd3JhcHBlZChzdG9yZSwgcGF0aCwgdmFsdWUsIGluc2VydCkge1xuICAgICAgICAgICAgdmFyIGkgPSB2YWx1ZXMucHVzaChwZW5kaW5nKyspIC0gMSxcbiAgICAgICAgICAgICAgICBwID0gcGF0aDtcbiAgICAgICAgICAgIHJlc29sdmVQYXRoKHN0b3JlID0gdHJhbnMub2JqZWN0U3RvcmUoc3RvcmUpLCBwYXRoLCBmdW5jdGlvbiAocGF0aCwgZW1wdHkpIHtcbiAgICAgICAgICAgICAgbWV0aG9kKHN0b3JlLCBwYXRoLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbaV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoISAtLXBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB2ID0gdmFsdWVzO1xuICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCB2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIHZhbHVlLCBpbnNlcnQsIGVtcHR5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgICAgc2VsZltuYW1lXSA9IGZ1bmN0aW9uIChzdG9yZSwgcGF0aCwgdmFsdWUsIGluc2VydCkge1xuICAgICAgICAgICAgaWYgKHRyYW5zKSByZXR1cm4gd3JhcHBlZChzdG9yZSwgcGF0aCwgdmFsdWUsIGluc2VydCk7XG4gICAgICAgICAgICBvcGVuKHN0b3JlcywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoIXRyYW5zKSB0cmFucyA9IGRiLnRyYW5zYWN0aW9uKHN0b3JlcywgdHlwZSk7XG4gICAgICAgICAgICAgIHdyYXBwZWQoc3RvcmUsIHBhdGgsIHZhbHVlLCBpbnNlcnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfTtcbiAgICAgIC8qKiBEYXRhYmFzZToge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb246IGZ1bmN0aW9uKHdyaXRhYmxlPWZhbHNlOmJvb2xlYW4sIHN0b3Jlcz0nZGF0YSc6W3N0cmluZywgLi4uXXxzdHJpbmcpIC0+IFRyYW5zYWN0aW9ufFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgd3JpdGFibGU9ZmFsc2U6Ym9vbGVhbiwgY3Vyc29yPXVuZGVmaW5lZDpDdXJzb3IsIHN0b3JlPSdkYXRhJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgcHV0OiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbiwgc3RvcmU9J2RhdGEnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBpbnNlcnQ6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uLCBzdG9yZT0nZGF0YSc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIGFwcGVuZDogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24sIHN0b3JlPSdkYXRhJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgZGVsZXRlOiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgc3RvcmU9J2RhdGEnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBjbG9zZTogZnVuY3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgIGBnZXRgLCBgcHV0YCwgYGluc2VydGAsIGBhcHBlbmRgLCBhbmQgYGRlbGV0ZWAgYXJlIGNvbnZlbmllbmNlIG1ldGhvZHMgdGhhdCBvcGVyYXRlIHRocm91Z2ggYHRyYW5zYWN0aW9uYCBmb3JcbiAgICAgICAgICBhIHNpbmdsZSBvYmplY3RTdG9yZSBhbmQgcmV0dXJuIHRoZSBjb3JyZXNwb25kaW5nIGBTY29wZWRUcmFuc2FjdGlvbmAuIGBnZXRgIGluaXRpYXRlcyBhIHJlYWQtb25seVxuICAgICAgICAgIHRyYW5zYWN0aW9uIGJ5IGRlZmF1bHQuIGB0cmFuc2FjdGlvbmAgcmV0dXJucyBhIGBTY29wZWRUcmFuc2FjdGlvbmAgaWYgYSBzaW5nbGUgKHN0cmluZykgb2JqZWN0U3RvcmUgaXNcbiAgICAgICAgICBzcGVjaWZpZWQsIGFuZCBhIGBUcmFuc2FjdGlvbmAgaWYgb3BlcmF0aW5nIG9uIG11bHRpcGxlIG9iamVjdFN0b3Jlcy4gKi9cbiAgICAgIHJldHVybiBzZWxmID0ge1xuICAgICAgICB0cmFuc2FjdGlvbjogZnVuY3Rpb24gdHJhbnNhY3Rpb24od3JpdGFibGUsIHN0b3Jlcykge1xuICAgICAgICAgIGlmIChzdG9yZXMgPT0gbnVsbCkgc3RvcmVzID0gJ2RhdGEnO1xuICAgICAgICAgIHZhciBzZWxmLFxuICAgICAgICAgICAgICBjYixcbiAgICAgICAgICAgICAgdHJhbnMgPSBfdHJhbnNhY3Rpb24od3JpdGFibGUgPyAncmVhZHdyaXRlJyA6ICdyZWFkb25seScsIHN0b3JlcywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNiKSBjYi5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8qKiBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oc3RvcmU6c3RyaW5nLCBwYXRoPScnOnN0cmluZywgY3Vyc29yPXVuZGVmaW5lZDpDdXJzb3IpIC0+IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIHB1dDogbnVsbHxmdW5jdGlvbihzdG9yZTpzdHJpbmcsIHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBpbnNlcnQ6IG51bGx8ZnVuY3Rpb24oc3RvcmU6c3RyaW5nLCBwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgYXBwZW5kOiBudWxsfGZ1bmN0aW9uKHN0b3JlOnN0cmluZywgcGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGRlbGV0ZTogbnVsbHxmdW5jdGlvbihzdG9yZTpzdHJpbmcsIHBhdGg9Jyc6c3RyaW5nKSAtPiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICB0aGVuOiBmdW5jdGlvbihjYWxsYmFjazpmdW5jdGlvbih0aGlzOlRyYW5zYWN0aW9uLCBqc29ufHVuZGVmaW5lZCwgLi4uKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgQSBgVHJhbnNhY3Rpb25gIGFjdGluZyBvbiBtdWx0aXBsZSBkYXRhIHN0b3JlcyBtdXN0IHNwZWNpZnkgYSBkYXRhIHN0b3JlIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byBldmVyeVxuICAgICAgICAgICAgICBvcGVyYXRpb24uIE90aGVyd2lzZSwgdGhlc2UgbWV0aG9kcyBjb3JyZXNwb25kIHRvIGBTY29wZWRUcmFuc2FjdGlvbmAgbWV0aG9kcy4gKi9cblxuICAgICAgICAgIC8qKiBTY29wZWRUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIGN1cnNvcj11bmRlZmluZWQ6Q3Vyc29yKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBwdXQ6IG51bGx8ZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGluc2VydDogbnVsbHxmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgYXBwZW5kOiBudWxsfGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBkZWxldGU6IG51bGx8ZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIHRoZW46IGZ1bmN0aW9uKGNhbGxiYWNrOmZ1bmN0aW9uKHRoaXM6U2NvcGVkVHJhbnNhY3Rpb24sIGpzb258dW5kZWZpbmVkLCAuLi4pKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBBbGwgbWV0aG9kcyBleGNlcHQgYHRoZW5gIGFyZSBjaGFpbmFibGUgYW5kIGV4ZWN1dGUgb24gdGhlIHNhbWUgdHJhbnNhY3Rpb24gaW4gcGFyYWxsZWwuIElmIHRoZVxuICAgICAgICAgICAgICB0cmFuc2FjdGlvbiBpcyBub3Qgd3JpdGFibGUsIGBwdXRgLCBgaW5zZXJ0YCwgYGFwcGVuZGAsIGFuZCBgZGVsZXRlYCBhcmUgbnVsbC5cbiAgICAgICAgICAgICAgIGBwYXRoYCBpcyBhIGAvYC1zZXBhcmF0ZWQgc3RyaW5nIG9mIGFycmF5IGluZGljZXMgYW5kIGBlbmNvZGVVUklDb21wb25lbnRgLWVuY29kZWQgb2JqZWN0IGtleXMgZGVub3RpbmdcbiAgICAgICAgICAgICAgdGhlIHBhdGggdG8gdGhlIGRlc2lyZWQgZWxlbWVudCB3aXRoaW4gdGhlIG9iamVjdCBzdG9yZSdzIGpzb24gZGF0YSBzdHJ1Y3R1cmU7IGUuZy5cbiAgICAgICAgICAgICAgYCd1c2Vycy8xMjMvZmlyc3ROYW1lJ2AuIElmIHVuZGVmaW5lZCwgYGN1cnNvcmAgYnVmZmVycyBhbGwgZGF0YSBhdCB0aGUgcmVxdWVzdGVkIHBhdGggYXMgdGhlIHJlc3VsdCBvZiBhXG4gICAgICAgICAgICAgIGBnZXRgIG9wZXJhdGlvbi4gYGluc2VydGAgd2lsbCBzcGxpY2UgdGhlIGdpdmVuIGB2YWx1ZWAgaW50byB0aGUgcGFyZW50IGFycmF5IGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb24sXG4gICAgICAgICAgICAgIHNoaWZ0aW5nIGFueSBzdWJzZXF1ZW50IGVsZW1lbnRzIGZvcndhcmQuXG4gICAgICAgICAgICAgICBXaGVuIGFsbCBwZW5kaW5nIG9wZXJhdGlvbnMgY29tcGxldGUsIGBjYWxsYmFja2AgaXMgY2FsbGVkIHdpdGggdGhlIHJlc3VsdCBvZiBlYWNoIHF1ZXVlZCBvcGVyYXRpb24gaW5cbiAgICAgICAgICAgICAgb3JkZXIuIE1vcmUgb3BlcmF0aW9ucyBjYW4gYmUgcXVldWVkIG9udG8gdGhlIHNhbWUgdHJhbnNhY3Rpb24gYXQgdGhhdCB0aW1lIHZpYSBgdGhpc2AuXG4gICAgICAgICAgICAgICBSZXN1bHRzIGZyb20gYHB1dGAsIGBpbnNlcnRgLCBgYXBwZW5kYCwgYW5kIGBkZWxldGVgIGFyZSBlcnJvciBzdHJpbmdzIG9yIHVuZGVmaW5lZCBpZiBzdWNjZXNzZnVsLiBgZ2V0YFxuICAgICAgICAgICAgICByZXN1bHRzIGFyZSBqc29uIGRhdGEgb3IgdW5kZWZpbmVkIGlmIG5vIHZhbHVlIGV4aXN0cyBhdCB0aGUgcmVxdWVzdGVkIHBhdGguICovXG5cbiAgICAgICAgICAvKiogQ3Vyc29yOiBmdW5jdGlvbihwYXRoOltzdHJpbmd8bnVtYmVyLCAuLi5dLCBhcnJheTpib29sZWFuKSAtPiBib29sZWFufEFjdGlvbnx7XG4gICAgICAgICAgICAgICAgbG93ZXJCb3VuZD1udWxsOiBzdHJpbmd8bnVtYmVyLFxuICAgICAgICAgICAgICAgIGxvd2VyRXhjbHVzaXZlPWZhbHNlOiBib29sZWFuLFxuICAgICAgICAgICAgICAgIHVwcGVyQm91bmQ9bnVsbDogc3RyaW5nfG51bWJlcixcbiAgICAgICAgICAgICAgICB1cHBlckV4Y2x1c2l2ZT1mYWxzZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgICBkZXNjZW5kaW5nPWZhbHNlOiBib29sZWFuLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogQWN0aW9uXG4gICAgICAgICAgICAgIH0gKi9cblxuICAgICAgICAgIC8qKiBBY3Rpb246ZnVuY3Rpb24oa2V5OnN0cmluZ3xudW1iZXIpIC0+IHVuZGVmaW5lZHxzdHJpbmdcbiAgICAgICAgICAgICAgIGBDdXJzb3JgIGlzIGEgZnVuY3Rpb24gY2FsbGVkIGZvciBlYWNoIGFycmF5IG9yIG9iamVjdCBlbmNvdW50ZXJlZCBpbiB0aGUgcmVxdWVzdGVkIGpzb24gc3RydWN0dXJlLiBJdCBpc1xuICAgICAgICAgICAgICBjYWxsZWQgd2l0aCBhIGBwYXRoYCBhcnJheSAob2Ygc3RyaW5ncyBhbmQvb3IgbnVtZXJpYyBpbmRpY2VzKSByZWxhdGl2ZSB0byB0aGUgcmVxdWVzdGVkIHBhdGggKGkuZS4gYFtdYFxuICAgICAgICAgICAgICByZXByZXNlbnRzIHRoZSBwYXRoIGFzIHJlcXVlc3RlZCBpbiBgZ2V0YCkgYW5kIGFuIGBhcnJheWAgYm9vbGVhbiB0aGF0IGlzIHRydWUgaWYgdGhlIHN1YnN0cnVjdHVyZSBpcyBhblxuICAgICAgICAgICAgICBhcnJheS4gSXQgcmV0dXJucyBhbiBgQWN0aW9uYCBjYWxsYmFjayBvciBvYmplY3Qgd2l0aCBhIHJhbmdlIGFuZCBgYWN0aW9uYCwgb3IgZmFsc2UgdG8gcHJldmVudFxuICAgICAgICAgICAgICByZWN1cnNpb24gaW50byB0aGUgc3RydWN0dXJlLiBgbG93ZXJCb3VuZGAgYW5kIGB1cHBlckJvdW5kYCByZXN0cmljdCB0aGUga2V5cy9pbmRpY2VzIHRyYXZlcnNlZCBmb3IgdGhpc1xuICAgICAgICAgICAgICBvYmplY3QvYXJyYXksIGFuZCB0aGUgYEFjdGlvbmAgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggZWFjaCBga2V5YCBpbiB0aGUgcmVxdWVzdGVkIHJhbmdlLCBpbiBvcmRlci4gVGhlXG4gICAgICAgICAgICAgIGBBY3Rpb25gIGNhbGxiYWNrIGNhbiBvcHRpb25hbGx5IHJldHVybiBlaXRoZXIgYCdza2lwJ2Agb3IgYCdzdG9wJ2AgdG8gZXhjbHVkZSB0aGUgZWxlbWVudCBhdCB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAga2V5IGZyb20gdGhlIHN0cnVjdHVyZSBvciB0byBleGNsdWRlIGFuZCBzdG9wIGl0ZXJhdGluZywgcmVzcGVjdGl2ZWx5LlxuICAgICAgICAgICAgICAgRm9yIGV4YW1wbGUsIHRoZSBmb2xsb3dpbmcgY2FsbCB1c2VzIGEgY3Vyc29yIHRvIGZldGNoIG9ubHkgdGhlIGltbWVkaWF0ZSBtZW1iZXJzIG9mIHRoZSBvYmplY3QgYXQgdGhlXG4gICAgICAgICAgICAgIHJlcXVlc3RlZCBwYXRoLiBPYmplY3QgYW5kIGFycmF5IHZhbHVlcyB3aWxsIGJlIGVtcHR5OlxuICAgICAgICAgICAgICBgZGIuZ2V0KCdwYXRoL3RvL29iamVjdCcsIGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIXBhdGgubGVuZ3RoO1xuICAgICAgICAgICAgICB9KTtgXG4gICAgICAgICAgICAgICBUaGUgZm9sbG93aW5nIGNhbGwgd2lsbCBnZXQgaW1tZWRpYXRlIG1lbWJlcnMgb2YgdGhlIHJlcXVlc3RlZCBvYmplY3Qgc29ydGVkIGxleGljb2dyYXBoaWNhbGx5IChieSBjb2RlXG4gICAgICAgICAgICAgIHVuaXQgdmFsdWUpIHVwIHRvIGFuZCBpbmNsdWRpbmcga2V5IHZhbHVlIGAnYydgLCBidXQgZXhjbHVkaW5nIGtleSBgJ2FiYydgIChpZiBhbnkpOlxuICAgICAgICAgICAgICBgZGIuZ2V0KCdwYXRoL3RvL29iamVjdCcsIGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aC5sZW5ndGggPyBmYWxzZSA6IHtcbiAgICAgICAgICAgICAgICAgIHVwcGVyQm91bmQ6ICdjJyxcbiAgICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT0gJ2FiYycpIHJldHVybiAnc2tpcCc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSk7YCAqL1xuICAgICAgICAgIHJldHVybiBzZWxmID0gQXJyYXkuaXNBcnJheShzdG9yZXMpID8ge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoc3RvcmUsIHBhdGgsIGN1cnNvcikge1xuICAgICAgICAgICAgICB0cmFucy5nZXQoc3RvcmUsIHBhdGgsIGN1cnNvcik7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHB1dDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChzdG9yZSwgcGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMucHV0KHN0b3JlLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc2VydDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChzdG9yZSwgcGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMucHV0KHN0b3JlLCBwYXRoLCB2YWx1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFwcGVuZDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChzdG9yZSwgcGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMuYXBwZW5kKHN0b3JlLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJlbW92ZWQgdG8gYXZvaWQgZXJyb3Igd2l0aCBncnVudFxuICAgICAgICAgICAgLy8gZGVsZXRlOiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24oc3RvcmUsIHN0b3JlLCBwYXRoKSB7XG4gICAgICAgICAgICAvLyAgIHRyYW5zLmRlbGV0ZShzdG9yZSwgc3RvcmUsIHBhdGgpO1xuICAgICAgICAgICAgLy8gICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB0aGVuOiBmdW5jdGlvbiB0aGVuKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIGNiID0gY2FsbGJhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KHBhdGgsIGN1cnNvcikge1xuICAgICAgICAgICAgICB0cmFucy5nZXQoc3RvcmVzLCBwYXRoLCBjdXJzb3IpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwdXQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMucHV0KHN0b3JlcywgcGF0aCwgdmFsdWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbnNlcnQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMucHV0KHN0b3JlcywgcGF0aCwgdmFsdWUsIHRydWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhcHBlbmQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgdHJhbnMuYXBwZW5kKHN0b3JlcywgcGF0aCwgdmFsdWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZGVsZXRlJzogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgIHRyYW5zWydkZWxldGUnXShzdG9yZXMsIHBhdGgpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aGVuOiBmdW5jdGlvbiB0aGVuKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIGNiID0gY2FsbGJhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQocGF0aCwgd3JpdGFibGUsIGN1cnNvciwgc3RvcmUpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi50cmFuc2FjdGlvbih3cml0YWJsZSwgc3RvcmUpLmdldChwYXRoLCBjdXJzb3IpO1xuICAgICAgICB9LFxuICAgICAgICBwdXQ6IGZ1bmN0aW9uIHB1dChwYXRoLCB2YWx1ZSwgc3RvcmUpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi50cmFuc2FjdGlvbih0cnVlLCBzdG9yZSkucHV0KHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5zZXJ0OiBmdW5jdGlvbiBpbnNlcnQocGF0aCwgdmFsdWUsIHN0b3JlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudHJhbnNhY3Rpb24odHJ1ZSwgc3RvcmUpLmluc2VydChwYXRoLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZDogZnVuY3Rpb24gYXBwZW5kKHBhdGgsIHZhbHVlLCBzdG9yZSkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnRyYW5zYWN0aW9uKHRydWUsIHN0b3JlKS5hcHBlbmQocGF0aCwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICAnZGVsZXRlJzogZnVuY3Rpb24gX2RlbGV0ZShwYXRoLCBzdG9yZSkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnRyYW5zYWN0aW9uKHRydWUsIHN0b3JlKVsnZGVsZXRlJ10ocGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAgICAgICBpZiAoZGIpIHtcbiAgICAgICAgICAgIGRiLmNsb3NlKCk7XG4gICAgICAgICAgICBkYiA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9jbG9zZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uIF9kZWxldGUoZGF0YWJhc2UsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgcmVxdWVzdCA9IGluZGV4ZWREQi5kZWxldGVEYXRhYmFzZShkYXRhYmFzZSk7XG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNhbGxiYWNrKGUudGFyZ2V0LmVycm9yLCBmYWxzZSk7XG4gICAgICB9O1xuICAgICAgcmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHRydWUpO1xuICAgICAgfTtcbiAgICB9LFxuICAgIGxpc3Q6IGZ1bmN0aW9uIGxpc3QoY2FsbGJhY2spIHtcbiAgICAgIGluZGV4ZWREQi53ZWJraXRHZXREYXRhYmFzZU5hbWVzKCkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY2FsbGJhY2soZS50YXJnZXQucmVzdWx0KTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3REQjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9iamVjdGRiLmpzLm1hcFxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIG9iamVjdERCID0gcmVxdWlyZSgnLi9vYmplY3RkYi5qcycpO1xuXG52YXIgdmVyc2lvbiA9IDE7XG52YXIgbG9nZ2luZyA9IHRydWU7XG5cbnZhciBsb2cgPSBmdW5jdGlvbiBsb2coKSB7XG4gIGlmIChsb2dnaW5nKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZnVuY3Rpb24gKGUpIHtcbiAgLy9BdXRvbWF0aWNhbGx5IHRha2Ugb3ZlciB0aGUgcHJldmlvdXMgd29ya2VyLlxuICBlLndhaXRVbnRpbChzZWxmLnNraXBXYWl0aW5nKCkpO1xufSk7XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBmdW5jdGlvbiAoZSkge1xuICBsb2coJ0FjdGl2YXRlZCBTZXJ2aWNlV29ya2VyIHZlcnNpb246ICcgKyB2ZXJzaW9uKTtcbn0pO1xuXG4vL0hhbmRsZSB0aGUgcHVzaCByZWNlaXZlZCBldmVudC5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcigncHVzaCcsIGZ1bmN0aW9uIChlKSB7XG4gIGxvZygncHVzaCBsaXN0ZW5lcicsIGUpO1xuICBlLndhaXRVbnRpbChuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZ2V0Tm90aWZpY2F0aW9ucygpLnRoZW4oZnVuY3Rpb24gKG5vdGlmaWNhdGlvbnMpIHtcbiAgICAgIC8vIFRoaXMgaXMgYXN5bmMgc28gcmVzb2x2ZSBvbmNlIGl0J3MgZG9uZSBhbmQgdGhlIG5vdGlmaWNhdGlvbnMgYXJlIHNob3dpbmdcbiAgICAgIG5vdGlmaWNhdGlvbnMgPSBub3RpZmljYXRpb25zLmZpbHRlcihmdW5jdGlvbiAobm90aWZpY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiBub3RpZmljYXRpb24uZmV0Y2hlZF9wcmV2aW91c2x5ID09IGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBub3RTaG93bk9uVGhpc0NsaWVudEJlZm9yZShub3RpZmljYXRpb25zKS50aGVuKGZ1bmN0aW9uIChub3RpZmljYXRpb25zKSB7XG4gICAgICAgIHJldHVybiBzaG93Tm90aWZpY2F0aW9ucyhub3RpZmljYXRpb25zKTtcbiAgICAgIH0pLnRoZW4ocmVzb2x2ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgfSk7XG4gIH0pKTtcbn0pO1xuXG5mdW5jdGlvbiBnZXROb3RpZmljYXRpb25zKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIC8vIEdldCB0aGUgc2Vzc2lvbiB0b2tlbnMgZXRjIGZyb20gSURCXG4gICAgdmFyIGRiID0gb2JqZWN0REIub3BlbignZGItMScpO1xuICAgIC8vIE5vdGUgb2JqZWN0REIgZG9lcyBub3QgdXNlIGFjdHVhbCBwcm9taXNlcyBzbyB3ZSBjYW4ndCBwcm9wZXJseSBjaGFpbiB0aGlzXG4gICAgZGIuZ2V0KCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgdmFyIHNlc3Npb25Ub2tlbiA9IGRhdGEuc2Vzc2lvblRva2VuO1xuICAgICAgdmFyIHVzZXJJZCA9IGRhdGEudXNlcklkO1xuICAgICAgaWYgKHNlc3Npb25Ub2tlbiA9PSB1bmRlZmluZWQgfHwgdXNlcklkID09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgd2FzIG5vdCBsb2dnZWQgaW4uIENhbm5vdCByZXF1ZXN0IG5vdGlmaWNhdGlvbnMuJyk7XG4gICAgICB9XG4gICAgICAvLyBUT0RPOiBVbmlmeSBuZXR3b3JraW5nIGxpYnJhcnkgd2l0aCBtYWluIGFwcFxuICAgICAgZmV0Y2goJy8uLi92MS9ub3RpZmljYXRpb25zLycsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdTZXNzaW9uLVRva2VuJzogc2Vzc2lvblRva2VuLFxuICAgICAgICAgICdVc2VyLUlkJzogdXNlcklkXG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh0eHQpIHtcbiAgICAgICAgdmFyIG5vdGlmaWNhdGlvbnMgPSBKU09OLnBhcnNlKHR4dCk7XG4gICAgICAgIGxvZygnRmV0Y2hlZCBub3RpZmljYXRpb25zOiAnLCBub3RpZmljYXRpb25zKTtcbiAgICAgICAgcmVzb2x2ZShub3RpZmljYXRpb25zKTtcbiAgICAgIH0pWydjYXRjaCddKGZ1bmN0aW9uIChleCkge1xuICAgICAgICByZWplY3QoKTtcbiAgICAgICAgY29uc29sZS5sb2coZXgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbmNsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgbG9nKCdub3RpZmljYXRpb25jbGljayBsaXN0ZW5lcicsIGUpO1xuICBlLndhaXRVbnRpbChoYW5kbGVOb3RpZmljYXRpb25DbGljayhlKSk7XG59KTtcblxuLy9VdGlsaXR5IGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgY2xpY2tcbmZ1bmN0aW9uIGhhbmRsZU5vdGlmaWNhdGlvbkNsaWNrKGUpIHtcbiAgbG9nKCdOb3RpZmljYXRpb24gY2xpY2tlZDogJywgZS5ub3RpZmljYXRpb24pO1xuICBlLm5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuICByZXR1cm4gY2xpZW50cy5tYXRjaEFsbCh7XG4gICAgdHlwZTogJ3dpbmRvdycsXG4gICAgaW5jbHVkZVVuY29udHJvbGxlZDogZmFsc2VcbiAgfSlbJ2NhdGNoJ10oZnVuY3Rpb24gKGV4KSB7XG4gICAgY29uc29sZS5sb2coZXgpO1xuICB9KS50aGVuKGZ1bmN0aW9uIChjbGllbnRMaXN0KSB7XG4gICAgcmV0dXJuIGNsaWVudHMub3BlbldpbmRvdyhlLm5vdGlmaWNhdGlvbi5kYXRhLnVybCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBub3RTaG93bk9uVGhpc0NsaWVudEJlZm9yZShub3RpZmljYXRpb25zKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBkYiA9IG9iamVjdERCLm9wZW4oJ2RiLTEnKTtcbiAgICBkYi5nZXQoKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygnRGF0YWJhc2Ugb2YgcHJldmlvdXNseSBzaG93biBub3RpZmljYXRpb24gSURzOiAnLCBkYXRhKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm90aWZpY2F0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm90ZSA9IG5vdGlmaWNhdGlvbnNbaV07XG4gICAgICAgIGlmIChkYXRhLm5vdGlmaWNhdGlvbklkcy5pbmRleE9mKG5vdGUuaWQpIDwgMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdUaGlzIGNsaWVudCBoYXNuXFx0IHNob3duIG5vdGlmaWNhdGlvbiAnICsgbm90ZS5pZCArICcgYmVmb3JlJyk7XG4gICAgICAgICAgcmVzdWx0LnB1c2gobm90ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHNob3dOb3RpZmljYXRpb25zKG5vdGlmaWNhdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgZGIgPSBvYmplY3REQi5vcGVuKCdkYi0xJyk7XG4gICAgZGIuZ2V0KCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgaWYgKGRhdGEubm90aWZpY2F0aW9uSWRzID09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnU1cgaGFzIG5ldmVyIHNob3duIGEgbm90aWZpY2F0aW9uIGJlZm9yZS4gQ3JlYXRpbmcgc3RhdGUgaW4gREIuJyk7XG4gICAgICAgIGRhdGEubm90aWZpY2F0aW9uSWRzID0gW107XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vdGlmaWNhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vdGUgPSBub3RpZmljYXRpb25zW2ldO1xuICAgICAgICBzaG93Tm90aWZpY2F0aW9uKG5vdGUudGl0bGUsIG5vdGUuYm9keSwgbm90ZS51cmwsIG5vdGUuaWNvbiwgbm90ZS5pZCk7XG4gICAgICAgIC8vIFdlIG9ubHkgc2hvdyBub3RpZmljYXRpb25zIG5ldmVyIHNob3duIGJlZm9yZSwgc28gd2Ugd2lsbCBuZXZlciBhZGQgdGhlIHNhbWUgSUQgaGVyZSB0d2ljZVxuICAgICAgICBkYXRhLm5vdGlmaWNhdGlvbklkcy5wdXNoKG5vdGUuaWQpO1xuICAgICAgfVxuICAgICAgLy8gTm90ZSBvYmplY3REQiBkb2VzIG5vdCB1c2UgcmVhbCBwcm9taXNlcyBzbyB3ZSBjYW4ndCBjaGFpbiB0aGlzXG4gICAgICBkYi5wdXQoJ25vdGlmaWNhdGlvbklkcycsIGRhdGEubm90aWZpY2F0aW9uSWRzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gUmVzb2x2ZSBvbmUgc2Vjb25kIGxhdGUganVzdCBpbiBjYXNlIGl0IHRvb2sgYSB3aGlsZSB0byBzaG93IHRoZSBub3RpZmljYXRpb25zIGVhcmxpZXJcbiAgICAgICAgLy8gVE9ETzogTW92ZSB0aGUgcmVzb2x2ZSB0byBoYXBwZW4gYWZ0ZXIgYXQgbGVhc3Qgb25lIHNob3dOb3RpZmljYXRpb24gcHJvbWlzZSBoYXMgcmVzb2x2ZWRcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuLy9VdGlsaXR5IGZ1bmN0aW9uIHRvIGFjdHVhbGx5IHNob3cgdGhlIG5vdGlmaWNhdGlvbi5cbmZ1bmN0aW9uIHNob3dOb3RpZmljYXRpb24odGl0bGUsIGJvZHksIHVybCwgaWNvbiwgdGFnKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIGJvZHk6IGJvZHksXG4gICAgdGFnOiB0YWcsXG4gICAgLy8gbGFuZzogJ3Rlc3QgbGFuZycsXG4gICAgaWNvbjogaWNvbixcbiAgICBkYXRhOiB7IHVybDogdXJsIH0sXG4gICAgdmlicmF0ZTogMTAwMCxcbiAgICBub3NjcmVlbjogZmFsc2VcbiAgfTtcbiAgaWYgKHNlbGYucmVnaXN0cmF0aW9uICYmIHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24pIHtcbiAgICAvLyBUT0RPOiBlbnN1cmUgdGhpcyB3b3JrcyBhZnRlciB0aGUgcGFnZSBpcyBjbG9zZWRcbiAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zaG93Tm90aWZpY2F0aW9uKHRpdGxlLCBvcHRpb25zKTtcbiAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3cuanMubWFwXG4iXX0=
