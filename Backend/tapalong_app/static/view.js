var skipLogin = true;

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
      setTitle('Upcoming Activities');
      hideCreateActivityForm();
      hideDetails();
      hideBackButton();
      redrawActivitiesList();
      showActivitiesList();
      showAddButton();
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
  var setTitle = function (newTitle) {
    title.innerHTML = newTitle;
  };
  var showHeader = function () {
    var headerElem = document.querySelector('header');
    var headerSpacerElem = document.querySelector('#headerSpacer');
    headerElem.style.display = '';
    headerSpacerElem.style.display = '';
  };
  var hideHeader = function () {
    var headerElem = document.querySelector('header');
    var headerSpacerElem = document.querySelector('#headerSpacer');
    headerElem.style.display = 'none';
    headerSpacerElem.style.display = 'none';
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
    var config = {name: 'Owen Campbell-Moore'};
    if (currentState == STATE.edit) {
      // Get the selected activity if we're editing
      var activity = models.activities.getActivity(selectedActivity);
      config.activity = activity;
      config.editing = true;
    }
    editSection.innerHTML = template(config);
    editSection.querySelector('.option').onclick = function () {
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
        this.className += ' disabled';
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
    if (selectedActivity === undefined) {
      throw 'No activity selected';
    };
    var source = document.querySelector('#activity-details-template').innerHTML;
    var template = Handlebars.compile(source);
    var activity = models.activities.getActivity(selectedActivity);
    detailSection.innerHTML = template(activity);
    detailSection.style.display = '';
  }
  hideDetails = function () {
    detailSection.style.display = 'none';
  } 
  var showAddButton = function () {
    addButton.style.display = '';
  }
  var hideAddButton = function () {
    addButton.style.display = 'none';
  }
  var showActivitiesList = function () {
    activitiesSection.style.display = '';
  }
  var hideActivitiesList = function () {
    activitiesSection.style.display = 'none';
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
  var appLoginSuccess = function (userId, sessionToken) {
      models.setUserId(userId);
      models.setSessionToken(sessionToken);
      models.activities.tryRefreshActivities(function () {
        changeState(STATE.list);
      });
  };
  var fbLoginSuccess = function (fbToken) {
    models.startLogin(fbToken, function () {
    }, function () {
      throw('login to app failed');
    });
  };

  addButton.onclick = function () {
    changeState(STATE.add);
  };
  backButton.onclick = function () {
    changeState(STATE.list);
  };
  models.activities.addListener(redrawActivitiesList);

  changeState(STATE.loggedOut);

  return {
    setLoginButtonCallback: setLoginButtonCallback,
    fbLoginSuccess: fbLoginSuccess,
    debugSkipLogin: appLoginSuccess
  };
})(models);

Handlebars.registerHelper('datetimeString', function(string) {
  return (new Date(string).toDateString());
}); 
Handlebars.registerHelper('list', function(items, options) {
  var out = "<ul>";

  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<li>" + options.fn(items[i]) + "</li>";
  }

  return out + "</ul>";
});