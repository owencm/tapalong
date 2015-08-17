var twoDigitString = function (digit) {
  return (digit < 10) ? '0' + digit : '' + digit;
}

var getDateString = function (dateTime) {
  return [(1900 + dateTime.getYear()),twoDigitString(dateTime.getMonth()+1),twoDigitString(dateTime.getDate())].join('-');
}

var view = (function (models) {
  var STATE = {add: 0, list: 1, detail: 2, edit: 3, loggedOut: 4, uninitialized: 5, notificationsOptIn: 6};
  var currentState = STATE.uninitialized;
  var selectedActivity;
  var changeState = function (newState, options, userTriggered) {
    console.log('Changing state to '+newState);
    var lastState = currentState;
    if (lastState == STATE.loggedOut) {
      showHeader();
      hideLogin();
    }
    currentState = newState;
    if (currentState == STATE.list) {
      hideBackButton();
      setTitle('Upcoming Plans');
      hideDetails();
      hideNotificationOptIn();
      redrawActivitiesList();
      showActivitiesList();
      if (userTriggered) {
        // Disabled due to http://crbug.com/459240
        // history.pushState({state: STATE.list}, 'Upcoming Plans');
      }
      if (models.activities.getActivitiesCount() > 0) {
        hideNoActivitiesCard();
        hideCreateActivityForm();
        showAddButton();
      } else {
        showNoActivitiesCard();
        showCreateActivityForm();
        hideAddButton();
      }
    } else if (currentState == STATE.add) {
      setTitle('Create');
      hideAddButton();
      hideActivitiesList();
      hideDetails();
      showCreateActivityForm();
      showBackButton();
      if (userTriggered) {
        // history.pushState({state: STATE.add}, 'Create a plan');
      }
    } else if (currentState == STATE.edit) {
      setTitle('Edit');
      hideAddButton();
      hideActivitiesList();
      hideDetails();
      showCreateActivityForm();
      showBackButton();
      if (userTriggered) {
        // history.pushState({state: STATE.edit}, 'Edit plan');
      }
    } else if (currentState == STATE.detail) {
      setTitle('View details');
      hideCreateActivityForm();
      hideAddButton();
      hideActivitiesList();
      hideNotificationOptIn();
      showBackButton();
      showDetails();
      if (userTriggered) {
        // history.pushState({state: STATE.detail}, 'View details');
      }
    } else if (currentState == STATE.loggedOut) {
      // TODO: Move this state to within the model
      hideHeader();
      hideAddButton();
      hideNoActivitiesCard();
      showLogin();
    } else if (currentState == STATE.notificationsOptIn) {
      setTitle('Stay up to date');
      hideNoActivitiesCard();
      showNotificationOptIn(options.reason, options.nextState);
      hideDetails();
      hideActivitiesList();
      hideCreateActivityForm();
    } else {
      throw('Unknown state');
    }
  };
  window.addEventListener('popstate', function(e) {
    console.log('User pressed back, popping a state');
    console.log(e);
    if (e.state !== null && e.state.state !== undefined) {
      console.log('Moving back in history to state '+e.state.state);
      changeState(e.state.state, {}, false);
    } else {
      // Note safari calls popstate on page load so this is expected
      console.log('Uh oh, no valid state in history to move back to');
    }
  });

  var activitiesSection = document.querySelector('section#activitiesList');
  var detailSection = document.querySelector('section#activityDetails');
  var editSection = document.querySelector('section#editActivity');
  var addButton = document.querySelector('#addButton');
  var backButton = document.querySelector('#backButton');
  var title = document.querySelector('#title');
  var noActivitiesCard = document.querySelector('#noActivitiesCard');
  var notificationsOptInSection = document.querySelector('section#notificationsOptIn');
  var permissionOverlay = document.querySelector('div#permissionOverlay');
  var setTitle = function (newTitle) {
    title.innerHTML = newTitle;
  };
  var showHeader = function () {
    var headerElem = document.querySelector('header');
    headerElem.style.display = '';
  };
  var hideHeader = function () {
    var headerElem = document.querySelector('header');
    headerElem.style.display = 'none';
  };
  var showLogin = function () {
    var loginElem = document.querySelector('#login');
    loginElem.style.display = '';
  };
  var hideLogin = function () {
    var loginElem = document.querySelector('#login');
    loginElem.style.display = 'none';
  };
  var showBackButton = function () {
    backButton.style.display = '';
  };
  var hideBackButton = function () {
    backButton.style.display = 'none';
  };
  var showCreateActivityForm = function () {
    var source = document.querySelector('#edit-activity-template').innerHTML;
    var template = Handlebars.compile(source);
    var config = {name: models.user.getUserName};
    var today = new Date;
    config.todaysDate = getDateString(today);
    var tomorrow = Date.today().add(1).days()
    config.tomorrowsDate = getDateString(tomorrow);
    config.nextWeeksDate = getDateString(Date.today().add(14).days());
    // Add extra data needed to render
    if (currentState == STATE.edit) {
      // Get the selected activity if we're editing
      var activity = models.activities.getActivity(selectedActivity);
      config.activity = activity;
      var dateTime = activity.start_time;
      if (!dateTime instanceof Date) {
        alert('An error occurred! Sorry :(. Please refresh.');
        throw("start_time should be a Date but it was a string!");
      }
      var timeString = twoDigitString(dateTime.getHours()) + ':' + twoDigitString(dateTime.getMinutes());
      var dateString = getDateString(dateTime);
      config.activityExtras = {time: timeString, date: dateString};
      config.editing = true;
    }

    editSection.innerHTML = template(config);

    // Make the textarea autoresize
    var descriptionInputElem = editSection.querySelector('textarea#description');
    function delayedResize (elem) {
      return function () {
        window.setTimeout(function () {
          elem.style.height = 'auto';
          elem.style.height = elem.scrollHeight+'px';
       }, 0);
      }
    }
    var delayedResizeInstance = delayedResize(descriptionInputElem);
    delayedResizeInstance();
    descriptionInputElem.addEventListener('change',  delayedResizeInstance);
    descriptionInputElem.addEventListener('cut',     delayedResizeInstance);
    descriptionInputElem.addEventListener('paste',   delayedResizeInstance);
    descriptionInputElem.addEventListener('drop',    delayedResizeInstance);
    descriptionInputElem.addEventListener('keydown', delayedResizeInstance);

    // Add interactivity
    var titleInputElem = editSection.querySelector('input#title');
    if (currentState == STATE.edit) {
      editSection.querySelector('.option.cancel').onclick = function () {
        if (confirm('This will notify everyone coming that the event is cancelled and remove it from the app. Confirm?')) {
          this.classList.add('disabled');
          models.activities.tryCancelActivity(activity, function () {
            changeState(STATE.list, {}, true);
          }, function () {
            alert('An error occurred! Sorry :(. Please refresh.');
            throw("Cancelling on server failed. Help the user understand why");
          });
        } else {
          // Do nothing
        }
      }
    } else if (currentState == STATE.add) {
      // Why this needs a timeout is totally beyond me
      setTimeout(function() {
        titleInputElem.focus();
        titleInputElem.scrollIntoView();
      },0);
    }

    titleInputElem.addEventListener('keydown', function(key) {
      if (key.keyCode == 13) {
        this.blur();
      }
    });

    editSection.querySelector('.option.save').onclick = function () {
      var thisButton = this;
      thisButton.classList.add('disabled');
      thisButton.innerHTML = 'Saving...';
      var title = editSection.querySelector('input#title').value;
      var description = editSection.querySelector('textarea#description').value;
      // date assumes the input was in GMT and then converts to local time
      var date = editSection.querySelector('input#date').valueAsDate;
      var dateTime = new Date(date);
      console.log('DateTime created in the form is ',dateTime);
      // Make a timezone adjustment
      dateTime.addMinutes(dateTime.getTimezoneOffset());
      var time = editSection.querySelector('input#time').value.split(':');
      dateTime.setHours(time[0]);
      dateTime.setMinutes(time[1]);
      console.log('DateTime created in the form is ',dateTime);
      var activityChanges = {title: title, description: description, start_time: dateTime};
      if (currentState == STATE.edit) {
        var activity = models.activities.getActivity(selectedActivity);
        console.log(activity);
        models.activities.tryUpdateActivity(activity, activityChanges, function () {
          swLibrary.hasPushNotificationPermission(function() {
            changeState(STATE.list, {}, true);
          }, function () {
            changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
          });
        }, function () {
          alert('An error occurred! Sorry :(. Please refresh.');
          throw('Editing the activity failed. Help the user understand why.');
        });
      } else {
        var newActivity = {title: title, start_time: dateTime, location: '', max_attendees: -1, description: description};
        models.activities.tryCreateActivity(newActivity, function () {
          swLibrary.hasPushNotificationPermission(function() {
            changeState(STATE.list, {}, true);
          }, function () {
            changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
          });
        }, function () {
          // thisButton.classList.toggle('disabled', false);
          alert('Sorry, something went wrong. Please check you entered the information correctly.');
          throw("Adding to server failed. Help the user understand why");
        });
      }
    }
    editSection.style.display = '';
  };
  var hideCreateActivityForm = function () {
    editSection.style.display = 'none';
  }
  var showDetails = function () {
    // Todo: check selected activity still exists (rather, do this whenever shit changes)
    if (selectedActivity === undefined) {
      throw 'No activity selected';
    };
    var source = document.querySelector('#activity-details-template').innerHTML;
    var template = Handlebars.compile(source);
    var activity = models.activities.getActivity(selectedActivity);
    var config = {activity: activity, hasAttendees: activity.attendees.length > 0, hasDescription: activity.description !== '', descriptionLines: activity.description.split('\n')};
    detailSection.innerHTML = template(config);
    detailSection.querySelector('.option').onclick = function (e) {
      // Creators edit, non creators attend
      if (activity.is_creator) {
        selectedActivity = activity.id;
        changeState(STATE.edit, {}, true);
      } else {
        // Note no callback since the list will automatically redraw when this changes
        var optimistic = activity.dirty == undefined;
        models.activities.trySetAttending(activity, !activity.is_attending, optimistic, function () {
          console.log('Request to attending was a success');
        }, function () {
          console.log('Uhoh, an optimistic error was a mistake!!');
          alert('An unexpected error occurred. Please refresh.');
        });
      }
      this.classList.add('disabled');
      e.stopPropagation();
    }
    detailSection.style.display = '';
  }
  var redrawDetails = showDetails;
  var hideDetails = function () {
    detailSection.style.display = 'none';
  }
  var showNotificationOptIn = function (reason, nextState) {
    // TODO(owencm): Show something different if the notification permission is denied
    var source = document.querySelector('#notifications-opt-in-template').innerHTML;
    var template = Handlebars.compile(source);
    var config = {reason: reason};
    notificationsOptInSection.innerHTML = template(config);
    notificationsOptInSection.style.display = '';
    // Add interactivity
    notificationsOptInSection.querySelector('.option').onclick = function (e) {
      showOverlay();
      this.classList.add('disabled');
      e.stopPropagation();
      setTimeout(function() {
        swLibrary.requestPushNotificationPermissionAndSubscribe(function (userChoice) {
          hideOverlay();
          if (userChoice == 'granted') {
            changeState(nextState);
          } else {
            alert('You denied the permission, you naughty person.')
          }
          // TODO Handle rejection or error case
        });
      }, 300);
    }
  }
  var hideNotificationOptIn = function () {
    notificationsOptInSection.style.display = 'none';
  }
  var showAddButton = function () {
    addButton.style.display = '';
  }
  var hideAddButton = function () {
    addButton.style.display = 'none';
  }
  var showNoActivitiesCard = function () {
    noActivitiesCard.style.display = '';
  };
  var hideNoActivitiesCard = function () {
    noActivitiesCard.style.display = 'none';
  };
  var showActivitiesList = function () {
    activitiesSection.style.display = '';
  };
  var hideActivitiesList = function () {
    activitiesSection.style.display = 'none';
  };
  var showOverlay = function  () {
    permissionOverlay.style.display = '';
    permissionOverlay.offsetTop;
    permissionOverlay.style.opacity = 1;
  };
  var hideOverlay = function () {
    permissionOverlay.style.display = 'none';
    permissionOverlay.offsetTop;
    permissionOverlay.style.opacity = 0;
  };
  var redrawCurrentView = function () {
    if (currentState == STATE.list) {
      redrawActivitiesList();
    } else if (currentState == STATE.detail) {
      redrawDetails();
    }
  };
  var redrawActivitiesList = function () {
    var ActivityBox = React.createClass({displayName: "ActivityBox",
      render: function() {
        var activity = this.props.activity;
        var actionType = activity.is_creator ? 'edit' : 'attend';
        var actionString = activity.is_creator ? 'Edit' : (activity.is_attending ? 'Cancel attending' : 'Go along');
        return (
          React.createElement("section", {class:  activity.is_attending ? 'card attending' : 'card'}, 
            React.createElement("div", {class: "contentContainer"}, 
              React.createElement("img", {src: "{ activity.thumbnail }", class: "friendIcon"}), 
              React.createElement("div", {class: "cardTitleContainer"}, 
                activity.is_creator ? (
                  React.createElement("span", null, React.createElement("b", null, "You"), " are")
                ) : (
                  React.createElement("span", null, React.createElement("b", null, activity.creator_name), " is")
                ), " ", React.createElement("b", null, activity.title), " ", activity.start_time
              )
            ), 
            React.createElement("div", {class: "optionContainer"}, 
              React.createElement("div", {class: "option right {actionType}"}, 
                actionString
              )
            ), 
            React.createElement("div", {class: "clear"})
          )
        );
      }
    });
    var ActivityList = React.createClass({displayName: "ActivityList",
      render: function () {
        var activitiesList = models.activities.getActivities().map(function (activity) {
          // TODO: do me properly somehow
          activity.key = activity.id;
          return React.createElement(ActivityBox, {activity: activity});
        });
        return (
          React.createElement("div", null, 
            activitiesList
          )
        );
      }
    });
    console.log(React.render(
      React.createElement(ActivityList, null),
      document.getElementById('activitiesList')
    ));
    // var source = document.querySelector('#activity-summary-template').innerHTML;
    // var template = Handlebars.compile(source);
    // activitiesSection.innerHTML = '';
    // models.activities.getActivities().map(function (activity) {
    //   var config = {activity: activity};
    //   var activityHTML = template(config);
    //   activitiesSection.insertAdjacentHTML('beforeend', activityHTML);
    //   // Make this specific to each activity
    //   var activityElem = document.querySelector('#activity-'+activity.id);
    //   activityElem.onclick = function () {
    //     selectedActivity = activity.id;
    //     changeState(STATE.detail, {}, true);
    //   };
    //   activityElem.querySelector('.option').onclick = function (e) {
    //     // Creators edit, non creators attend
    //     if (activity.is_creator) {
    //       selectedActivity = activity.id;
    //       changeState(STATE.edit, {}, true);
    //     } else {
    //       // Optimistically move onto the next page
    //       if (!activity.is_attending) {
    //         swLibrary.hasPushNotificationPermission(function(){}, function() {
    //           changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'if the plan changes'}, false);
    //         });
    //       }
    //       // Note no callback since the list will automatically redraw when this changes
    //       var optimistic = activity.dirty == undefined;
    //       models.activities.trySetAttending(activity, !activity.is_attending, optimistic, function () {}, function () {
    //         console.log('Uhoh, an optimistic error was a mistake!!');
    //         alert('An unexpected error occurred. Please refresh.');
    //       });
    //       // If the user is opting in, show them the prompt
    //     }
    //     this.classList.add('disabled');
    //     e.stopPropagation();
    //   }
    //   if (activity.is_attending) {
    //     activityElem.classList.add('attending');
    //   }
    // });
  };
  var setLoginButtonCallback = function (callback) {
    var loginElem = document.querySelector('#login');
    loginElem.onclick = callback;
  };
  var appLoginSuccess = function (userId, userName, sessionToken) {
    models.user.setUserName(userName);
    models.user.setUserId(userId);
    models.user.setSessionToken(sessionToken);
    // TODO: Change to the list before we even have the activities to avoid an extra RTT on first load
    models.activities.tryRefreshActivities(function () {
      changeState(STATE.list, {}, true);
    }, function () {
      console.log('Failed to download activities')
    });
  };
  var fbLoginSuccess = function (fbToken) {
    models.startLogin(fbToken, appLoginSuccess, function () {
      throw('login to app failed');
    });
  };

  addButton.onclick = function () {
    changeState(STATE.add, {}, true);
  };
  backButton.onclick = function () {
    changeState(STATE.list, {}, true);
  };
  models.activities.addListener(redrawCurrentView);

  changeState(STATE.loggedOut, {}, false);

  return {
    setLoginButtonCallback: setLoginButtonCallback,
    fbLoginSuccess: fbLoginSuccess,
    debugSkipLogin: appLoginSuccess
  };
})(models);

