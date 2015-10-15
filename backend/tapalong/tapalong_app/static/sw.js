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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0YXBhbG9uZy90YXBhbG9uZ19hcHAvY2xpZW50L3RtcC9vYmplY3RkYi5qcyIsInRhcGFsb25nL3RhcGFsb25nX2FwcC9jbGllbnQvdG1wL3N3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IDIwMTQsIEtsYXVzIEdhbnNlciA8aHR0cDovL2tnYW5zZXIuY29tPlxuLy8gTUlUIExpY2Vuc2VkLCB3aXRoIHRoaXMgY29weXJpZ2h0IGFuZCBwZXJtaXNzaW9uIG5vdGljZVxuLy8gPGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVQ+XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIG9iamVjdERCID0gKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgbWFrZUtleSA9IGZ1bmN0aW9uIG1ha2VLZXkocGF0aCkge1xuICAgIHZhciBrZXkgPSBwYXRoLmxlbmd0aCA/IHBhdGhbcGF0aC5sZW5ndGggLSAxXSA6ICcnO1xuICAgIHJldHVybiBbcGF0aC5sZW5ndGggPCAyICYmICFrZXkgPyAwIDogcGF0aC5zbGljZSgwLCAtMSkubWFwKGVuY29kZVVSSUNvbXBvbmVudCkuam9pbignLycpLCBrZXldO1xuICB9O1xuICB2YXIgc2NvcGVkUmFuZ2UgPSBmdW5jdGlvbiBzY29wZWRSYW5nZShwYXJlbnQsIGxvd2VyLCB1cHBlciwgbGUsIHVlKSB7XG4gICAgcGFyZW50ID0gcGFyZW50Lm1hcChlbmNvZGVVUklDb21wb25lbnQpLmpvaW4oJy8nKTtcbiAgICB1ZSA9IHVwcGVyID09IG51bGwgfHwgdWU7XG4gICAgbG93ZXIgPSBsb3dlciA9PSBudWxsID8gW3BhcmVudF0gOiBbcGFyZW50LCBsb3dlcl07XG4gICAgdXBwZXIgPSB1cHBlciA9PSBudWxsID8gW3BhcmVudCArICdcXDAnXSA6IFtwYXJlbnQsIHVwcGVyXTtcbiAgICByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQobG93ZXIsIHVwcGVyLCBsZSwgdWUpO1xuICB9O1xuICB2YXIgcmVzb2x2ZVBhdGggPSBmdW5jdGlvbiByZXNvbHZlUGF0aChzdG9yZSwgcGF0aCwgY2FsbGJhY2spIHtcbiAgICAvLyBzdWJzdGl0dXRlIGFycmF5IGluZGljZXMgaW4gcGF0aCB3aXRoIG51bWVyaWMga2V5cztcbiAgICAvLyBzZWNvbmQgYXJndW1lbnQgdG8gY2FsbGJhY2sgaXMgdHJ1ZSBpZiBwYXRoIGlzIGFuIGVtcHR5IGFycmF5IHNsb3RcbiAgICBwYXRoID0gcGF0aCA/IHBhdGguc3BsaXQoJy8nKS5tYXAoZGVjb2RlVVJJQ29tcG9uZW50KSA6IFtdO1xuICAgIChmdW5jdGlvbiBhZHZhbmNlKGksIGVtcHR5KSB7XG4gICAgICB3aGlsZSAoaSA8IHBhdGgubGVuZ3RoICYmICEvMHxbMS05XVswLTldKi8udGVzdChwYXRoW2ldKSkgaSsrO1xuICAgICAgaWYgKGkgPT0gcGF0aC5sZW5ndGgpIHJldHVybiBjYWxsYmFjayhwYXRoLCBlbXB0eSk7XG4gICAgICB2YXIgcG9zaXRpb24gPSBwYXJzZUludChwYXRoW2ldKTtcbiAgICAgIHN0b3JlLmdldChtYWtlS2V5KHBhdGguc2xpY2UoMCwgaSkpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICBpZiAoIXJlc3VsdCkgcmV0dXJuIGNhbGxiYWNrKHBhdGgsIGVtcHR5KTtcbiAgICAgICAgaWYgKHJlc3VsdC50eXBlICE9ICdhcnJheScpIHJldHVybiBhZHZhbmNlKGkgKyAxKTtcbiAgICAgICAgLy8gc2V0IHRvIG51bWVyaWMgaW5kZXggaW5pdGlhbGx5LCBhbmQgdG8ga2V5IGlmIGVsZW1lbnQgaXMgZm91bmRcbiAgICAgICAgcGF0aFtpXSA9IHBvc2l0aW9uO1xuICAgICAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhdGguc2xpY2UoMCwgaSkpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgaWYgKGN1cnNvciAmJiBwb3NpdGlvbikge1xuICAgICAgICAgICAgY3Vyc29yLmFkdmFuY2UocG9zaXRpb24pO1xuICAgICAgICAgICAgcG9zaXRpb24gPSAwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY3Vyc29yKSBwYXRoW2ldID0gY3Vyc29yLnZhbHVlLmtleTtcbiAgICAgICAgICAgIGFkdmFuY2UoaSArIDEsICFjdXJzb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfSkoMCk7XG4gIH07XG4gIHZhciBnZXQgPSBmdW5jdGlvbiBnZXQoc3RvcmUsIHBhdGgsIGNhbGxiYWNrLCBjdXJzb3IpIHtcbiAgICB2YXIgbmV4dDtcbiAgICBpZiAodHlwZW9mIGN1cnNvciAhPSAnZnVuY3Rpb24nKSBjdXJzb3IgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBzdG9yZS5nZXQobWFrZUtleShwYXRoKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciByZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBpZiAoIXJlc3VsdCkgcmV0dXJuIG5leHQgfHwgY2FsbGJhY2soKTtcbiAgICAgIChuZXh0ID0gZnVuY3Rpb24gKHJlc3VsdCwgcGFyZW50LCBwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQudmFsdWUsXG4gICAgICAgICAgICB0eXBlID0gcmVzdWx0LnR5cGUsXG4gICAgICAgICAgICBwZW5kaW5nID0gMSxcbiAgICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgaWYgKHR5cGUgIT0gJ29iamVjdCcgJiYgdHlwZSAhPSAnYXJyYXknKSByZXR1cm4gY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICB2YXIgYXJyYXkgPSB0eXBlID09ICdhcnJheScsXG4gICAgICAgICAgICBjID0gY3Vyc29yKHBhdGgsIGFycmF5KTtcbiAgICAgICAgdmFsdWUgPSBhcnJheSA/IFtdIDoge307XG4gICAgICAgIGlmIChjID09PSBmYWxzZSkgcmV0dXJuIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgaWYgKCFjIHx8IHR5cGVvZiBjICE9ICdvYmplY3QnKSBjID0geyBhY3Rpb246IGMgfHwge30gfTtcbiAgICAgICAgaWYgKHR5cGVvZiBjLmFjdGlvbiAhPSAnZnVuY3Rpb24nKSBjLmFjdGlvbiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhcmVudCwgYy5sb3dlckJvdW5kLCBjLnVwcGVyQm91bmQsIGMubG93ZXJFeGNsdXNpdmUsIGMudXBwZXJFeGNsdXNpdmUpLCBjLmRlc2NlbmRpbmcgPyAncHJldicgOiAnbmV4dCcpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICBpZiAoIWN1cnNvcikgcmV0dXJuIC0tcGVuZGluZyB8fCBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IGN1cnNvci52YWx1ZSxcbiAgICAgICAgICAgICAga2V5ID0gYXJyYXkgPyBpbmRleCsrIDogcmVzdWx0LmtleSxcbiAgICAgICAgICAgICAgYWN0aW9uID0gYy5hY3Rpb24oa2V5KTtcbiAgICAgICAgICBpZiAoYWN0aW9uID09ICdzdG9wJykgcmV0dXJuIC0tcGVuZGluZyB8fCBjYWxsYmFjayh2YWx1ZSk7XG4gICAgICAgICAgaWYgKGFjdGlvbiAhPSAnc2tpcCcpIHtcbiAgICAgICAgICAgIHZhbHVlW2tleV0gPSBwZW5kaW5nKys7XG4gICAgICAgICAgICBuZXh0KHJlc3VsdCwgcGFyZW50LmNvbmNhdChbcmVzdWx0LmtleV0pLCBwYXRoLmNvbmNhdChba2V5XSksIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICAgICAgICB2YWx1ZVtrZXldID0gY2hpbGQ7XG4gICAgICAgICAgICAgIGlmICghIC0tcGVuZGluZykgY2FsbGJhY2sodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnNvclsnY29udGludWUnXSgpO1xuICAgICAgICB9O1xuICAgICAgfSkocmVzdWx0LCBwYXRoLCBbXSwgY2FsbGJhY2spO1xuICAgIH07XG4gIH07XG4gIHZhciBfcHV0ID0gZnVuY3Rpb24gX3B1dChzdG9yZSwgcGF0aCwgdmFsdWUsIGNhbGxiYWNrKSB7XG4gICAgLy8geyBrZXk6IChrZXkgb3IgaW5kZXggcmVsYXRpdmUgdG8gcGFyZW50KVxuICAgIC8vICAgcGFyZW50OiAocGF0aCBvZiBwYXJlbnQgZW50cnkpXG4gICAgLy8gICB0eXBlOiAoc3RyaW5nfG51bWJlcnxib29sZWFufG51bGx8YXJyYXl8b2JqZWN0KVxuICAgIC8vICAgdmFsdWU6IChvciBudWxsIGlmIGFycmF5IG9yIG9iamVjdCkgfVxuICAgIHZhciB0eXBlID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAnYXJyYXknIDogdHlwZW9mIHZhbHVlID09ICdvYmplY3QnID8gdmFsdWUgPyAnb2JqZWN0JyA6ICdudWxsJyA6IHR5cGVvZiB2YWx1ZSxcbiAgICAgICAga2V5ID0gbWFrZUtleShwYXRoKSxcbiAgICAgICAgcGVuZGluZyA9IDEsXG4gICAgICAgIGNiID0gZnVuY3Rpb24gY2IoKSB7XG4gICAgICBpZiAoISAtLXBlbmRpbmcpIGNhbGxiYWNrKCk7XG4gICAgfTtcbiAgICBzdG9yZS5wdXQoeyBwYXJlbnQ6IGtleVswXSwga2V5OiBrZXlbMV0sIHR5cGU6IHR5cGUsIHZhbHVlOiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgPyBudWxsIDogdmFsdWUgfSkub25zdWNjZXNzID0gY2I7XG4gICAgaWYgKHR5cGUgPT0gJ2FycmF5Jykge1xuICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGkpIHtcbiAgICAgICAgcGVuZGluZysrO1xuICAgICAgICBfcHV0KHN0b3JlLCBwYXRoLmNvbmNhdChbaV0pLCB2YWx1ZSwgY2IpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09ICdvYmplY3QnKSB7XG4gICAgICBPYmplY3Qua2V5cyh2YWx1ZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgX3B1dChzdG9yZSwgcGF0aC5jb25jYXQoW2tleV0pLCB2YWx1ZVtrZXldLCBjYik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIHZhciBfYXBwZW5kID0gZnVuY3Rpb24gX2FwcGVuZChzdG9yZSwgcGF0aCwgdmFsdWUsIGNhbGxiYWNrKSB7XG4gICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXRoKSwgJ3ByZXYnKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIF9wdXQoc3RvcmUsIHBhdGguY29uY2F0KFtjdXJzb3IgPyBjdXJzb3IudmFsdWUua2V5ICsgMSA6IDBdKSwgdmFsdWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuICB9O1xuICB2YXIgZGVsZXRlQ2hpbGRyZW4gPSBmdW5jdGlvbiBkZWxldGVDaGlsZHJlbihzdG9yZSwgcGF0aCwgY2FsbGJhY2spIHtcbiAgICB2YXIgcGVuZGluZyA9IDEsXG4gICAgICAgIGNiID0gZnVuY3Rpb24gY2IoKSB7XG4gICAgICBpZiAoISAtLXBlbmRpbmcpIGNhbGxiYWNrKCk7XG4gICAgfTtcbiAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhdGgpKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmICghY3Vyc29yKSByZXR1cm4gY2IoKTtcbiAgICAgIHZhciByZXN1bHQgPSBjdXJzb3IudmFsdWU7XG4gICAgICBwZW5kaW5nKys7XG4gICAgICBzdG9yZVsnZGVsZXRlJ10oW3Jlc3VsdC5wYXJlbnQsIHJlc3VsdC5rZXldKS5vbnN1Y2Nlc3MgPSBjYjtcbiAgICAgIGlmIChyZXN1bHQudHlwZSA9PSAnb2JqZWN0JyB8fCByZXN1bHQudHlwZSA9PSAnYXJyYXknKSB7XG4gICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgZGVsZXRlQ2hpbGRyZW4oc3RvcmUsIHBhdGguY29uY2F0KFtyZXN1bHQua2V5XSksIGNiKTtcbiAgICAgIH1cbiAgICAgIGN1cnNvclsnY29udGludWUnXSgpO1xuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBmdW5jdGlvbiBvcGVuKGRhdGFiYXNlLCB1cGdyYWRlLCB2ZXJzaW9uLCBvbkVycm9yKSB7XG4gICAgICAvKiogb2JqZWN0REI6IHtcbiAgICAgICAgICAgIG9wZW46IGZ1bmN0aW9uKGRhdGFiYXNlOnN0cmluZywgdXBncmFkZT1ge31gOmpzb258ZnVuY3Rpb24oVXBncmFkZVRyYW5zYWN0aW9uKSwgdmVyc2lvbj0xOm51bWJlciwgb25FcnJvcj11bmRlZmluZWQ6ZnVuY3Rpb24oZXJyb3I6RE9NRXJyb3IsIGJsb2NrZWQ6Ym9vbGVhbikpIC0+IERhdGFiYXNlLFxuICAgICAgICAgICAgZGVsZXRlOiBmdW5jdGlvbihkYXRhYmFzZTpzdHJpbmcsIGNhbGxiYWNrOmZ1bmN0aW9uKGVycm9yOnVuZGVmaW5lZHxET01FcnJvciwgYmxvY2tlZDpib29sZWFuKSksXG4gICAgICAgICAgICBsaXN0OiBmdW5jdGlvbihjYWxsYmFjazpmdW5jdGlvbihET01TdHJpbmdMaXN0KSlcbiAgICAgICAgICB9XG4gICAgICAgICAgIE9iamVjdERCIGlzIGJhY2tlZCBieSBgaW5kZXhlZERCYC4gQW4gdXBncmFkZSB0cmFuc2FjdGlvbiBydW5zIG9uIGBvcGVuYCBpZiB0aGUgZGF0YWJhc2UgdmVyc2lvbiBpcyBsZXNzIHRoYW5cbiAgICAgICAgICB0aGUgcmVxdWVzdGVkIHZlcnNpb24gb3IgZG9lcyBub3QgZXhpc3QuIElmIGB1cGdyYWRlYCBpcyBhIGpzb24gdmFsdWUsIHRoZSBkYXRhIHN0b3JlcyBpbiB0aGUgZmlyc3QgdHJhbnNhY3Rpb25cbiAgICAgICAgICBvcGVyYXRpb24gb24gdGhpcyBgRGF0YWJhc2VgIHdpbGwgYmUgcG9wdWxhdGVkIHdpdGggdGhpcyB2YWx1ZSBvbiBhbiB1cGdyYWRlIGV2ZW50LiBPdGhlcndpc2UsIGFuIHVwZ3JhZGUgd2lsbFxuICAgICAgICAgIGJlIGhhbmRsZWQgYnkgdGhlIGdpdmVuIGZ1bmN0aW9uIHZpYSBgVXBncmFkZVRyYW5zYWN0aW9uYC4gKi9cbiAgICAgIHZhciBzZWxmLFxuICAgICAgICAgIGRiLFxuICAgICAgICAgIHF1ZXVlLFxuICAgICAgICAgIF9jbG9zZSxcbiAgICAgICAgICBvcGVuID0gZnVuY3Rpb24gb3BlbihzdG9yZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChkYikgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIGlmIChxdWV1ZSkgcmV0dXJuIHF1ZXVlLnB1c2goY2FsbGJhY2spO1xuICAgICAgICBxdWV1ZSA9IFtjYWxsYmFja107XG4gICAgICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oZGF0YWJhc2UsIHZlcnNpb24gfHwgMSk7XG4gICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgc2VsZixcbiAgICAgICAgICAgICAgZGIgPSBlLnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgIGRhdGEgPSB1cGdyYWRlID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHVwZ3JhZGUgPT0gJ2Z1bmN0aW9uJyA/IHt9IDogdXBncmFkZTtcbiAgICAgICAgICBpZiAodHlwZW9mIHVwZ3JhZGUgIT0gJ2Z1bmN0aW9uJykgdXBncmFkZSA9IGZ1bmN0aW9uIChkYikge1xuICAgICAgICAgICAgKEFycmF5LmlzQXJyYXkoc3RvcmVzKSA/IHN0b3JlcyA6IFtzdG9yZXNdKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKG5hbWUsIGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvKiogVXBncmFkZVRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgb2xkVmVyc2lvbjogbnVtYmVyLFxuICAgICAgICAgICAgICAgIG5ld1ZlcnNpb246IG51bWJlcixcbiAgICAgICAgICAgICAgICBjcmVhdGVPYmplY3RTdG9yZTogZnVuY3Rpb24obmFtZTpzdHJpbmcsIGRhdGE9YHt9YDpqc29uKSAtPiBVcGdyYWRlVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGVsZXRlT2JqZWN0U3RvcmU6IGZ1bmN0aW9uKG5hbWU6c3RyaW5nKSAtPiBVcGdyYWRlVHJhbnNhY3Rpb25cbiAgICAgICAgICAgICAgfSAqL1xuICAgICAgICAgIHVwZ3JhZGUoc2VsZiA9IHtcbiAgICAgICAgICAgIG9sZFZlcnNpb246IGUub2xkVmVyc2lvbixcbiAgICAgICAgICAgIG5ld1ZlcnNpb246IGUubmV3VmVyc2lvbixcbiAgICAgICAgICAgIGNyZWF0ZU9iamVjdFN0b3JlOiBmdW5jdGlvbiBjcmVhdGVPYmplY3RTdG9yZShuYW1lLCBkYXRhKSB7XG4gICAgICAgICAgICAgIGlmIChkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKG5hbWUpKSB0aHJvdyAnb2JqZWN0U3RvcmUgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgICAgICAgICBfcHV0KGRiLmNyZWF0ZU9iamVjdFN0b3JlKG5hbWUsIHsga2V5UGF0aDogWydwYXJlbnQnLCAna2V5J10gfSksIFtdLCBkYXRhID09PSB1bmRlZmluZWQgPyB7fSA6IGRhdGEsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlT2JqZWN0U3RvcmU6IGZ1bmN0aW9uIGRlbGV0ZU9iamVjdFN0b3JlKG5hbWUpIHtcbiAgICAgICAgICAgICAgaWYgKGRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMobmFtZSkpIGRiLmRlbGV0ZU9iamVjdFN0b3JlKG5hbWUpO1xuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGRiID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIHdoaWxlIChjYWxsYmFjayA9IHF1ZXVlLnNoaWZ0KCkpIGNhbGxiYWNrKCk7XG4gICAgICAgICAgaWYgKF9jbG9zZSkge1xuICAgICAgICAgICAgZGIuY2xvc2UoKTtcbiAgICAgICAgICAgIF9jbG9zZSA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAob25FcnJvcikge1xuICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBvbkVycm9yKGUudGFyZ2V0LmVycm9yLCBmYWxzZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9uRXJyb3IobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBfdHJhbnNhY3Rpb24gPSBmdW5jdGlvbiBfdHJhbnNhY3Rpb24odHlwZSwgc3RvcmVzLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgdHJhbnMsXG4gICAgICAgICAgICBwZW5kaW5nID0gMCxcbiAgICAgICAgICAgIHZhbHVlcyA9IFtdLFxuICAgICAgICAgICAgc2VsZiA9IHtcbiAgICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgICBwdXQ6IGZ1bmN0aW9uIHB1dChzdG9yZSwgcGF0aCwgY2FsbGJhY2ssIHZhbHVlLCBpbnNlcnQsIGVtcHR5KSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50UGF0aCA9IHBhdGguc2xpY2UoMCwgLTEpO1xuICAgICAgICAgICAgc3RvcmUuZ2V0KG1ha2VLZXkocGFyZW50UGF0aCkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlLnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICBrZXkgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgIGlmICghcGFyZW50ICYmIHBhdGgubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2soJ1BhcmVudCByZXNvdXJjZSBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgICAgICAgICBpZiAoaW5zZXJ0ICYmICghcGF0aC5sZW5ndGggfHwgcGFyZW50LnR5cGUgIT0gJ2FycmF5JykpIHJldHVybiBjYWxsYmFjaygnUGFyZW50IHJlc291cmNlIGlzIG5vdCBhbiBhcnJheScpO1xuICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC50eXBlICE9ICdvYmplY3QnICYmIHBhcmVudC50eXBlICE9ICdhcnJheScpIHJldHVybiBjYWxsYmFjaygnUGFyZW50IHJlc291cmNlIGlzIG5vdCBhbiBvYmplY3Qgb3IgYXJyYXknKTtcbiAgICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSA9PSAnYXJyYXknICYmIHR5cGVvZiBrZXkgIT0gJ251bWJlcicpIHJldHVybiBjYWxsYmFjaygnSW52YWxpZCBpbmRleCB0byBhcnJheSByZXNvdXJjZScpO1xuICAgICAgICAgICAgICBpZiAoZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAvLyBhcnJheSBzbG90XG4gICAgICAgICAgICAgICAgX2FwcGVuZChzdG9yZSwgcGFyZW50UGF0aCwgdmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnNlcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaGlmdEtleSA9IGtleTtcbiAgICAgICAgICAgICAgICBzdG9yZS5vcGVuQ3Vyc29yKHNjb3BlZFJhbmdlKHBhcmVudFBhdGgsIGtleSkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgaWYgKGN1cnNvciAmJiBjdXJzb3IudmFsdWUua2V5ID09IGtleSArIGkrKykge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgY29udGlndW91cyBrZXlzIGFmdGVyIGRlc2lyZWQgcG9zaXRpb24gbXVzdCBiZSBzaGlmdGVkIGJ5IG9uZVxuICAgICAgICAgICAgICAgICAgICBsYXN0U2hpZnRLZXkgPSBjdXJzb3IudmFsdWUua2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yWydjb250aW51ZSddKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBmb3VuZCBsYXN0IGtleSB0byBzaGlmdDsgbm93IHNoaWZ0IHN1YnNlcXVlbnQgZWxlbWVudHMnIGtleXNcbiAgICAgICAgICAgICAgICAgIHZhciBwZW5kaW5nID0gMSxcbiAgICAgICAgICAgICAgICAgICAgICBjYiA9IGZ1bmN0aW9uIGNiKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISAtLXBlbmRpbmcpIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgc3RvcmUub3BlbkN1cnNvcihzY29wZWRSYW5nZShwYXJlbnRQYXRoLCBrZXksIGxhc3RTaGlmdEtleSksICdwcmV2Jykub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikgcmV0dXJuIF9wdXQoc3RvcmUsIHBhdGgsIHZhbHVlLCBjYik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGN1cnNvci52YWx1ZS5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aCA9IHBhcmVudFBhdGguY29uY2F0KFtpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgICAgICAgICAgICAgIGdldChzdG9yZSwgY3VycmVudFBhdGgsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBkZWxldGUvcHV0IHdpdGhpbiBjdXJzb3JcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGVDaGlsZHJlbihzdG9yZSwgY3VycmVudFBhdGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9wdXQoc3RvcmUsIHBhcmVudFBhdGguY29uY2F0KFtpbmRleCArIDFdKSwgcmVzdWx0LCBjYik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JbJ2NvbnRpbnVlJ10oKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlQ2hpbGRyZW4oc3RvcmUsIHBhdGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIF9wdXQoc3RvcmUsIHBhdGgsIHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uIGFwcGVuZChzdG9yZSwgcGF0aCwgY2FsbGJhY2ssIHZhbHVlKSB7XG4gICAgICAgICAgICBzdG9yZS5nZXQobWFrZUtleShwYXRoKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHJldHVybiBjYWxsYmFjaygnUGFyZW50IHJlc291cmNlIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnQudHlwZSAhPSAnYXJyYXknKSByZXR1cm4gY2FsbGJhY2soJ1BhcmVudCByZXNvdXJjZSBpcyBub3QgYW4gYXJyYXknKTtcbiAgICAgICAgICAgICAgX2FwcGVuZChzdG9yZSwgcGF0aCwgdmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgICAnZGVsZXRlJzogZnVuY3Rpb24gX2RlbGV0ZShzdG9yZSwgcGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHN0b3JlWydkZWxldGUnXShtYWtlS2V5KHBhdGgpKTtcbiAgICAgICAgICAgIGRlbGV0ZUNoaWxkcmVuKHN0b3JlLCBwYXRoLCBjYWxsYmFjayk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBPYmplY3Qua2V5cyhzZWxmKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgdmFyIG1ldGhvZCA9IHNlbGZbbmFtZV07XG4gICAgICAgICAgdmFyIHdyYXBwZWQgPSBmdW5jdGlvbiB3cmFwcGVkKHN0b3JlLCBwYXRoLCB2YWx1ZSwgaW5zZXJ0KSB7XG4gICAgICAgICAgICB2YXIgaSA9IHZhbHVlcy5wdXNoKHBlbmRpbmcrKykgLSAxLFxuICAgICAgICAgICAgICAgIHAgPSBwYXRoO1xuICAgICAgICAgICAgcmVzb2x2ZVBhdGgoc3RvcmUgPSB0cmFucy5vYmplY3RTdG9yZShzdG9yZSksIHBhdGgsIGZ1bmN0aW9uIChwYXRoLCBlbXB0eSkge1xuICAgICAgICAgICAgICBtZXRob2Qoc3RvcmUsIHBhdGgsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICghIC0tcGVuZGluZykge1xuICAgICAgICAgICAgICAgICAgdmFyIHYgPSB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgdmFsdWUsIGluc2VydCwgZW1wdHkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBzZWxmW25hbWVdID0gZnVuY3Rpb24gKHN0b3JlLCBwYXRoLCB2YWx1ZSwgaW5zZXJ0KSB7XG4gICAgICAgICAgICBpZiAodHJhbnMpIHJldHVybiB3cmFwcGVkKHN0b3JlLCBwYXRoLCB2YWx1ZSwgaW5zZXJ0KTtcbiAgICAgICAgICAgIG9wZW4oc3RvcmVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmICghdHJhbnMpIHRyYW5zID0gZGIudHJhbnNhY3Rpb24oc3RvcmVzLCB0eXBlKTtcbiAgICAgICAgICAgICAgd3JhcHBlZChzdG9yZSwgcGF0aCwgdmFsdWUsIGluc2VydCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9O1xuICAgICAgLyoqIERhdGFiYXNlOiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbjogZnVuY3Rpb24od3JpdGFibGU9ZmFsc2U6Ym9vbGVhbiwgc3RvcmVzPSdkYXRhJzpbc3RyaW5nLCAuLi5dfHN0cmluZykgLT4gVHJhbnNhY3Rpb258U2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB3cml0YWJsZT1mYWxzZTpib29sZWFuLCBjdXJzb3I9dW5kZWZpbmVkOkN1cnNvciwgc3RvcmU9J2RhdGEnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBwdXQ6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uLCBzdG9yZT0nZGF0YSc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIGluc2VydDogZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24sIHN0b3JlPSdkYXRhJzpzdHJpbmcpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgYXBwZW5kOiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbiwgc3RvcmU9J2RhdGEnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBkZWxldGU6IGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCBzdG9yZT0nZGF0YSc6c3RyaW5nKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIGNsb3NlOiBmdW5jdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICAgYGdldGAsIGBwdXRgLCBgaW5zZXJ0YCwgYGFwcGVuZGAsIGFuZCBgZGVsZXRlYCBhcmUgY29udmVuaWVuY2UgbWV0aG9kcyB0aGF0IG9wZXJhdGUgdGhyb3VnaCBgdHJhbnNhY3Rpb25gIGZvclxuICAgICAgICAgIGEgc2luZ2xlIG9iamVjdFN0b3JlIGFuZCByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgYFNjb3BlZFRyYW5zYWN0aW9uYC4gYGdldGAgaW5pdGlhdGVzIGEgcmVhZC1vbmx5XG4gICAgICAgICAgdHJhbnNhY3Rpb24gYnkgZGVmYXVsdC4gYHRyYW5zYWN0aW9uYCByZXR1cm5zIGEgYFNjb3BlZFRyYW5zYWN0aW9uYCBpZiBhIHNpbmdsZSAoc3RyaW5nKSBvYmplY3RTdG9yZSBpc1xuICAgICAgICAgIHNwZWNpZmllZCwgYW5kIGEgYFRyYW5zYWN0aW9uYCBpZiBvcGVyYXRpbmcgb24gbXVsdGlwbGUgb2JqZWN0U3RvcmVzLiAqL1xuICAgICAgcmV0dXJuIHNlbGYgPSB7XG4gICAgICAgIHRyYW5zYWN0aW9uOiBmdW5jdGlvbiB0cmFuc2FjdGlvbih3cml0YWJsZSwgc3RvcmVzKSB7XG4gICAgICAgICAgaWYgKHN0b3JlcyA9PSBudWxsKSBzdG9yZXMgPSAnZGF0YSc7XG4gICAgICAgICAgdmFyIHNlbGYsXG4gICAgICAgICAgICAgIGNiLFxuICAgICAgICAgICAgICB0cmFucyA9IF90cmFuc2FjdGlvbih3cml0YWJsZSA/ICdyZWFkd3JpdGUnIDogJ3JlYWRvbmx5Jywgc3RvcmVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY2IpIGNiLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLyoqIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihzdG9yZTpzdHJpbmcsIHBhdGg9Jyc6c3RyaW5nLCBjdXJzb3I9dW5kZWZpbmVkOkN1cnNvcikgLT4gVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgcHV0OiBudWxsfGZ1bmN0aW9uKHN0b3JlOnN0cmluZywgcGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGluc2VydDogbnVsbHxmdW5jdGlvbihzdG9yZTpzdHJpbmcsIHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBhcHBlbmQ6IG51bGx8ZnVuY3Rpb24oc3RvcmU6c3RyaW5nLCBwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGVsZXRlOiBudWxsfGZ1bmN0aW9uKHN0b3JlOnN0cmluZywgcGF0aD0nJzpzdHJpbmcpIC0+IFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIHRoZW46IGZ1bmN0aW9uKGNhbGxiYWNrOmZ1bmN0aW9uKHRoaXM6VHJhbnNhY3Rpb24sIGpzb258dW5kZWZpbmVkLCAuLi4pKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBBIGBUcmFuc2FjdGlvbmAgYWN0aW5nIG9uIG11bHRpcGxlIGRhdGEgc3RvcmVzIG11c3Qgc3BlY2lmeSBhIGRhdGEgc3RvcmUgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIGV2ZXJ5XG4gICAgICAgICAgICAgIG9wZXJhdGlvbi4gT3RoZXJ3aXNlLCB0aGVzZSBtZXRob2RzIGNvcnJlc3BvbmQgdG8gYFNjb3BlZFRyYW5zYWN0aW9uYCBtZXRob2RzLiAqL1xuXG4gICAgICAgICAgLyoqIFNjb3BlZFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihwYXRoPScnOnN0cmluZywgY3Vyc29yPXVuZGVmaW5lZDpDdXJzb3IpIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIHB1dDogbnVsbHxmdW5jdGlvbihwYXRoPScnOnN0cmluZywgdmFsdWU6anNvbikgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgaW5zZXJ0OiBudWxsfGZ1bmN0aW9uKHBhdGg9Jyc6c3RyaW5nLCB2YWx1ZTpqc29uKSAtPiBTY29wZWRUcmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBhcHBlbmQ6IG51bGx8ZnVuY3Rpb24ocGF0aD0nJzpzdHJpbmcsIHZhbHVlOmpzb24pIC0+IFNjb3BlZFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgICAgIGRlbGV0ZTogbnVsbHxmdW5jdGlvbihwYXRoPScnOnN0cmluZykgLT4gU2NvcGVkVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgdGhlbjogZnVuY3Rpb24oY2FsbGJhY2s6ZnVuY3Rpb24odGhpczpTY29wZWRUcmFuc2FjdGlvbiwganNvbnx1bmRlZmluZWQsIC4uLikpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIEFsbCBtZXRob2RzIGV4Y2VwdCBgdGhlbmAgYXJlIGNoYWluYWJsZSBhbmQgZXhlY3V0ZSBvbiB0aGUgc2FtZSB0cmFuc2FjdGlvbiBpbiBwYXJhbGxlbC4gSWYgdGhlXG4gICAgICAgICAgICAgIHRyYW5zYWN0aW9uIGlzIG5vdCB3cml0YWJsZSwgYHB1dGAsIGBpbnNlcnRgLCBgYXBwZW5kYCwgYW5kIGBkZWxldGVgIGFyZSBudWxsLlxuICAgICAgICAgICAgICAgYHBhdGhgIGlzIGEgYC9gLXNlcGFyYXRlZCBzdHJpbmcgb2YgYXJyYXkgaW5kaWNlcyBhbmQgYGVuY29kZVVSSUNvbXBvbmVudGAtZW5jb2RlZCBvYmplY3Qga2V5cyBkZW5vdGluZ1xuICAgICAgICAgICAgICB0aGUgcGF0aCB0byB0aGUgZGVzaXJlZCBlbGVtZW50IHdpdGhpbiB0aGUgb2JqZWN0IHN0b3JlJ3MganNvbiBkYXRhIHN0cnVjdHVyZTsgZS5nLlxuICAgICAgICAgICAgICBgJ3VzZXJzLzEyMy9maXJzdE5hbWUnYC4gSWYgdW5kZWZpbmVkLCBgY3Vyc29yYCBidWZmZXJzIGFsbCBkYXRhIGF0IHRoZSByZXF1ZXN0ZWQgcGF0aCBhcyB0aGUgcmVzdWx0IG9mIGFcbiAgICAgICAgICAgICAgYGdldGAgb3BlcmF0aW9uLiBgaW5zZXJ0YCB3aWxsIHNwbGljZSB0aGUgZ2l2ZW4gYHZhbHVlYCBpbnRvIHRoZSBwYXJlbnQgYXJyYXkgYXQgdGhlIHNwZWNpZmllZCBwb3NpdGlvbixcbiAgICAgICAgICAgICAgc2hpZnRpbmcgYW55IHN1YnNlcXVlbnQgZWxlbWVudHMgZm9yd2FyZC5cbiAgICAgICAgICAgICAgIFdoZW4gYWxsIHBlbmRpbmcgb3BlcmF0aW9ucyBjb21wbGV0ZSwgYGNhbGxiYWNrYCBpcyBjYWxsZWQgd2l0aCB0aGUgcmVzdWx0IG9mIGVhY2ggcXVldWVkIG9wZXJhdGlvbiBpblxuICAgICAgICAgICAgICBvcmRlci4gTW9yZSBvcGVyYXRpb25zIGNhbiBiZSBxdWV1ZWQgb250byB0aGUgc2FtZSB0cmFuc2FjdGlvbiBhdCB0aGF0IHRpbWUgdmlhIGB0aGlzYC5cbiAgICAgICAgICAgICAgIFJlc3VsdHMgZnJvbSBgcHV0YCwgYGluc2VydGAsIGBhcHBlbmRgLCBhbmQgYGRlbGV0ZWAgYXJlIGVycm9yIHN0cmluZ3Mgb3IgdW5kZWZpbmVkIGlmIHN1Y2Nlc3NmdWwuIGBnZXRgXG4gICAgICAgICAgICAgIHJlc3VsdHMgYXJlIGpzb24gZGF0YSBvciB1bmRlZmluZWQgaWYgbm8gdmFsdWUgZXhpc3RzIGF0IHRoZSByZXF1ZXN0ZWQgcGF0aC4gKi9cblxuICAgICAgICAgIC8qKiBDdXJzb3I6IGZ1bmN0aW9uKHBhdGg6W3N0cmluZ3xudW1iZXIsIC4uLl0sIGFycmF5OmJvb2xlYW4pIC0+IGJvb2xlYW58QWN0aW9ufHtcbiAgICAgICAgICAgICAgICBsb3dlckJvdW5kPW51bGw6IHN0cmluZ3xudW1iZXIsXG4gICAgICAgICAgICAgICAgbG93ZXJFeGNsdXNpdmU9ZmFsc2U6IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgdXBwZXJCb3VuZD1udWxsOiBzdHJpbmd8bnVtYmVyLFxuICAgICAgICAgICAgICAgIHVwcGVyRXhjbHVzaXZlPWZhbHNlOiBib29sZWFuLFxuICAgICAgICAgICAgICAgIGRlc2NlbmRpbmc9ZmFsc2U6IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBBY3Rpb25cbiAgICAgICAgICAgICAgfSAqL1xuXG4gICAgICAgICAgLyoqIEFjdGlvbjpmdW5jdGlvbihrZXk6c3RyaW5nfG51bWJlcikgLT4gdW5kZWZpbmVkfHN0cmluZ1xuICAgICAgICAgICAgICAgYEN1cnNvcmAgaXMgYSBmdW5jdGlvbiBjYWxsZWQgZm9yIGVhY2ggYXJyYXkgb3Igb2JqZWN0IGVuY291bnRlcmVkIGluIHRoZSByZXF1ZXN0ZWQganNvbiBzdHJ1Y3R1cmUuIEl0IGlzXG4gICAgICAgICAgICAgIGNhbGxlZCB3aXRoIGEgYHBhdGhgIGFycmF5IChvZiBzdHJpbmdzIGFuZC9vciBudW1lcmljIGluZGljZXMpIHJlbGF0aXZlIHRvIHRoZSByZXF1ZXN0ZWQgcGF0aCAoaS5lLiBgW11gXG4gICAgICAgICAgICAgIHJlcHJlc2VudHMgdGhlIHBhdGggYXMgcmVxdWVzdGVkIGluIGBnZXRgKSBhbmQgYW4gYGFycmF5YCBib29sZWFuIHRoYXQgaXMgdHJ1ZSBpZiB0aGUgc3Vic3RydWN0dXJlIGlzIGFuXG4gICAgICAgICAgICAgIGFycmF5LiBJdCByZXR1cm5zIGFuIGBBY3Rpb25gIGNhbGxiYWNrIG9yIG9iamVjdCB3aXRoIGEgcmFuZ2UgYW5kIGBhY3Rpb25gLCBvciBmYWxzZSB0byBwcmV2ZW50XG4gICAgICAgICAgICAgIHJlY3Vyc2lvbiBpbnRvIHRoZSBzdHJ1Y3R1cmUuIGBsb3dlckJvdW5kYCBhbmQgYHVwcGVyQm91bmRgIHJlc3RyaWN0IHRoZSBrZXlzL2luZGljZXMgdHJhdmVyc2VkIGZvciB0aGlzXG4gICAgICAgICAgICAgIG9iamVjdC9hcnJheSwgYW5kIHRoZSBgQWN0aW9uYCBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBlYWNoIGBrZXlgIGluIHRoZSByZXF1ZXN0ZWQgcmFuZ2UsIGluIG9yZGVyLiBUaGVcbiAgICAgICAgICAgICAgYEFjdGlvbmAgY2FsbGJhY2sgY2FuIG9wdGlvbmFsbHkgcmV0dXJuIGVpdGhlciBgJ3NraXAnYCBvciBgJ3N0b3AnYCB0byBleGNsdWRlIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlblxuICAgICAgICAgICAgICBrZXkgZnJvbSB0aGUgc3RydWN0dXJlIG9yIHRvIGV4Y2x1ZGUgYW5kIHN0b3AgaXRlcmF0aW5nLCByZXNwZWN0aXZlbHkuXG4gICAgICAgICAgICAgICBGb3IgZXhhbXBsZSwgdGhlIGZvbGxvd2luZyBjYWxsIHVzZXMgYSBjdXJzb3IgdG8gZmV0Y2ggb25seSB0aGUgaW1tZWRpYXRlIG1lbWJlcnMgb2YgdGhlIG9iamVjdCBhdCB0aGVcbiAgICAgICAgICAgICAgcmVxdWVzdGVkIHBhdGguIE9iamVjdCBhbmQgYXJyYXkgdmFsdWVzIHdpbGwgYmUgZW1wdHk6XG4gICAgICAgICAgICAgIGBkYi5nZXQoJ3BhdGgvdG8vb2JqZWN0JywgZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhcGF0aC5sZW5ndGg7XG4gICAgICAgICAgICAgIH0pO2BcbiAgICAgICAgICAgICAgIFRoZSBmb2xsb3dpbmcgY2FsbCB3aWxsIGdldCBpbW1lZGlhdGUgbWVtYmVycyBvZiB0aGUgcmVxdWVzdGVkIG9iamVjdCBzb3J0ZWQgbGV4aWNvZ3JhcGhpY2FsbHkgKGJ5IGNvZGVcbiAgICAgICAgICAgICAgdW5pdCB2YWx1ZSkgdXAgdG8gYW5kIGluY2x1ZGluZyBrZXkgdmFsdWUgYCdjJ2AsIGJ1dCBleGNsdWRpbmcga2V5IGAnYWJjJ2AgKGlmIGFueSk6XG4gICAgICAgICAgICAgIGBkYi5nZXQoJ3BhdGgvdG8vb2JqZWN0JywgZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA/IGZhbHNlIDoge1xuICAgICAgICAgICAgICAgICAgdXBwZXJCb3VuZDogJ2MnLFxuICAgICAgICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PSAnYWJjJykgcmV0dXJuICdza2lwJztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9KTtgICovXG4gICAgICAgICAgcmV0dXJuIHNlbGYgPSBBcnJheS5pc0FycmF5KHN0b3JlcykgPyB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldChzdG9yZSwgcGF0aCwgY3Vyc29yKSB7XG4gICAgICAgICAgICAgIHRyYW5zLmdldChzdG9yZSwgcGF0aCwgY3Vyc29yKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHV0OiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHN0b3JlLCBwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5wdXQoc3RvcmUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5zZXJ0OiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHN0b3JlLCBwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5wdXQoc3RvcmUsIHBhdGgsIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXBwZW5kOiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHN0b3JlLCBwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5hcHBlbmQoc3RvcmUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmVtb3ZlZCB0byBhdm9pZCBlcnJvciB3aXRoIGdydW50XG4gICAgICAgICAgICAvLyBkZWxldGU6ICF3cml0YWJsZSA/IG51bGwgOiBmdW5jdGlvbihzdG9yZSwgc3RvcmUsIHBhdGgpIHtcbiAgICAgICAgICAgIC8vICAgdHJhbnMuZGVsZXRlKHN0b3JlLCBzdG9yZSwgcGF0aCk7XG4gICAgICAgICAgICAvLyAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHRoZW46IGZ1bmN0aW9uIHRoZW4oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQocGF0aCwgY3Vyc29yKSB7XG4gICAgICAgICAgICAgIHRyYW5zLmdldChzdG9yZXMsIHBhdGgsIGN1cnNvcik7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHB1dDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5wdXQoc3RvcmVzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluc2VydDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5wdXQoc3RvcmVzLCBwYXRoLCB2YWx1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFwcGVuZDogIXdyaXRhYmxlID8gbnVsbCA6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkge1xuICAgICAgICAgICAgICB0cmFucy5hcHBlbmQoc3RvcmVzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdkZWxldGUnOiAhd3JpdGFibGUgPyBudWxsIDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgICAgICAgdHJhbnNbJ2RlbGV0ZSddKHN0b3JlcywgcGF0aCk7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRoZW46IGZ1bmN0aW9uIHRoZW4oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgY2IgPSBjYWxsYmFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldChwYXRoLCB3cml0YWJsZSwgY3Vyc29yLCBzdG9yZSkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnRyYW5zYWN0aW9uKHdyaXRhYmxlLCBzdG9yZSkuZ2V0KHBhdGgsIGN1cnNvcik7XG4gICAgICAgIH0sXG4gICAgICAgIHB1dDogZnVuY3Rpb24gcHV0KHBhdGgsIHZhbHVlLCBzdG9yZSkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnRyYW5zYWN0aW9uKHRydWUsIHN0b3JlKS5wdXQocGF0aCwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBpbnNlcnQ6IGZ1bmN0aW9uIGluc2VydChwYXRoLCB2YWx1ZSwgc3RvcmUpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi50cmFuc2FjdGlvbih0cnVlLCBzdG9yZSkuaW5zZXJ0KHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZW5kOiBmdW5jdGlvbiBhcHBlbmQocGF0aCwgdmFsdWUsIHN0b3JlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudHJhbnNhY3Rpb24odHJ1ZSwgc3RvcmUpLmFwcGVuZChwYXRoLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgICdkZWxldGUnOiBmdW5jdGlvbiBfZGVsZXRlKHBhdGgsIHN0b3JlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudHJhbnNhY3Rpb24odHJ1ZSwgc3RvcmUpWydkZWxldGUnXShwYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICAgIGlmIChkYikge1xuICAgICAgICAgICAgZGIuY2xvc2UoKTtcbiAgICAgICAgICAgIGRiID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2Nsb3NlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICAnZGVsZXRlJzogZnVuY3Rpb24gX2RlbGV0ZShkYXRhYmFzZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRhdGFiYXNlKTtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY2FsbGJhY2soZS50YXJnZXQuZXJyb3IsIGZhbHNlKTtcbiAgICAgIH07XG4gICAgICByZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH0sXG4gICAgbGlzdDogZnVuY3Rpb24gbGlzdChjYWxsYmFjaykge1xuICAgICAgaW5kZXhlZERCLndlYmtpdEdldERhdGFiYXNlTmFtZXMoKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBjYWxsYmFjayhlLnRhcmdldC5yZXN1bHQpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdERCO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b2JqZWN0ZGIuanMubWFwXG4iLCIndXNlIHN0cmljdCc7XG52YXIgb2JqZWN0REIgPSByZXF1aXJlKCcuL29iamVjdGRiLmpzJyk7XG5cbnZhciB2ZXJzaW9uID0gMTtcbnZhciBsb2dnaW5nID0gdHJ1ZTtcblxudmFyIGxvZyA9IGZ1bmN0aW9uIGxvZygpIHtcbiAgaWYgKGxvZ2dpbmcpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59O1xudmFyIHVzZXJJZDtcbnZhciBzZXNzaW9uVG9rZW47XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignaW5zdGFsbCcsIGZ1bmN0aW9uIChlKSB7XG4gIC8vQXV0b21hdGljYWxseSB0YWtlIG92ZXIgdGhlIHByZXZpb3VzIHdvcmtlci5cbiAgZS53YWl0VW50aWwoc2VsZi5za2lwV2FpdGluZygpKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgZnVuY3Rpb24gKGUpIHtcbiAgbG9nKCdBY3RpdmF0ZWQgU2VydmljZVdvcmtlciB2ZXJzaW9uOiAnICsgdmVyc2lvbik7XG59KTtcblxuLy9IYW5kbGUgdGhlIHB1c2ggcmVjZWl2ZWQgZXZlbnQuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ3B1c2gnLCBmdW5jdGlvbiAoZSkge1xuICBsb2coJ3B1c2ggbGlzdGVuZXInLCBlKTtcbiAgZS53YWl0VW50aWwobmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGdldE5vdGlmaWNhdGlvbnMoZnVuY3Rpb24gKG5vdGlmaWNhdGlvbnMpIHtcbiAgICAgIC8vIFRoaXMgaXMgYXN5bmMgc28gcmVzb2x2ZSBvbmNlIGl0J3MgZG9uZSBhbmQgdGhlIG5vdGlmaWNhdGlvbnMgYXJlIHNob3dpbmdcbiAgICAgIHNob3dOb3RpZmljYXRpb25zSWZOb3RTaG93blByZXZpb3VzbHkobm90aWZpY2F0aW9ucywgcmVzb2x2ZSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgfSk7XG4gIH0pKTtcbn0pO1xuXG5mdW5jdGlvbiBnZXROb3RpZmljYXRpb25zKHJlc29sdmUsIHJlamVjdCkge1xuICAvLyBHZXQgdGhlIHNlc3Npb24gdG9rZW5zIGV0YyBmcm9tIElEQlxuICB2YXIgZGIgPSBvYmplY3REQi5vcGVuKCdkYi0xJyk7XG4gIGRiLmdldCgpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgc2Vzc2lvblRva2VuID0gZGF0YS5zZXNzaW9uVG9rZW47XG4gICAgdmFyIHVzZXJJZCA9IGRhdGEudXNlcklkO1xuICAgIGlmIChzZXNzaW9uVG9rZW4gPT0gdW5kZWZpbmVkIHx8IHVzZXJJZCA9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciB3YXMgbm90IGxvZ2dlZCBpbi4gQ2Fubm90IHJlcXVlc3Qgbm90aWZpY2F0aW9ucy4nKTtcbiAgICB9XG4gICAgc2VsZi5yZWdpc3RyYXRpb24ucHVzaE1hbmFnZXIuZ2V0U3Vic2NyaXB0aW9uKCkudGhlbihmdW5jdGlvbiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHZhciBzdWJzY3JpcHRpb25JZCA9IHN1YnNjcmlwdGlvbi5zdWJzY3JpcHRpb25JZDtcbiAgICAgICAgZmV0Y2goJy8uLi92MS9ub3RpZmljYXRpb25zL2Zvci8nICsgc3Vic2NyaXB0aW9uSWQsIHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnU0VTU0lPTl9UT0tFTic6IHNlc3Npb25Ub2tlbixcbiAgICAgICAgICAgICdVU0VSX0lEJzogdXNlcklkXG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKGZ1bmN0aW9uICh0eHQpIHtcbiAgICAgICAgICAgIGxvZygnZmV0Y2hlZCBub3RpZmljYXRpb25zJywgdHh0KTtcbiAgICAgICAgICAgIHZhciBub3RpZmljYXRpb25zID0gSlNPTi5wYXJzZSh0eHQpO1xuICAgICAgICAgICAgcmVzb2x2ZShub3RpZmljYXRpb25zKTtcbiAgICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuICAgICAgICB9KVsnY2F0Y2gnXShyZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1dhcyBhc2tlZCB0byBnZXQgbm90aWZpY2F0aW9ucyBiZWZvcmUgYSBzdWJzY3JpcHRpb24gd2FzIGNyZWF0ZWQhJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbmNsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgbG9nKCdub3RpZmljYXRpb25jbGljayBsaXN0ZW5lcicsIGUpO1xuICBlLndhaXRVbnRpbChoYW5kbGVOb3RpZmljYXRpb25DbGljayhlKSk7XG59KTtcblxuLy9VdGlsaXR5IGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgY2xpY2tcbmZ1bmN0aW9uIGhhbmRsZU5vdGlmaWNhdGlvbkNsaWNrKGUpIHtcbiAgbG9nKCdOb3RpZmljYXRpb24gY2xpY2tlZDogJywgZS5ub3RpZmljYXRpb24pO1xuICBlLm5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuICByZXR1cm4gY2xpZW50cy5tYXRjaEFsbCh7XG4gICAgdHlwZTogJ3dpbmRvdycsXG4gICAgaW5jbHVkZVVuY29udHJvbGxlZDogZmFsc2VcbiAgfSlbJ2NhdGNoJ10oZnVuY3Rpb24gKGV4KSB7XG4gICAgY29uc29sZS5sb2coZXgpO1xuICB9KS50aGVuKGZ1bmN0aW9uIChjbGllbnRMaXN0KSB7XG4gICAgcmV0dXJuIGNsaWVudHMub3BlbldpbmRvdyhlLm5vdGlmaWNhdGlvbi51cmwpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2hvd05vdGlmaWNhdGlvbnNJZk5vdFNob3duUHJldmlvdXNseShub3RpZmljYXRpb25zLCBzdWNjZXNzKSB7XG4gIHZhciBkYiA9IG9iamVjdERCLm9wZW4oJ2RiLTEnKTtcbiAgZGIuZ2V0KCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdkYXRhJywgZGF0YSk7XG4gICAgaWYgKGRhdGEubm90aWZpY2F0aW9uSWRzID09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc29sZS5sb2coJ2RhdGEubm90aWZpY2F0aW9uSWRzIHdhcyBibGFuaycpO1xuICAgICAgZGF0YS5ub3RpZmljYXRpb25JZHMgPSBbXTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub3RpZmljYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbm90ZSA9IG5vdGlmaWNhdGlvbnNbaV07XG4gICAgICBpZiAoZGF0YS5ub3RpZmljYXRpb25JZHMuaW5kZXhPZihub3RlLmlkKSA8IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hhdmVudCBzaG93biBub3RlICcgKyBub3RlLmlkICsgJyBiZWZvcmUnKTtcbiAgICAgICAgZGF0YS5ub3RpZmljYXRpb25JZHMucHVzaChub3RlLmlkKTtcbiAgICAgICAgc2hvd05vdGlmaWNhdGlvbihub3RlLnRpdGxlLCBub3RlLmJvZHksIG5vdGUudXJsLCBub3RlLmljb24sIG5vdGUuaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3dlIHNob3dlZCBub3RlICcgKyBub3RlLmlkICsgJyBwcmV2aW91c2x5IHNvIHNraXAgaXQnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGIucHV0KCdub3RpZmljYXRpb25JZHMnLCBkYXRhLm5vdGlmaWNhdGlvbklkcyk7XG4gICAgc3VjY2VzcygpO1xuICB9KTtcbn1cblxuLy9VdGlsaXR5IGZ1bmN0aW9uIHRvIGFjdHVhbGx5IHNob3cgdGhlIG5vdGlmaWNhdGlvbi5cbmZ1bmN0aW9uIHNob3dOb3RpZmljYXRpb24odGl0bGUsIGJvZHksIHVybCwgaWNvbiwgdGFnKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIGJvZHk6IGJvZHksXG4gICAgdGFnOiB0YWcsXG4gICAgLy8gbGFuZzogJ3Rlc3QgbGFuZycsXG4gICAgaWNvbjogaWNvbixcbiAgICBkYXRhOiB7IHVybDogdXJsIH0sXG4gICAgdmlicmF0ZTogMTAwMCxcbiAgICBub3NjcmVlbjogZmFsc2VcbiAgfTtcbiAgaWYgKHNlbGYucmVnaXN0cmF0aW9uICYmIHNlbGYucmVnaXN0cmF0aW9uLnNob3dOb3RpZmljYXRpb24pIHtcbiAgICAvLyBUT0RPOiBlbnN1cmUgdGhpcyB3b3JrcyBhZnRlciB0aGUgcGFnZSBpcyBjbG9zZWRcbiAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zaG93Tm90aWZpY2F0aW9uKHRpdGxlLCBvcHRpb25zKTtcbiAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3cuanMubWFwXG4iXX0=
