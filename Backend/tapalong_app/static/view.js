var twoDigitString = function (digit) {
  return (digit < 10) ? '0' + digit : '' + digit;
}

var getDateString = function (dateTime) {
  return [(1900 + dateTime.getYear()),twoDigitString(dateTime.getMonth()+1),twoDigitString(dateTime.getDate())].join('-');
}

var view = (function (models) {
  var STATE = {add: 0, list: 1, detail: 2, edit: 3, loggedOut: 4, uninitialized: 5};
  var currentState = STATE.uninitialized;
  var selectedActivity;
  var changeState = function (newState) {
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
      redrawActivitiesList();
      showActivitiesList();
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
    } else if (currentState == STATE.edit) {
      setTitle('Edit');
      hideAddButton();
      hideActivitiesList();
      hideDetails();
      showCreateActivityForm();
      showBackButton();      
    } else if (currentState == STATE.detail) {
      setTitle('View details');
      hideCreateActivityForm();
      hideAddButton();
      hideActivitiesList();
      showBackButton();
      showDetails();
    } else if (currentState == STATE.loggedOut) {
      hideHeader();
      hideAddButton();
      showLogin();
    } else {
      throw('Unknown state');
    }
  };
  var activitiesSection = document.querySelector('section#activitiesList');
  var detailSection = document.querySelector('section#activityDetails');
  var editSection = document.querySelector('section#editActivity');
  var addButton = document.querySelector('#addButton');
  var backButton = document.querySelector('#backButton');
  var title = document.querySelector('#title');
  var noActivitiesCard = document.querySelector('#noActivitiesCard');
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
    var config = {name: models.getUserName};
    var today = new Date;
    config.todaysDate = getDateString(today);
    var tomorrow = new Date;
    tomorrow.setTime(today.getTime() + 24 * 60 * 60 * 1000);
    config.tomorrowsDate = getDateString(tomorrow);
    config.nextWeeksDate = getDateString(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
    if (currentState == STATE.edit) {
      // Get the selected activity if we're editing
      var activity = models.activities.getActivity(selectedActivity);
      config.activity = activity;
      var dateTime = activity.start_time;
      if (!dateTime instanceof Date) {
        throw("start_time should be a Date but it was a string!");
      }
      var timeString = twoDigitString(dateTime.getHours()) + ':' + twoDigitString(dateTime.getMinutes());
      var dateString = getDateString(dateTime);
      config.activityExtras = {time: timeString, date: dateString};
      config.editing = true;
    }

    editSection.innerHTML = template(config);
    var titleInputElem = editSection.querySelector('input#title');

    if (currentState == STATE.edit) {
      editSection.querySelector('.option.cancel').onclick = function () {
        if (confirm('This will notify everyone coming that the event is cancelled and remove it from the app. Confirm?')) {
          this.classList.add('disabled');
          models.activities.tryCancelActivity(activity.activity_id, function () {
            changeState(STATE.list);
          }, function () {
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
      var title = editSection.querySelector('input#title').value;
      var date = editSection.querySelector('input#date').valueAsDate;
      var time = editSection.querySelector('input#time').value.split(':');
      var dateTime = new Date(date);
      dateTime.setHours(time[0]);
      dateTime.setMinutes(time[1]);
      var activityChanges = {title: title, start_time: dateTime};
      if (currentState == STATE.edit) {
        models.activities.tryUpdateActivity(selectedActivity, activityChanges, function () {
          changeState(STATE.list);
        }, function () {
          throw('Editing the activity failed. Help the user understand why.');
        });
      } else {
        var newActivity = {title: title, start_time: dateTime, location: '', max_attendees: -1, description: ''};
        this.classList.add('disabled');
        models.activities.tryCreateActivity(newActivity, function () {
          changeState(STATE.list);
        }, function () {
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
    console.log(activity);
    var config = {activity: activity, hasAttendees: activity.attendees.length > 0};
    detailSection.innerHTML = template(config);
    detailSection.querySelector('.option').onclick = function (e) {
      // Creators edit, non creators attend
      if (activity.is_creator) {
        selectedActivity = activity.activity_id;
        changeState(STATE.edit);
      } else {
        // Note no callback since the list will automatically redraw when this changes
        models.activities.trySetAttending(activity.activity_id, !activity.is_attending, function () {
        }, function () {
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
  }
  var hideActivitiesList = function () {
    activitiesSection.style.display = 'none';
  }
  var redrawCurrentView = function () {
    if (currentState == STATE.list) {
      redrawActivitiesList();
    } else if (currentState == STATE.detail) {
      redrawDetails();
    }
  }
  var redrawActivitiesList = function () {
    var source = document.querySelector('#activity-summary-template').innerHTML;
    var template = Handlebars.compile(source);
    activitiesSection.innerHTML = '';
    models.activities.getActivities().map(function (activity) {
      var config = {activity: activity};
      var activityHTML = template(config);
      activitiesSection.insertAdjacentHTML('beforeend', activityHTML);
      // Make this specific to each activity
      var activityElem = document.querySelector('#activity-'+activity.activity_id);
      activityElem.onclick = function () {
        selectedActivity = activity.activity_id;
        changeState(STATE.detail);
      };
      activityElem.querySelector('.option').onclick = function (e) {
        // Creators edit, non creators attend
        if (activity.is_creator) {
          selectedActivity = activity.activity_id;
          changeState(STATE.edit);
        } else {
          // Note no callback since the list will automatically redraw when this changes
          models.activities.trySetAttending(activity.activity_id, !activity.is_attending, function () {
          }, function () {
            alert('An unexpected error occurred. Please refresh.');
          });
        }
        this.classList.add('disabled');
        e.stopPropagation();
      }
      if (activity.is_attending) {
        activityElem.classList.add('attending');
      }
    });
  };
  var setLoginButtonCallback = function (callback) {
    var loginElem = document.querySelector('#login');
    loginElem.onclick = callback;
  };
  var appLoginSuccess = function (userId, userName, sessionToken) {
    models.setUserName(userName);
    models.setUserId(userId);
    models.setSessionToken(sessionToken);
    models.activities.tryRefreshActivities(function () {
      changeState(STATE.list);
    });
  };
  var fbLoginSuccess = function (fbToken) {
    models.startLogin(fbToken, appLoginSuccess, function () {
      throw('login to app failed');
    });
  };

  addButton.onclick = function () {
    changeState(STATE.add);
  };
  backButton.onclick = function () {
    changeState(STATE.list);
  };
  models.activities.addListener(redrawCurrentView);

  changeState(STATE.loggedOut);

  return {
    setLoginButtonCallback: setLoginButtonCallback,
    fbLoginSuccess: fbLoginSuccess,
    debugSkipLogin: appLoginSuccess
  };
})(models);
var getDayOrTodayOrTomorrow = function (date) {
  var today = (new Date);
  today.setHours(0,0,0,0);
  tomorrow = (new Date).setTime(today.getTime() + 24 * 60 * 60 * 1000);
  activityDateCopy = (new Date(date.getTime())).setHours(0,0,0,0);
  if (activityDateCopy.valueOf() == today.valueOf()) {
    return "today";
  } else if (activityDateCopy.valueOf() == tomorrow.valueOf()) {
    return "tomorrow"
  } else {
     return 'on ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }
}
Handlebars.registerHelper('datetimeString', function(start_time) {
  if (!start_time instanceof Date) {
    throw("start_time was a string, not a Date in the template");
  }
  return start_time.toLocaleString().replace(/:00/g,'');
}); 
Handlebars.registerHelper('dateInString', function(start_time) {
  if (!start_time instanceof Date) {
    throw("start_time was a string, not a Date in the template");
  }
  return getDayOrTodayOrTomorrow(start_time);
}); 
Handlebars.registerHelper('list', function(items, options) {
  var out = "<ul>";

  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<li>" + options.fn(items[i]) + "</li>";
  }

  return out + "</ul>";
});