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
var userId;
var sessionToken;

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
    getNotifications(function (notifications) {
      // This is async so resolve once it's done and the notifications are showing
      showNotificationsIfNotShownPreviously(notifications, resolve);
    }, function (reason) {
      reject(reason);
    });
  }));
});

function getNotifications(resolve, reject) {
  // Get the session tokens etc from IDB
  var db = objectDB.open('db-1');
  db.get().then(function (data) {
    var sessionToken = data.sessionToken;
    var userId = data.userId;
    if (sessionToken == undefined || userId == undefined) {
      throw new Error('User was not logged in. Cannot request notifications.');
    }
    self.registration.pushManager.getSubscription().then(function (subscription) {
      if (subscription) {
        var subscriptionId = subscription.subscriptionId;
        fetch('/../v1/notifications/for/' + subscriptionId, {
          headers: {
            'SESSION_TOKEN': sessionToken,
            'USER_ID': userId
          }
        }).then(function (response) {
          response.text().then(function (txt) {
            log('fetched notifications', txt);
            var notifications = JSON.parse(txt);
            resolve(notifications);
          })['catch'](reject);
        })['catch'](reject);
      } else {
        console.log('Was asked to get notifications before a subscription was created!');
      }
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
    return clients.openWindow(e.notification.url);
  });
}

function showNotificationsIfNotShownPreviously(notifications, success) {
  var db = objectDB.open('db-1');
  db.get().then(function (data) {
    console.log('data', data);
    if (data.notificationIds == undefined) {
      console.log('data.notificationIds was blank');
      data.notificationIds = [];
    }
    for (var i = 0; i < notifications.length; i++) {
      var note = notifications[i];
      if (data.notificationIds.indexOf(note.id) < 0) {
        console.log('havent shown note ' + note.id + ' before');
        data.notificationIds.push(note.id);
        showNotification(note.title, note.body, note.url, note.icon, note.id);
      } else {
        console.log('we showed note ' + note.id + ' previously so skip it');
      }
    }
    db.put('notificationIds', data.notificationIds);
    success();
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0bXAvb2JqZWN0ZGIuanMiLCJ0bXAvc3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgMjAxNCwgS2xhdXMgR2Fuc2VyIDxodHRwOi8va2dhbnNlci5jb20+XG4vLyBNSVQgTGljZW5zZWQsIHdpdGggdGhpcyBjb3B5cmlnaHQgYW5kIHBlcm1pc3Npb24gbm90aWNlXG4vLyA8aHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVD5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqZWN0REIgPSAoZnVuY3Rpb24gKCkge1xuXG4gIHZhciBtYWtlS2V5ID0gZnVuY3Rpb24gbWFrZUtleShwYXRoKSB7XG4gICAgdmFyIGtleSA9IHBhdGgubGVuZ3RoID8gcGF0aFtwYXRoLmxlbmd0aCAtIDFdIDogJyc7XG4gICAgcmV0dXJuIFtwYXRoLmxlbmd0aCA8IDIgJiYgIWtleSA/IDAgOiBwYXRoLnNsaWNlKDAsIC0xKS5tYXAoZW5jb2RlVVJJQ29tcG9uZW50KS5qb2luKCcvJyksIGtleV07XG4gIH07XG4gIHZhciBzY29wZWRSYW5nZSA9IGZ1bmN0aW9uIHNjb3BlZFJhbmdlKHBhcmVudCwgbG93ZXIsIHVwcGVyLCBsZSwgdWUpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQubWFwKGVuY29kZVVSSUNvbXBvbmVudCkuam9pbignLycpO1xuICAgIHVlID0gdXBwZXIgPT0gbnVsbCB8fCB1ZTtcbiAgICBsb3dlciA9IGxvd2VyID09IG51bGwgPyBbcGFyZW50XSA6IFtwYXJlbnQsIGxvd2VyXTtcbiAgICB1cHBlciA9IHVwcGVyID09IG51bGwgPyBbcGFyZW50ICsgJ1xcMCddIDogW3BhcmVudCwgdXBwZXJdO1xuICAgIHJldHVybiBJREJLZXlSYW5nZS5ib3VuZChsb3dlciwgdXBwZXIsIGxlLCB1ZSk7XG4gIH07XG4gIHZhciByZXNvbHZlUGF0aCA9IGZ1bmN0aW9uIHJlc29sdmVQYXRoKHN0b3JlLCBwYXRoLCBjYWxsYmFjaykge1xuICAgIC8vIHN1YnN0aXR1dGUgYXJyYXkgaW5kaWNlcyBpbiBwYXRoIHdpdGggbnVtZXJpYyBrZXlzO1xuICAgIC8vIHNlY29uZCBhcmd1bWVudCB0byBjYWxsYmFjayBpcyB0cnVlIGlmIHBhdGggaXMgYW4gZW1wdHkgYXJyYXkgc2xvdFxuICAgIHBhdGggPSBwYXRoID8gcGF0aC5zcGxpdCgnLycpLm1hcChkZWNvZGVVUklDb21wb25lbnQpIDogW107XG4gICAgKGZ1bmN0aW9uIGFkdmFuY2UoaSwgZW1wdHkpIHtcbiAgICAgIHdoaWxlIChpIDwgcGF0aC5sZW5ndGggJiYgIS8wfFsxLTldWzAtOV0qLy50ZXN0KHBhdGhbaV0pKSBpKys7XG4gICAgICBpZiAoaSA9PSBwYXRoLmxlbmd0aCkgcmV0dXJuIGNhbGxiYWNrKHBhdGgsIGVtcHR5KTtcbiAgICAgIHZhciBwb3NpdGlvbiA9IHBhcnNlSW50KHBhdGhbaV0pO1xuICAgICAgc3RvcmUuZ2V0KG1ha2VLZXkocGF0aC5zbGljZSgwLCBpKSkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIGlmICghcmVzdWx0KSByZXR1cm4gY2FsbGJhY2socGF0aCwgZW1wdHkpO1xuICAgICAgICBpZiAocmVzdWx0LnR5cGUgIT0gJ2FycmF5JykgcmV0dXJuIGFkdmFuY2UoaSArIDEpO1xuICAgICAgICAvLyBzZXQgdG8gbnVtZXJpYyBpbmRleCBpbml0aWFsbHksIGFuZCB0byBrZXkgaWYgZWxlbWVudCBpcyBmb3VuZFxuICAgICAgICBwYXRoW2ldID0gcG9zaXRpb247XG4gICAgICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGF0aC5zbGljZSgwLCBpKSkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICBpZiAoY3Vyc29yICYmIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBjdXJzb3IuYWR2YW5jZShwb3NpdGlvbik7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IDA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjdXJzb3IpIHBhdGhbaV0gPSBjdXJzb3IudmFsdWUua2V5O1xuICAgICAgICAgICAgYWR2YW5jZShpICsgMSwgIWN1cnNvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfTtcbiAgICB9KSgwKTtcbiAgfTtcbiAgdmFyIGdldCA9IGZ1bmN0aW9uIGdldChzdG9yZSwgcGF0aCwgY2FsbGJhY2ssIGN1cnNvcikge1xuICAgIHZhciBuZXh0O1xuICAgIGlmICh0eXBlb2YgY3Vyc29yICE9ICdmdW5jdGlvbicpIGN1cnNvciA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIHN0b3JlLmdldChtYWtlS2V5KHBhdGgpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmICghcmVzdWx0KSByZXR1cm4gbmV4dCB8fCBjYWxsYmFjaygpO1xuICAgICAgKG5leHQgPSBmdW5jdGlvbiAocmVzdWx0LCBwYXJlbnQsIHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdC52YWx1ZSxcbiAgICAgICAgICAgIHR5cGUgPSByZXN1bHQudHlwZSxcbiAgICAgICAgICAgIHBlbmRpbmcgPSAxLFxuICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICBpZiAodHlwZSAhPSAnb2JqZWN0JyAmJiB0eXBlICE9ICdhcnJheScpIHJldHVybiBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgIHZhciBhcnJheSA9IHR5cGUgPT0gJ2FycmF5JyxcbiAgICAgICAgICAgIGMgPSBjdXJzb3IocGF0aCwgYXJyYXkpO1xuICAgICAgICB2YWx1ZSA9IGFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgaWYgKGMgPT09IGZhbHNlKSByZXR1cm4gY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICBpZiAoIWMgfHwgdHlwZW9mIGMgIT0gJ29iamVjdCcpIGMgPSB7IGFjdGlvbjogYyB8fCB7fSB9O1xuICAgICAgICBpZiAodHlwZW9mIGMuYWN0aW9uICE9ICdmdW5jdGlvbicpIGMuYWN0aW9uID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGFyZW50LCBjLmxvd2VyQm91bmQsIGMudXBwZXJCb3VuZCwgYy5sb3dlckV4Y2x1c2l2ZSwgYy51cHBlckV4Y2x1c2l2ZSksIGMuZGVzY2VuZGluZyA/ICdwcmV2JyA6ICduZXh0Jykub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIGlmICghY3Vyc29yKSByZXR1cm4gLS1wZW5kaW5nIHx8IGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gY3Vyc29yLnZhbHVlLFxuICAgICAgICAgICAgICBrZXkgPSBhcnJheSA/IGluZGV4KysgOiByZXN1bHQua2V5LFxuICAgICAgICAgICAgICBhY3Rpb24gPSBjLmFjdGlvbihrZXkpO1xuICAgICAgICAgIGlmIChhY3Rpb24gPT0gJ3N0b3AnKSByZXR1cm4gLS1wZW5kaW5nIHx8IGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICBpZiAoYWN0aW9uICE9ICdza2lwJykge1xuICAgICAgICAgICAgdmFsdWVba2V5XSA9IHBlbmRpbmcrKztcbiAgICAgICAgICAgIG5leHQocmVzdWx0LCBwYXJlbnQuY29uY2F0KFtyZXN1bHQua2V5XSksIHBhdGguY29uY2F0KFtrZXldKSwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICAgIHZhbHVlW2tleV0gPSBjaGlsZDtcbiAgICAgICAgICAgICAgaWYgKCEgLS1wZW5kaW5nKSBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3Vyc29yWydjb250aW51ZSddKCk7XG4gICAgICAgIH07XG4gICAgICB9KShyZXN1bHQsIHBhdGgsIFtdLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgfTtcbiAgdmFyIF9wdXQgPSBmdW5jdGlvbiBfcHV0KHN0b3JlLCBwYXRoLCB2YWx1ZSwgY2FsbGJhY2spIHtcbiAgICAvLyB7IGtleTogKGtleSBvciBpbmRleCByZWxhdGl2ZSB0byBwYXJlbnQpXG4gICAgLy8gICBwYXJlbnQ6IChwYXRoIG9mIHBhcmVudCBlbnRyeSlcbiAgICAvLyAgIHR5cGU6IChzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbHxhcnJheXxvYmplY3QpXG4gICAgLy8gICB2YWx1ZTogKG9yIG51bGwgaWYgYXJyYXkgb3Igb2JqZWN0KSB9XG4gICAgdmFyIHR5cGUgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/ICdhcnJheScgOiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgPyB2YWx1ZSA/ICdvYmplY3QnIDogJ251bGwnIDogdHlwZW9mIHZhbHVlLFxuICAgICAgICBrZXkgPSBtYWtlS2V5KHBhdGgpLFxuICAgICAgICBwZW5kaW5nID0gMSxcbiAgICAgICAgY2IgPSBmdW5jdGlvbiBjYigpIHtcbiAgICAgIGlmICghIC0tcGVuZGluZykgY2FsbGJhY2soKTtcbiAgICB9O1xuICAgIHN0b3JlLnB1dCh7IHBhcmVudDoga2V5WzBdLCBrZXk6IGtleVsxXSwgdHlwZTogdHlwZSwgdmFsdWU6IHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyA/IG51bGwgOiB2YWx1ZSB9KS5vbnN1Y2Nlc3MgPSBjYjtcbiAgICBpZiAodHlwZSA9PSAnYXJyYXknKSB7XG4gICAgICB2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaSkge1xuICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgIF9wdXQoc3RvcmUsIHBhdGguY29uY2F0KFtpXSksIHZhbHVlLCBjYik7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gJ29iamVjdCcpIHtcbiAgICAgIE9iamVjdC5rZXlzKHZhbHVlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcGVuZGluZysrO1xuICAgICAgICBfcHV0KHN0b3JlLCBwYXRoLmNvbmNhdChba2V5XSksIHZhbHVlW2tleV0sIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgdmFyIF9hcHBlbmQgPSBmdW5jdGlvbiBfYXBwZW5kKHN0b3JlLCBwYXRoLCB2YWx1ZSwgY2FsbGJhY2spIHtcbiAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhdGgpLCAncHJldicpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgX3B1dChzdG9yZSwgcGF0aC5jb25jYXQoW2N1cnNvciA/IGN1cnNvci52YWx1ZS5rZXkgKyAxIDogMF0pLCB2YWx1ZSwgY2FsbGJhY2spO1xuICAgIH07XG4gIH07XG4gIHZhciBkZWxldGVDaGlsZHJlbiA9IGZ1bmN0aW9uIGRlbGV0ZUNoaWxkcmVuKHN0b3JlLCBwYXRoLCBjYWxsYmFjaykge1xuICAgIHZhciBwZW5kaW5nID0gMSxcbiAgICAgICAgY2IgPSBmdW5jdGlvbiBjYigpIHtcbiAgICAgIGlmICghIC0tcGVuZGluZykgY2FsbGJhY2soKTtcbiAgICB9O1xuICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGF0aCkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgaWYgKCFjdXJzb3IpIHJldHVybiBjYigpO1xuICAgICAgdmFyIHJlc3VsdCA9IGN1cnNvci52YWx1ZTtcbiAgICAgIHBlbmRpbmcrKztcbiAgICAgIHN0b3JlWydkZWxldGUnXShbcmVzdWx0LnBhcmVudCwgcmVzdWx0LmtleV0pLm9uc3VjY2VzcyA9IGNiO1xuICAgICAgaWYgKHJlc3VsdC50eXBlID09ICdvYmplY3QnIHx8IHJlc3VsdC50eXBlID09ICdhcnJheScpIHtcbiAgICAgICAgcGVuZGluZysrO1xuICAgICAgICBkZWxldGVDaGlsZHJlbihzdG9yZSwgcGF0aC5jb25jYXQoW3Jlc3VsdC5rZXldKSwgY2IpO1xuICAgICAgfVxuICAgICAgY3Vyc29yWydjb250aW51ZSddKCk7XG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG9wZW46IGZ1bmN0aW9uIG9wZW4oZGF0YWJhc2UsIHVwZ3JhZGUsIHZlcnNpb24sIG9uRXJyb3IpIHtcbiAgICAgIC8qKiBvYmplY3REQjoge1xuICAgICAgICAgICAgb3BlbjogZnVuY3Rpb24oZGF0YWJhc2U6c3RyaW5nLCB1cGdyYWRlPWB7fWA6anNvbnxmdW5jdGlvbihVcGdyYWRlVHJhbnNhY3Rpb24pLCB2ZXJzaW9uPTE6bnVtYmVyLCBvbkVycm9yPXVuZGVmaW5lZDpmdW5jdGlvbihlcnJvcjpET01FcnJvciwgYmxvY2tlZDpib29sZWFuKSkgLT4gRGF0YWJhc2UsXG4gICAgICAgICAgICBkZWxldGU6IGZ1bmN0aW9uKGRhdGFiYXNlOnN0cmluZywgY2FsbGJhY2s6ZnVuY3Rpb24oZXJyb3I6dW5kZWZpbmVkfERPTUVycm9yLCBibG9ja2VkOmJvb2xlYW4pKSxcbiAgICAgICAgICAgIGxpc3Q6IGZ1bmN0aW9uKGNhbGxiYWNrOmZ1bmN0aW9uKERPTVN0cmluZ0xpc3QpKVxuICAgICAgICAgIH1cbiAgICAgICAgICAgT2JqZWN0REIgaXMgYmFja2VkIGJ5IGBpbmRleGVkREJgLiBBbiB1cGdyYWRlIHRyYW5zYWN0aW9uIHJ1bnMgb24gYG9wZW5gIGlmIHRoZSBkYXRhYmFzZSB2ZXJzaW9uIGlzIGxlc3MgdGhhblxuICAgICAgICAgIHRoZSByZXF1ZXN0ZWQgdmVyc2lvbiBvciBkb2VzIG5vdCBleGlzdC4gSWYgYHVwZ3JhZGVgIGlzIGEganNvbiB2YWx1ZSwgdGhlIGRhdGEgc3RvcmVzIGluIHRoZSBmaXJzdCB0cmFuc2FjdGlvblxuICAgICAgICAgIG9wZXJhdGlvbiBvbiB0aGlzIGBEYXRhYmFzZWAgd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCB0aGlzIHZhbHVlIG9uIGFuIHVwZ3JhZGUgZXZlbnQuIE90aGVyd2lzZSwgYW4gdXBncmFkZSB3aWxsXG4gICAgICAgICAgYmUgaGFuZGxlZCBieSB0aGUgZ2l2ZW4gZnVuY3Rpb24gdmlhIGBVcGdyYWRlVHJhbnNhY3Rpb25gLiAqL1xuICAgICAgdmFyIHNlbGYsXG4gICAgICAgICAgZGIsXG4gICAgICAgICAgcXVldWUsXG4gICAgICAgICAgX2Nsb3NlLFxuICAgICAgICAgIG9wZW4gPSBmdW5jdGlvbiBvcGVuKHN0b3JlcywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGRiKSByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgaWYgKHF1ZXVlKSByZXR1cm4gcXVldWUucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHF1ZXVlID0gW2NhbGxiYWNrXTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihkYXRhYmFzZSwgdmVyc2lvbiB8fCAxKTtcbiAgICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBzZWxmLFxuICAgICAgICAgICAgICBkYiA9IGUudGFyZ2V0LnJlc3VsdCxcbiAgICAgICAgICAgICAgZGF0YSA9IHVwZ3JhZGUgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgdXBncmFkZSA9PSAnZnVuY3Rpb24nID8ge30gOiB1cGdyYWRlO1xuICAgICAgICAgIGlmICh0eXBlb2YgdXBncmFkZSAhPSAnZnVuY3Rpb24nKSB1cGdyYWRlID0gZnVuY3Rpb24gKGRiKSB7XG4gICAgICAgICAgICAoQXJyYXkuaXNBcnJheShzdG9yZXMpID8gc3RvcmVzIDogW3N0b3Jlc10pLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUobmFtZSwgZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIC8qKiBVcGdyYWRlVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBvbGRWZXJzaW9uOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgbmV3VmVyc2lvbjogbnVtYmVyLFxuICAgICAgICAgICAgICAgIGNyZWF0ZU9iamVjdFN0b3JlOiBmdW5jdGlvbihuYW1lOnN0cmluZywgZGF0YT1ge31gOmpzb24pIC0+IFVwZ3JhZGVUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBkZWxldGVPYmplY3RTdG9yZTogZnVuY3Rpb24obmFtZTpzdHJpbmcpIC0+IFVwZ3JhZGVUcmFuc2FjdGlvblxuICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgdXBncmFkZShzZWxmID0ge1xuICAgICAgICAgICAgb2xkVmVyc2lvbjogZS5vbGRWZXJzaW9uLFxuICAgICAgICAgICAgbmV3VmVyc2lvbjogZS5uZXdWZXJzaW9uLFxuICAgICAgICAgICAgY3JlYXRlT2JqZWN0U3RvcmU6IGZ1bmN0aW9uIGNyZWF0ZU9iamVjdFN0b3JlKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgICAgICAgaWYgKGRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMobmFtZSkpIHRocm93ICdvYmplY3RTdG9yZSBhbHJlYWR5IGV4aXN0cyc7XG4gICAgICAgICAgICAgIF9wdXQoZGIuY3JlYXRlT2JqZWN0U3RvcmUobmFtZSwgeyBrZXlQYXRoOiBbJ3BhcmVudCcsICdrZXknXSB9KSwgW10sIGRhdGEgPT09IHVuZGVmaW5lZCA/IHt9IDogZGF0YSwgZnVuY3Rpb24gKCkge30pO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVPYmplY3RTdG9yZTogZnVuY3Rpb24gZGVsZXRlT2JqZWN0U3RvcmUobmFtZSkge1xuICAgICAgICAgICAgICBpZiAoZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhuYW1lKSkgZGIuZGVsZXRlT2JqZWN0U3RvcmUobmFtZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgd2hpbGUgKGNhbGxiYWNrID0gcXVldWUuc2hpZnQoKSkgY2FsbGJhY2soKTtcbiAgICAgICAgICBpZiAoX2Nsb3NlKSB7XG4gICAgICAgICAgICBkYi5jbG9zZSgpO1xuICAgICAgICAgICAgX2Nsb3NlID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChvbkVycm9yKSB7XG4gICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIG9uRXJyb3IoZS50YXJnZXQuZXJyb3IsIGZhbHNlKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb25FcnJvcihudWxsLCB0cnVlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIF90cmFuc2FjdGlvbiA9IGZ1bmN0aW9uIF90cmFuc2FjdGlvbih0eXBlLCBzdG9yZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB0cmFucyxcbiAgICAgICAgICAgIHBlbmRpbmcgPSAwLFxuICAgICAgICAgICAgdmFsdWVzID0gW10sXG4gICAgICAgICAgICBzZWxmID0ge1xuICAgICAgICAgIGdldDogZ2V0LFxuICAgICAgICAgIHB1dDogZnVuY3Rpb24gcHV0KHN0b3JlLCBwYXRoLCBjYWxsYmFjaywgdmFsdWUsIGluc2VydCwgZW1wdHkpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRQYXRoID0gcGF0aC5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICBzdG9yZS5nZXQobWFrZUtleShwYXJlbnRQYXRoKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGUudGFyZ2V0LnJlc3VsdCxcbiAgICAgICAgICAgICAgICAgIGtleSA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgaWYgKCFwYXJlbnQgJiYgcGF0aC5sZW5ndGgpIHJldHVybiBjYWxsYmFjaygnUGFyZW50IHJlc291cmNlIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgICAgICAgIGlmIChpbnNlcnQgJiYgKCFwYXRoLmxlbmd0aCB8fCBwYXJlbnQudHlwZSAhPSAnYXJyYXknKSkgcmV0dXJuIGNhbGxiYWNrKCdQYXJlbnQgcmVzb3VyY2UgaXMgbm90IGFuIGFycmF5Jyk7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnR5cGUgIT0gJ29iamVjdCcgJiYgcGFyZW50LnR5cGUgIT0gJ2FycmF5JykgcmV0dXJuIGNhbGxiYWNrKCdQYXJlbnQgcmVzb3VyY2UgaXMgbm90IGFuIG9iamVjdCBvciBhcnJheScpO1xuICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC50eXBlID09ICdhcnJheScgJiYgdHlwZW9mIGtleSAhPSAnbnVtYmVyJykgcmV0dXJuIGNhbGxiYWNrKCdJbnZhbGlkIGluZGV4IHRvIGFycmF5IHJlc291cmNlJyk7XG4gICAgICAgICAgICAgIGlmIChlbXB0eSkge1xuICAgICAgICAgICAgICAgIC8vIGFycmF5IHNsb3RcbiAgICAgICAgICAgICAgICBfYXBwZW5kKHN0b3JlLCBwYXJlbnRQYXRoLCB2YWx1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluc2VydCkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNoaWZ0S2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHN0b3JlLm9wZW5DdXJzb3Ioc2NvcGVkUmFuZ2UocGFyZW50UGF0aCwga2V5KSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICBpZiAoY3Vyc29yICYmIGN1cnNvci52YWx1ZS5rZXkgPT0ga2V5ICsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBjb250aWd1b3VzIGtleXMgYWZ0ZXIgZGVzaXJlZCBwb3NpdGlvbiBtdXN0IGJlIHNoaWZ0ZWQgYnkgb25lXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaGlmdEtleSA9IGN1cnNvci52YWx1ZS5rZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIGZvdW5kIGxhc3Qga2V5IHRvIHNoaWZ0OyBub3cgc2hpZnQgc3Vic2VxdWVudCBlbGVtZW50cycga2V5c1xuICAgICAgICAgICAgICAgICAgdmFyIHBlbmRpbmcgPSAxLFxuICAgICAgICAgICAgICAgICAgICAgIGNiID0gZnVuY3Rpb24gY2IoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIC0tcGVuZGluZykgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhcmVudFBhdGgsIGtleSwgbGFzdFNoaWZ0S2V5KSwgJ3ByZXYnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3Vyc29yKSByZXR1cm4gX3B1dChzdG9yZSwgcGF0aCwgdmFsdWUsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gY3Vyc29yLnZhbHVlLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID0gcGFyZW50UGF0aC5jb25jYXQoW2luZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICAgICAgICAgICAgZ2V0KHN0b3JlLCBjdXJyZW50UGF0aCwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGRlbGV0ZS9wdXQgd2l0aGluIGN1cnNvclxuICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZUNoaWxkcmVuKHN0b3JlLCBjdXJyZW50UGF0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3B1dChzdG9yZSwgcGFyZW50UGF0aC5jb25jYXQoW2luZGV4ICsgMV0pLCByZXN1bHQsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvclsnY29udGludWUnXSgpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGVDaGlsZHJlbihzdG9yZSwgcGF0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgX3B1dChzdG9yZSwgcGF0aCwgdmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFwcGVuZDogZnVuY3Rpb24gYXBwZW5kKHN0b3JlLCBwYXRoLCBjYWxsYmFjaywgdmFsdWUpIHtcbiAgICAgICAgICAgIHN0b3JlLmdldChtYWtlS2V5KHBhdGgpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICBpZiAoIXBhcmVudCkgcmV0dXJuIGNhbGxiYWNrKCdQYXJlbnQgcmVzb3VyY2UgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgICAgICAgaWYgKHBhcmVudC50eXBlICE9ICdhcnJheScpIHJldHVybiBjYWxsYmFjaygnUGFyZW50IHJlc291cmNlIGlzIG5vdCBhbiBhcnJheScpO1xuICAgICAgICAgICAgICBfYXBwZW5kKHN0b3JlLCBwYXRoLCB2YWx1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgICdkZWxldGUnOiBmdW5jdGlvbiBfZGVsZXRlKHN0b3JlLCBwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgc3RvcmVbJ2RlbGV0ZSddKG1ha2VLZXkocGF0aCkpO1xuICAgICAgICAgICAgZGVsZXRlQ2hpbGRyZW4oc3RvcmUsIHBhdGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5rZXlzKHNlbGYpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICB2YXIgbWV0aG9kID0gc2VsZltuYW1lXTtcbiAgICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmN0aW9uIHdyYXBwZWQoc3RvcmUsIHBhdGgsIHZhbHVlLCBpbnNlcnQpIHtcbiAgICAgICAgICAgIHZhciBpID0gdmFsdWVzLnB1c2gocGVuZGluZysrKSAtIDEsXG4gICAgICAgICAgICAgICAgcCA9IHBhdGg7XG4gICAgICAgICAgICByZXNvbHZlUGF0aChzdG9yZSA9IHRyYW5zLm9iamVjdFN0b3JlKHN0b3JlKSwgcGF0aCwgZnVuY3Rpb24gKHBhdGgsIGVtcHR5KSB7XG4gICAgICAgICAgICAgIG1ldGhvZChzdG9yZSwgcGF0aCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKCEgLS1wZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgdiA9IHZhbHVlcztcbiAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgdik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCB2YWx1ZSwgaW5zZXJ0LCBlbXB0eSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHNlbGZbbmFtZV0gPSBmdW5jdGlvbiAoc3RvcmUsIHBhdGgsIHZhbHVlLCBpbnNlcnQpIHtcbiAgICAgICAgICAgIGlmICh0cmFucykgcmV0dXJuIHdyYXBwZWQoc3RvcmUsIHBhdGgsIHZhbHVlLCBpbnNlcnQpO1xuICAgICAgICAgICAgb3BlbihzdG9yZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKCF0cmFucykgdHJhbnMgPSBkYi50cmFuc2FjdGlvbihzdG9yZXMsIHR5cGUpO1xuICAgICAgICAgICAgICB3cmFwcGVkKHN0b3JlLCBwYXRoLCB2YWx1ZSwgaW5zZXJ0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH07XG4gICAgICAvKiogRGF0YWJhc2U6IHtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uOiBmdW5jdGlvbih3cml0YWJsZT1mYWxzZTpib29sZWFuLCBzdG9yZXM9J2RhdGEnOltzdHJpbmcsIC4uLl18c3RyaW5nKSAtPiBUcmFuc2FjdGlvbnxTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHdyaXRhYmxlPWZhbHNlOmJvb2xlYW4sIGN1cnNvcj11bmRlZmluZWQ6Q3Vyc29yLCBzdG9yZT0nZGF0YSc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIHB1dDogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24sIHN0b3JlPSdkYXRhJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgaW5zZXJ0OiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbiwgc3RvcmU9J2RhdGEnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uLCBzdG9yZT0nZGF0YSc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIGRlbGV0ZTogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHN0b3JlPSdkYXRhJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgICBgZ2V0YCwgYHB1dGAsIGBpbnNlcnRgLCBgYXBwZW5kYCwgYW5kIGBkZWxldGVgIGFyZSBjb252ZW5pZW5jZSBtZXRob2RzIHRoYXQgb3BlcmF0ZSB0aHJvdWdoIGB0cmFuc2FjdGlvbmAgZm9yXG4gICAgICAgICAgYSBzaW5nbGUgb2JqZWN0U3RvcmUgYW5kIHJldHVybiB0aGUgY29ycmVzcG9uZGluZyBgU2NvcGVkVHJhbnNhY3Rpb25gLiBgZ2V0YCBpbml0aWF0ZXMgYSByZWFkLW9ubHlcbiAgICAgICAgICB0cmFuc2FjdGlvbiBieSBkZWZhdWx0LiBgdHJhbnNhY3Rpb25gIHJldHVybnMgYSBgU2NvcGVkVHJhbnNhY3Rpb25gIGlmIGEgc2luZ2xlIChzdHJpbmcpIG9iamVjdFN0b3JlIGlzXG4gICAgICAgICAgc3BlY2lmaWVkLCBhbmQgYSBgVHJhbnNhY3Rpb25gIGlmIG9wZXJhdGluZyBvbiBtdWx0aXBsZSBvYmplY3RTdG9yZXMuICovXG4gICAgICByZXR1cm4gc2VsZiA9IHtcbiAgICAgICAgdHJhbnNhY3Rpb246IGZ1bmN0aW9uIHRyYW5zYWN0aW9uKHdyaXRhYmxlLCBzdG9yZXMpIHtcbiAgICAgICAgICBpZiAoc3RvcmVzID09IG51bGwpIHN0b3JlcyA9ICdkYXRhJztcbiAgICAgICAgICB2YXIgc2VsZixcbiAgICAgICAgICAgICAgY2IsXG4gICAgICAgICAgICAgIHRyYW5zID0gX3RyYW5zYWN0aW9uKHdyaXRhYmxlID8gJ3JlYWR3cml0ZScgOiAncmVhZG9ubHknLCBzdG9yZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjYikgY2IuYXBwbHkoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvKiogVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKHN0b3JlOnN0cmluZywgcGF0aD0nJzpzdHJpbmcsIGN1cnNvcj11bmRlZmluZWQ6Q3Vyc29yKSAtPiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBwdXQ6IG51bGx8ZnVuY3Rpb24oc3RvcmU6c3RyaW5nLCBwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgaW5zZXJ0OiBudWxsfGZ1bmN0aW9uKHN0b3JlOnN0cmluZywgcGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGFwcGVuZDogbnVsbHxmdW5jdGlvbihzdG9yZTpzdHJpbmcsIHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBkZWxldGU6IG51bGx8ZnVuY3Rpb24oc3RvcmU6c3RyaW5nLCBwYXRoPScnOnN0cmluZykgLT4gVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgdGhlbjogZnVuY3Rpb24oY2FsbGJhY2s6ZnVuY3Rpb24odGhpczpUcmFuc2FjdGlvbiwganNvbnx1bmRlZmluZWQsIC4uLikpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIEEgYFRyYW5zYWN0aW9uYCBhY3Rpbmcgb24gbXVsdGlwbGUgZGF0YSBzdG9yZXMgbXVzdCBzcGVjaWZ5IGEgZGF0YSBzdG9yZSBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gZXZlcnlcbiAgICAgICAgICAgICAgb3BlcmF0aW9uLiBPdGhlcndpc2UsIHRoZXNlIG1ldGhvZHMgY29ycmVzcG9uZCB0byBgU2NvcGVkVHJhbnNhY3Rpb25gIG1ldGhvZHMuICovXG5cbiAgICAgICAgICAvKiogU2NvcGVkVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCBjdXJzb3I9dW5kZWZpbmVkOkN1cnNvcikgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgcHV0OiBudWxsfGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBpbnNlcnQ6IG51bGx8ZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGFwcGVuZDogbnVsbHxmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGVsZXRlOiBudWxsfGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICB0aGVuOiBmdW5jdGlvbihjYWxsYmFjazpmdW5jdGlvbih0aGlzOlNjb3BlZFRyYW5zYWN0aW9uLCBqc29ufHVuZGVmaW5lZCwgLi4uKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgQWxsIG1ldGhvZHMgZXhjZXB0IGB0aGVuYCBhcmUgY2hhaW5hYmxlIGFuZCBleGVjdXRlIG9uIHRoZSBzYW1lIHRyYW5zYWN0aW9uIGluIHBhcmFsbGVsLiBJZiB0aGVcbiAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gaXMgbm90IHdyaXRhYmxlLCBgcHV0YCwgYGluc2VydGAsIGBhcHBlbmRgLCBhbmQgYGRlbGV0ZWAgYXJlIG51bGwuXG4gICAgICAgICAgICAgICBgcGF0aGAgaXMgYSBgL2Atc2VwYXJhdGVkIHN0cmluZyBvZiBhcnJheSBpbmRpY2VzIGFuZCBgZW5jb2RlVVJJQ29tcG9uZW50YC1lbmNvZGVkIG9iamVjdCBrZXlzIGRlbm90aW5nXG4gICAgICAgICAgICAgIHRoZSBwYXRoIHRvIHRoZSBkZXNpcmVkIGVsZW1lbnQgd2l0aGluIHRoZSBvYmplY3Qgc3RvcmUncyBqc29uIGRhdGEgc3RydWN0dXJlOyBlLmcuXG4gICAgICAgICAgICAgIGAndXNlcnMvMTIzL2ZpcnN0TmFtZSdgLiBJZiB1bmRlZmluZWQsIGBjdXJzb3JgIGJ1ZmZlcnMgYWxsIGRhdGEgYXQgdGhlIHJlcXVlc3RlZCBwYXRoIGFzIHRoZSByZXN1bHQgb2YgYVxuICAgICAgICAgICAgICBgZ2V0YCBvcGVyYXRpb24uIGBpbnNlcnRgIHdpbGwgc3BsaWNlIHRoZSBnaXZlbiBgdmFsdWVgIGludG8gdGhlIHBhcmVudCBhcnJheSBhdCB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uLFxuICAgICAgICAgICAgICBzaGlmdGluZyBhbnkgc3Vic2VxdWVudCBlbGVtZW50cyBmb3J3YXJkLlxuICAgICAgICAgICAgICAgV2hlbiBhbGwgcGVuZGluZyBvcGVyYXRpb25zIGNvbXBsZXRlLCBgY2FsbGJhY2tgIGlzIGNhbGxlZCB3aXRoIHRoZSByZXN1bHQgb2YgZWFjaCBxdWV1ZWQgb3BlcmF0aW9uIGluXG4gICAgICAgICAgICAgIG9yZGVyLiBNb3JlIG9wZXJhdGlvbnMgY2FuIGJlIHF1ZXVlZCBvbnRvIHRoZSBzYW1lIHRyYW5zYWN0aW9uIGF0IHRoYXQgdGltZSB2aWEgYHRoaXNgLlxuICAgICAgICAgICAgICAgUmVzdWx0cyBmcm9tIGBwdXRgLCBgaW5zZXJ0YCwgYGFwcGVuZGAsIGFuZCBgZGVsZXRlYCBhcmUgZXJyb3Igc3RyaW5ncyBvciB1bmRlZmluZWQgaWYgc3VjY2Vzc2Z1bC4gYGdldGBcbiAgICAgICAgICAgICAgcmVzdWx0cyBhcmUganNvbiBkYXRhIG9yIHVuZGVmaW5lZCBpZiBubyB2YWx1ZSBleGlzdHMgYXQgdGhlIHJlcXVlc3RlZCBwYXRoLiAqL1xuXG4gICAgICAgICAgLyoqIEN1cnNvcjogZnVuY3Rpb24ocGF0aDpbc3RyaW5nfG51bWJlciwgLi4uXSwgYXJyYXk6Ym9vbGVhbikgLT4gYm9vbGVhbnxBY3Rpb258e1xuICAgICAgICAgICAgICAgIGxvd2VyQm91bmQ9bnVsbDogc3RyaW5nfG51bWJlcixcbiAgICAgICAgICAgICAgICBsb3dlckV4Y2x1c2l2ZT1mYWxzZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgICB1cHBlckJvdW5kPW51bGw6IHN0cmluZ3xudW1iZXIsXG4gICAgICAgICAgICAgICAgdXBwZXJFeGNsdXNpdmU9ZmFsc2U6IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgZGVzY2VuZGluZz1mYWxzZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgICBhY3Rpb246IEFjdGlvblxuICAgICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAvKiogQWN0aW9uOmZ1bmN0aW9uKGtleTpzdHJpbmd8bnVtYmVyKSAtPiB1bmRlZmluZWR8c3RyaW5nXG4gICAgICAgICAgICAgICBgQ3Vyc29yYCBpcyBhIGZ1bmN0aW9uIGNhbGxlZCBmb3IgZWFjaCBhcnJheSBvciBvYmplY3QgZW5jb3VudGVyZWQgaW4gdGhlIHJlcXVlc3RlZCBqc29uIHN0cnVjdHVyZS4gSXQgaXNcbiAgICAgICAgICAgICAgY2FsbGVkIHdpdGggYSBgcGF0aGAgYXJyYXkgKG9mIHN0cmluZ3MgYW5kL29yIG51bWVyaWMgaW5kaWNlcykgcmVsYXRpdmUgdG8gdGhlIHJlcXVlc3RlZCBwYXRoIChpLmUuIGBbXWBcbiAgICAgICAgICAgICAgcmVwcmVzZW50cyB0aGUgcGF0aCBhcyByZXF1ZXN0ZWQgaW4gYGdldGApIGFuZCBhbiBgYXJyYXlgIGJvb2xlYW4gdGhhdCBpcyB0cnVlIGlmIHRoZSBzdWJzdHJ1Y3R1cmUgaXMgYW5cbiAgICAgICAgICAgICAgYXJyYXkuIEl0IHJldHVybnMgYW4gYEFjdGlvbmAgY2FsbGJhY2sgb3Igb2JqZWN0IHdpdGggYSByYW5nZSBhbmQgYGFjdGlvbmAsIG9yIGZhbHNlIHRvIHByZXZlbnRcbiAgICAgICAgICAgICAgcmVjdXJzaW9uIGludG8gdGhlIHN0cnVjdHVyZS4gYGxvd2VyQm91bmRgIGFuZCBgdXBwZXJCb3VuZGAgcmVzdHJpY3QgdGhlIGtleXMvaW5kaWNlcyB0cmF2ZXJzZWQgZm9yIHRoaXNcbiAgICAgICAgICAgICAgb2JqZWN0L2FycmF5LCBhbmQgdGhlIGBBY3Rpb25gIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGVhY2ggYGtleWAgaW4gdGhlIHJlcXVlc3RlZCByYW5nZSwgaW4gb3JkZXIuIFRoZVxuICAgICAgICAgICAgICBgQWN0aW9uYCBjYWxsYmFjayBjYW4gb3B0aW9uYWxseSByZXR1cm4gZWl0aGVyIGAnc2tpcCdgIG9yIGAnc3RvcCdgIHRvIGV4Y2x1ZGUgdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuXG4gICAgICAgICAgICAgIGtleSBmcm9tIHRoZSBzdHJ1Y3R1cmUgb3IgdG8gZXhjbHVkZSBhbmQgc3RvcCBpdGVyYXRpbmcsIHJlc3BlY3RpdmVseS5cbiAgICAgICAgICAgICAgIEZvciBleGFtcGxlLCB0aGUgZm9sbG93aW5nIGNhbGwgdXNlcyBhIGN1cnNvciB0byBmZXRjaCBvbmx5IHRoZSBpbW1lZGlhdGUgbWVtYmVycyBvZiB0aGUgb2JqZWN0IGF0IHRoZVxuICAgICAgICAgICAgICByZXF1ZXN0ZWQgcGF0aC4gT2JqZWN0IGFuZCBhcnJheSB2YWx1ZXMgd2lsbCBiZSBlbXB0eTpcbiAgICAgICAgICAgICAgYGRiLmdldCgncGF0aC90by9vYmplY3QnLCBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFwYXRoLmxlbmd0aDtcbiAgICAgICAgICAgICAgfSk7YFxuICAgICAgICAgICAgICAgVGhlIGZvbGxvd2luZyBjYWxsIHdpbGwgZ2V0IGltbWVkaWF0ZSBtZW1iZXJzIG9mIHRoZSByZXF1ZXN0ZWQgb2JqZWN0IHNvcnRlZCBsZXhpY29ncmFwaGljYWxseSAoYnkgY29kZVxuICAgICAgICAgICAgICB1bml0IHZhbHVlKSB1cCB0byBhbmQgaW5jbHVkaW5nIGtleSB2YWx1ZSBgJ2MnYCwgYnV0IGV4Y2x1ZGluZyBrZXkgYCdhYmMnYCAoaWYgYW55KTpcbiAgICAgICAgICAgICAgYGRiLmdldCgncGF0aC90by9vYmplY3QnLCBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGgubGVuZ3RoID8gZmFsc2UgOiB7XG4gICAgICAgICAgICAgICAgICB1cHBlckJvdW5kOiAnYycsXG4gICAgICAgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09ICdhYmMnKSByZXR1cm4gJ3NraXAnO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0pO2AgKi9cbiAgICAgICAgICByZXR1cm4gc2VsZiA9IEFycmF5LmlzQXJyYXkoc3RvcmVzKSA/IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KHN0b3JlLCBwYXRoLCBjdXJzb3IpIHtcbiAgICAgICAgICAgICAgdHJhbnMuZ2V0KHN0b3JlLCBwYXRoLCBjdXJzb3IpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwdXQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAoc3RvcmUsIHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLnB1dChzdG9yZSwgcGF0aCwgdmFsdWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbnNlcnQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAoc3RvcmUsIHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLnB1dChzdG9yZSwgcGF0aCwgdmFsdWUsIHRydWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhcHBlbmQ6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAoc3RvcmUsIHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLmFwcGVuZChzdG9yZSwgcGF0aCwgdmFsdWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZW1vdmVkIHRvIGF2b2lkIGVycm9yIHdpdGggZ3J1bnRcbiAgICAgICAgICAgIC8vIGRlbGV0ZTogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uKHN0b3JlLCBzdG9yZSwgcGF0aCkge1xuICAgICAgICAgICAgLy8gICB0cmFucy5kZWxldGUoc3RvcmUsIHN0b3JlLCBwYXRoKTtcbiAgICAgICAgICAgIC8vICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdGhlbjogZnVuY3Rpb24gdGhlbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICBjYiA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldChwYXRoLCBjdXJzb3IpIHtcbiAgICAgICAgICAgICAgdHJhbnMuZ2V0KHN0b3JlcywgcGF0aCwgY3Vyc29yKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHV0OiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLnB1dChzdG9yZXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5zZXJ0OiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLnB1dChzdG9yZXMsIHBhdGgsIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXBwZW5kOiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRyYW5zLmFwcGVuZChzdG9yZXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2RlbGV0ZSc6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgICB0cmFuc1snZGVsZXRlJ10oc3RvcmVzLCBwYXRoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhlbjogZnVuY3Rpb24gdGhlbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICBjYiA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KHBhdGgsIHdyaXRhYmxlLCBjdXJzb3IsIHN0b3JlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudHJhbnNhY3Rpb24od3JpdGFibGUsIHN0b3JlKS5nZXQocGF0aCwgY3Vyc29yKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0OiBmdW5jdGlvbiBwdXQocGF0aCwgdmFsdWUsIHN0b3JlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudHJhbnNhY3Rpb24odHJ1ZSwgc3RvcmUpLnB1dChwYXRoLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGluc2VydDogZnVuY3Rpb24gaW5zZXJ0KHBhdGgsIHZhbHVlLCBzdG9yZSkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnRyYW5zYWN0aW9uKHRydWUsIHN0b3JlKS5pbnNlcnQocGF0aCwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uIGFwcGVuZChwYXRoLCB2YWx1ZSwgc3RvcmUpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi50cmFuc2FjdGlvbih0cnVlLCBzdG9yZSkuYXBwZW5kKHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ2RlbGV0ZSc6IGZ1bmN0aW9uIF9kZWxldGUocGF0aCwgc3RvcmUpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi50cmFuc2FjdGlvbih0cnVlLCBzdG9yZSlbJ2RlbGV0ZSddKHBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgICAgaWYgKGRiKSB7XG4gICAgICAgICAgICBkYi5jbG9zZSgpO1xuICAgICAgICAgICAgZGIgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfY2xvc2UgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgICdkZWxldGUnOiBmdW5jdGlvbiBfZGVsZXRlKGRhdGFiYXNlLCBjYWxsYmFjaykge1xuICAgICAgdmFyIHJlcXVlc3QgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGF0YWJhc2UpO1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBjYWxsYmFjayhlLnRhcmdldC5lcnJvciwgZmFsc2UpO1xuICAgICAgfTtcbiAgICAgIHJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFjayhudWxsLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfSxcbiAgICBsaXN0OiBmdW5jdGlvbiBsaXN0KGNhbGxiYWNrKSB7XG4gICAgICBpbmRleGVkREIud2Via2l0R2V0RGF0YWJhc2VOYW1lcygpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNhbGxiYWNrKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0REI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1vYmplY3RkYi5qcy5tYXBcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBvYmplY3REQiA9IHJlcXVpcmUoJy4vb2JqZWN0ZGIuanMnKTtcblxudmFyIHZlcnNpb24gPSAxO1xudmFyIGxvZ2dpbmcgPSB0cnVlO1xuXG52YXIgbG9nID0gZnVuY3Rpb24gbG9nKCkge1xuICBpZiAobG9nZ2luZykge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn07XG52YXIgdXNlcklkO1xudmFyIHNlc3Npb25Ub2tlbjtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZnVuY3Rpb24gKGUpIHtcbiAgLy9BdXRvbWF0aWNhbGx5IHRha2Ugb3ZlciB0aGUgcHJldmlvdXMgd29ya2VyLlxuICBlLndhaXRVbnRpbChzZWxmLnNraXBXYWl0aW5nKCkpO1xufSk7XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBmdW5jdGlvbiAoZSkge1xuICBsb2coJ0FjdGl2YXRlZCBTZXJ2aWNlV29ya2VyIHZlcnNpb246ICcgKyB2ZXJzaW9uKTtcbn0pO1xuXG4vL0hhbmRsZSB0aGUgcHVzaCByZWNlaXZlZCBldmVudC5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcigncHVzaCcsIGZ1bmN0aW9uIChlKSB7XG4gIGxvZygncHVzaCBsaXN0ZW5lcicsIGUpO1xuICBlLndhaXRVbnRpbChuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZ2V0Tm90aWZpY2F0aW9ucyhmdW5jdGlvbiAobm90aWZpY2F0aW9ucykge1xuICAgICAgLy8gVGhpcyBpcyBhc3luYyBzbyByZXNvbHZlIG9uY2UgaXQncyBkb25lIGFuZCB0aGUgbm90aWZpY2F0aW9ucyBhcmUgc2hvd2luZ1xuICAgICAgc2hvd05vdGlmaWNhdGlvbnNJZk5vdFNob3duUHJldmlvdXNseShub3RpZmljYXRpb25zLCByZXNvbHZlKTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICByZWplY3QocmVhc29uKTtcbiAgICB9KTtcbiAgfSkpO1xufSk7XG5cbmZ1bmN0aW9uIGdldE5vdGlmaWNhdGlvbnMocmVzb2x2ZSwgcmVqZWN0KSB7XG4gIC8vIEdldCB0aGUgc2Vzc2lvbiB0b2tlbnMgZXRjIGZyb20gSURCXG4gIHZhciBkYiA9IG9iamVjdERCLm9wZW4oJ2RiLTEnKTtcbiAgZGIuZ2V0KCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBzZXNzaW9uVG9rZW4gPSBkYXRhLnNlc3Npb25Ub2tlbjtcbiAgICB2YXIgdXNlcklkID0gZGF0YS51c2VySWQ7XG4gICAgaWYgKHNlc3Npb25Ub2tlbiA9PSB1bmRlZmluZWQgfHwgdXNlcklkID09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIHdhcyBub3QgbG9nZ2VkIGluLiBDYW5ub3QgcmVxdWVzdCBub3RpZmljYXRpb25zLicpO1xuICAgIH1cbiAgICBzZWxmLnJlZ2lzdHJhdGlvbi5wdXNoTWFuYWdlci5nZXRTdWJzY3JpcHRpb24oKS50aGVuKGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgIGlmIChzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbklkID0gc3Vic2NyaXB0aW9uLnN1YnNjcmlwdGlvbklkO1xuICAgICAgICBmZXRjaCgnLy4uL3YxL25vdGlmaWNhdGlvbnMvZm9yLycgKyBzdWJzY3JpcHRpb25JZCwge1xuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdTRVNTSU9OX1RPS0VOJzogc2Vzc2lvblRva2VuLFxuICAgICAgICAgICAgJ1VTRVJfSUQnOiB1c2VySWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oZnVuY3Rpb24gKHR4dCkge1xuICAgICAgICAgICAgbG9nKCdmZXRjaGVkIG5vdGlmaWNhdGlvbnMnLCB0eHQpO1xuICAgICAgICAgICAgdmFyIG5vdGlmaWNhdGlvbnMgPSBKU09OLnBhcnNlKHR4dCk7XG4gICAgICAgICAgICByZXNvbHZlKG5vdGlmaWNhdGlvbnMpO1xuICAgICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG4gICAgICAgIH0pWydjYXRjaCddKHJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnV2FzIGFza2VkIHRvIGdldCBub3RpZmljYXRpb25zIGJlZm9yZSBhIHN1YnNjcmlwdGlvbiB3YXMgY3JlYXRlZCEnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbm90aWZpY2F0aW9uY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICBsb2coJ25vdGlmaWNhdGlvbmNsaWNrIGxpc3RlbmVyJywgZSk7XG4gIGUud2FpdFVudGlsKGhhbmRsZU5vdGlmaWNhdGlvbkNsaWNrKGUpKTtcbn0pO1xuXG4vL1V0aWxpdHkgZnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBjbGlja1xuZnVuY3Rpb24gaGFuZGxlTm90aWZpY2F0aW9uQ2xpY2soZSkge1xuICBsb2coJ05vdGlmaWNhdGlvbiBjbGlja2VkOiAnLCBlLm5vdGlmaWNhdGlvbik7XG4gIGUubm90aWZpY2F0aW9uLmNsb3NlKCk7XG4gIHJldHVybiBjbGllbnRzLm1hdGNoQWxsKHtcbiAgICB0eXBlOiAnd2luZG93JyxcbiAgICBpbmNsdWRlVW5jb250cm9sbGVkOiBmYWxzZVxuICB9KVsnY2F0Y2gnXShmdW5jdGlvbiAoZXgpIHtcbiAgICBjb25zb2xlLmxvZyhleCk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKGNsaWVudExpc3QpIHtcbiAgICByZXR1cm4gY2xpZW50cy5vcGVuV2luZG93KGUubm90aWZpY2F0aW9uLnVybCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzaG93Tm90aWZpY2F0aW9uc0lmTm90U2hvd25QcmV2aW91c2x5KG5vdGlmaWNhdGlvbnMsIHN1Y2Nlc3MpIHtcbiAgdmFyIGRiID0gb2JqZWN0REIub3BlbignZGItMScpO1xuICBkYi5nZXQoKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKTtcbiAgICBpZiAoZGF0YS5ub3RpZmljYXRpb25JZHMgPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZGF0YS5ub3RpZmljYXRpb25JZHMgd2FzIGJsYW5rJyk7XG4gICAgICBkYXRhLm5vdGlmaWNhdGlvbklkcyA9IFtdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vdGlmaWNhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBub3RlID0gbm90aWZpY2F0aW9uc1tpXTtcbiAgICAgIGlmIChkYXRhLm5vdGlmaWNhdGlvbklkcy5pbmRleE9mKG5vdGUuaWQpIDwgMCkge1xuICAgICAgICBjb25zb2xlLmxvZygnaGF2ZW50IHNob3duIG5vdGUgJyArIG5vdGUuaWQgKyAnIGJlZm9yZScpO1xuICAgICAgICBkYXRhLm5vdGlmaWNhdGlvbklkcy5wdXNoKG5vdGUuaWQpO1xuICAgICAgICBzaG93Tm90aWZpY2F0aW9uKG5vdGUudGl0bGUsIG5vdGUuYm9keSwgbm90ZS51cmwsIG5vdGUuaWNvbiwgbm90ZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnd2Ugc2hvd2VkIG5vdGUgJyArIG5vdGUuaWQgKyAnIHByZXZpb3VzbHkgc28gc2tpcCBpdCcpO1xuICAgICAgfVxuICAgIH1cbiAgICBkYi5wdXQoJ25vdGlmaWNhdGlvbklkcycsIGRhdGEubm90aWZpY2F0aW9uSWRzKTtcbiAgICBzdWNjZXNzKCk7XG4gIH0pO1xufVxuXG4vL1V0aWxpdHkgZnVuY3Rpb24gdG8gYWN0dWFsbHkgc2hvdyB0aGUgbm90aWZpY2F0aW9uLlxuZnVuY3Rpb24gc2hvd05vdGlmaWNhdGlvbih0aXRsZSwgYm9keSwgdXJsLCBpY29uLCB0YWcpIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgYm9keTogYm9keSxcbiAgICB0YWc6IHRhZyxcbiAgICAvLyBsYW5nOiAndGVzdCBsYW5nJyxcbiAgICBpY29uOiBpY29uLFxuICAgIGRhdGE6IHsgdXJsOiB1cmwgfSxcbiAgICB2aWJyYXRlOiAxMDAwLFxuICAgIG5vc2NyZWVuOiBmYWxzZVxuICB9O1xuICBpZiAoc2VsZi5yZWdpc3RyYXRpb24gJiYgc2VsZi5yZWdpc3RyYXRpb24uc2hvd05vdGlmaWNhdGlvbikge1xuICAgIC8vIFRPRE86IGVuc3VyZSB0aGlzIHdvcmtzIGFmdGVyIHRoZSBwYWdlIGlzIGNsb3NlZFxuICAgIHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24odGl0bGUsIG9wdGlvbnMpO1xuICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdy5qcy5tYXBcbiJdfQ==