var getDateTimeString = function (date) {
  var str = '';
  var today = Date.today();
  var tomorrow = Date.today().add(1).days();
  activityDateCopy = (new Date(date.getTime())).clearTime();
  if (activityDateCopy.equals(today)) {
    str += 'today';
  } else if (activityDateCopy.equals(tomorrow)) {
    str += 'tomorrow';
  } else {
    // alert(date.toLocaleString() + ' is '+ date.getDay());
    str += 'on ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }
  if (activityDateCopy.compareTo(today.add(7).days()) > 0) {
    str += ' ' + date.toString('MM/dd');
  }
  str += ' at ' + date.toString('HH');
  if (date.getMinutes !== 0) {
    str += date.toString(':mm');
  }
  return str;
}
Handlebars.registerHelper('datetimeString', function(start_time) {
  if (!start_time instanceof Date) {
    alert('An error occurred! Sorry :(. Please refresh.');
    throw("start_time was a string, not a Date in the template");
  }
  return start_time.toLocaleString().replace(/:00/g,'');
});
Handlebars.registerHelper('dateInString', function(start_time) {
  if (!start_time instanceof Date) {
    alert('An error occurred! Sorry :(. Please refresh.');
    throw("start_time was a string, not a Date in the template");
  }
  return getDateTimeString(start_time);
});
Handlebars.registerHelper('list', function(items, options) {
  var out = "<ul>";

  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<li>" + options.fn(items[i]) + "</li>";
  }

  return out + "</ul>";
});
