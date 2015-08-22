var twoDigitString = function (digit) {
  return (digit < 10) ? '0' + digit : '' + digit;
}

var getDateString = function (dateTime) {
  return [(1900 + dateTime.getYear()),twoDigitString(dateTime.getMonth()+1),twoDigitString(dateTime.getDate())].join('-');
}

var m = function (obj) {
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function ownEnumerableKeys(obj) {
  	var keys = Object.getOwnPropertyNames(obj);

  	if (Object.getOwnPropertySymbols) {
  		keys = keys.concat(Object.getOwnPropertySymbols(obj));
  	}

  	return keys.filter(function (key) {
  		return propIsEnumerable.call(obj, key);
  	});
  }
  var result = {};
	var from;
	var keys;

	for (var s = 0; s < arguments.length; s++) {
		from = arguments[s];
		keys = ownEnumerableKeys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			result[keys[i]] = from[keys[i]];
		}
	}

	return result;
};

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
  var ImgFadeInOnLoad = React.createClass({displayName: "ImgFadeInOnLoad",
    getInitialState: function () {
      return { loaded: false };
    },
    render: function () {
      if (!this.loaded) {
        fetch(this.props.src).then(function(response) {
          this.setState({loaded: true});
        }.bind(this));
      }
      var overlayStyle = {
        width: this.props.width,
        height: this.props.height,
        backgroundColor: this.props.backgroundColor,
        opacity: '1',
        transition: 'opacity 600ms',
        position: 'absolute',
        top: '0',
        left: '0'
      };
      if (this.state.loaded) {
        overlayStyle.opacity = 0;
      }
      var imgStyle = {
        position: 'absolute',
        top: '0',
        left: '0',
        width: this.props.width,
        height: this.props.height
      }
      // To account for the clipping bug filed against Doug in Chrome
      if (this.props.circular) {
        overlayStyle.borderRadius = '50%';
        overlayStyle.overflow = 'hidden';
        imgStyle.borderRadius = '50%';
        imgStyle.overflow = 'hidden';
      }
      return (
        React.createElement("div", {style: {position: 'relative'}}, 
          React.createElement("img", {src: this.props.src, style: imgStyle}), 
          React.createElement("div", {style: overlayStyle})
        )
      )
    }
  });
  var FriendIcon = React.createClass({displayName: "FriendIcon",
    render: function () {
      var friendIconStyle = {
        border: '1px solid #ccc',
        borderRadius: '19px',
        width: '38px',
        height: '38px',
        marginRight: '24px',
        float: 'left',
        overflow: 'hidden'
      };
      return (
        React.createElement("div", {style: friendIconStyle}, 
          React.createElement(ImgFadeInOnLoad, {src: this.props.thumbnail, backgroundColor: "ddd", width: "38", height: "38", circular: true})
        )
      )
    }
  });
  var CardOptions = React.createClass({displayName: "CardOptions",
    getInitialState: function () {
      return {enabled: [true]};
    },
    disableAndCall: function (callback) {
      this.setState({enabled: [false]})
    },
    render: function () {
      var optionStyle = {
        textTransform: 'uppercase',
        fontWeight: '600',
        fontSize: '14px',
        /* Put the padding and margin on the options so the click targets are larger */
        padding: '6px 12px',
        margin: '8px',
        /* A default position */
        float: 'right'
      };
      var enabledOptionStyle = {
        color: '#00BCD4'
      };
      var disabledOptionStyle = {
        color: '#CCC'
      };
      return (
        React.createElement("div", null, 
          React.createElement("div", {style: optionStyle}, 
            React.createElement("a", {style: this.state.enabled[0] ? enabledOptionStyle : disabledOptionStyle, 
              onClick: this.state.enabled[0] ? this.props.options[0].onClick : function(){}}, 
              this.props.options[0].label
            )
          ), 
          React.createElement("div", {style: {clear: 'both'}})
        )
      )
    }
  });
  var Card = React.createClass({displayName: "Card",
    render: function () {
      var cardStyle = {
        /* This puts the border inside the edge */
        boxSizing: 'border-box',
        maxWidth: '600px',
        margin: '0 auto',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        color: '#444',
        lineHeight: '1.5em',
        backgroundColor: '#fafafa',
        /* For fading into 'attending' */
        /*-webkitTransition: 'background-color 0.5s',*/
      };
      if (this.props.backgroundColor !== undefined) {
        cardStyle = m(cardStyle, {backgroundColor: this.props.backgroundColor});
      }
      return (
        React.createElement("div", {style: cardStyle}, this.props.children)
      );
    }
  });
  var ActivityBox = React.createClass({displayName: "ActivityBox",
    getInitialState: function () {
      var option = this.props.activity.is_creator ?
        this.OPTIONS.edit : (this.props.activity.is_attending ? this.OPTIONS.undoAttend : this.OPTIONS.attend);
      return {option: option}
    },
    OPTIONS: {
      edit: 0,
      attend: 1,
      undoAttend: 2
    },
    render: function() {
      var optionString = ['Edit', 'Go along', 'Cancel attending'][this.state.option];
      var optionClicked = function () {
        if (this.state.option == this.OPTIONS.edit) {
          selectedActivity = this.props.activity.id;
          changeState(STATE.edit, {}, true);
        } else if (option == this.OPTIONS.attend) {
          // Optimistically move onto the next page
          swLibrary.hasPushNotificationPermission(function(){}, function() {
            changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'if the plan changes'}, false);
          });
          // Note no callback since the list will automatically redraw when this changes
          var optimistic = this.props.activity.dirty == undefined;
          models.activities.trySetAttending(this.props.activity, !this.props.activity.is_attending, optimistic, function () {}, function () {
            console.log('Uhoh, an optimistic error was a mistake!!');
            alert('An unexpected error occurred. Please refresh.');
          });
        } else if (option == this.OPTIONS.undoAttend) {
          alert('undo attend');
        }
      };
      return (
        React.createElement(Card, {backgroundColor: this.props.activity.is_attending ? '#cdf9c9' : undefined}, 
          React.createElement("div", {style: {padding: '24px'}}, 
            React.createElement(FriendIcon, {thumbnail: this.props.activity.thumbnail}), 
            /* This forces the title to not wrap around the bottom of the icon */
            React.createElement("div", {style: {overflow: 'hidden'}}, 
              this.props.activity.is_creator ? (
                React.createElement("span", null, React.createElement("b", null, "You"), " are ")
              ) : (
                React.createElement("span", null, React.createElement("b", null, this.props.activity.creator_name), " is ")
              ), React.createElement("b", null, this.props.activity.title), " ", this.props.activity.start_time
            )
          ), 
          React.createElement(CardOptions, {
            options: [{label: optionString, onClick: optionClicked.bind(this)}]}
          )
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
  var EditActivity = React.createClass({displayName: "EditActivity",
    render: function () {
      var getTimeAndDateFormatted = function (dateTime) {
        if (!dateTime instanceof Date) {
          alert('An error occurred! Sorry :(. Please refresh.');
          throw("start_time should be a Date but it was a string!");
        }
        var timeString = twoDigitString(dateTime.getHours()) + ':' + twoDigitString(dateTime.getMinutes());
        var dateString = getDateString(dateTime);
        return {time: timeString, date: dateString};
      };
      var inputStyle = {
        display: 'block',
        boxSizing: 'border-box',
        width: '100%',
        margin: '10px 0',
        padding: '10px 10px 10px 2px',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        borderLeft: 'none',
        backgroundColor: 'rgba(0,0,0,0)'
      };
      var option = {label: 'Create', onClick: function(){}};
      var editing = !!this.props.activity;
      if (editing) {
        option = {label: 'Save', onClick: function(){}}
        var timeAndDate = getTimeAndDateFormatted(this.props.activity.start_time);
      }
      var today = new Date;
      var todaysDate = getDateString(today);
      var tomorrow = Date.today().add(1).days()
      var tomorrowsDate = getDateString(tomorrow);
      var nextWeeksDate = getDateString(Date.today().add(14).days());
      return (
        React.createElement(Card, null, 
          React.createElement("div", {style: {padding: '24px'}}, 
            React.createElement("b", null, this.props.userName), " is", React.createElement("br", null), 
            React.createElement("input", {type: "text", style: m(inputStyle, {fontSize: '1.2em'}), className: "input-placeholder-lighter", value: this.props.activity.title, placeholder: "Watching Frozen", autoCapitalize: "words", required: true}), 
            React.createElement("input", {
              type: "date", 
              style: m(inputStyle, {float: 'left', fontSize: '1em', width: 'auto'}), 
              className: "input-placeholder-lighter", 
              max: nextWeeksDate, 
              min: todaysDate, 
              value: editing ? timeAndDate.date : tomorrowsDate, 
              required: true}
            ), 
            React.createElement("input", {
              type: "time", 
              style: m(inputStyle, {float: 'right', fontSize: '1em', width: '150px'}), 
              className: "input-placeholder-lighter", 
              step: "900", 
              value: editing ? timeAndDate.time : '13:00', 
              required: true}
            ), 
            React.createElement("div", {style: {clear: 'both'}}), 
            React.createElement("textarea", {id: "description", style: inputStyle, placeholder: "Extra information (where? when? what?)", rows: "1", value: this.props.activity.description})
          ), 
          React.createElement(CardOptions, {options: [option]})
        )
      )
    }
  });
  var showCreateActivityForm = function () {
    var activity = null;
    if (currentState == STATE.edit) {
      // Get the selected activity if we're editing
      activity = models.activities.getActivity(selectedActivity);
    }
    React.render(
      React.createElement(EditActivity, {activity: activity, userName: models.user.getUserName()}),
      document.getElementById('editActivity')
    );

    editSection.style.display = '';
    // var today = new Date;
    // config.todaysDate = getDateString(today);
    // var tomorrow = Date.today().add(1).days()
    // config.tomorrowsDate = getDateString(tomorrow);
    // config.nextWeeksDate = getDateString(Date.today().add(14).days());
    //
    // // Make the textarea autoresize
    // var descriptionInputElem = editSection.querySelector('textarea#description');
    // function delayedResize (elem) {
    //   return function () {
    //     window.setTimeout(function () {
    //       elem.style.height = 'auto';
    //       elem.style.height = elem.scrollHeight+'px';
    //    }, 0);
    //   }
    // }
    // var delayedResizeInstance = delayedResize(descriptionInputElem);
    // delayedResizeInstance();
    // descriptionInputElem.addEventListener('change',  delayedResizeInstance);
    // descriptionInputElem.addEventListener('cut',     delayedResizeInstance);
    // descriptionInputElem.addEventListener('paste',   delayedResizeInstance);
    // descriptionInputElem.addEventListener('drop',    delayedResizeInstance);
    // descriptionInputElem.addEventListener('keydown', delayedResizeInstance);
    //
    // // Add interactivity
    // var titleInputElem = editSection.querySelector('input#title');
    // if (currentState == STATE.edit) {
    //   editSection.querySelector('.option.cancel').onclick = function () {
    //     if (confirm('This will notify everyone coming that the event is cancelled and remove it from the app. Confirm?')) {
    //       this.classList.add('disabled');
    //       models.activities.tryCancelActivity(activity, function () {
    //         changeState(STATE.list, {}, true);
    //       }, function () {
    //         alert('An error occurred! Sorry :(. Please refresh.');
    //         throw("Cancelling on server failed. Help the user understand why");
    //       });
    //     } else {
    //       // Do nothing
    //     }
    //   }
    // } else if (currentState == STATE.add) {
    //   // Why this needs a timeout is totally beyond me
    //   setTimeout(function() {
    //     titleInputElem.focus();
    //     titleInputElem.scrollIntoView();
    //   },0);
    // }
    //
    // titleInputElem.addEventListener('keydown', function(key) {
    //   if (key.keyCode == 13) {
    //     this.blur();
    //   }
    // });
    //
    // editSection.querySelector('.option.save').onclick = function () {
    //   var thisButton = this;
    //   thisButton.classList.add('disabled');
    //   thisButton.innerHTML = 'Saving...';
    //   var title = editSection.querySelector('input#title').value;
    //   var description = editSection.querySelector('textarea#description').value;
    //   // date assumes the input was in GMT and then converts to local time
    //   var date = editSection.querySelector('input#date').valueAsDate;
    //   var dateTime = new Date(date);
    //   console.log('DateTime created in the form is ',dateTime);
    //   // Make a timezone adjustment
    //   dateTime.addMinutes(dateTime.getTimezoneOffset());
    //   var time = editSection.querySelector('input#time').value.split(':');
    //   dateTime.setHours(time[0]);
    //   dateTime.setMinutes(time[1]);
    //   console.log('DateTime created in the form is ',dateTime);
    //   var activityChanges = {title: title, description: description, start_time: dateTime};
    //   if (currentState == STATE.edit) {
    //     var activity = models.activities.getActivity(selectedActivity);
    //     console.log(activity);
    //     models.activities.tryUpdateActivity(activity, activityChanges, function () {
    //       swLibrary.hasPushNotificationPermission(function() {
    //         changeState(STATE.list, {}, true);
    //       }, function () {
    //         changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
    //       });
    //     }, function () {
    //       alert('An error occurred! Sorry :(. Please refresh.');
    //       throw('Editing the activity failed. Help the user understand why.');
    //     });
    //   } else {
    //     var newActivity = {title: title, start_time: dateTime, location: '', max_attendees: -1, description: description};
    //     models.activities.tryCreateActivity(newActivity, function () {
    //       swLibrary.hasPushNotificationPermission(function() {
    //         changeState(STATE.list, {}, true);
    //       }, function () {
    //         changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
    //       });
    //     }, function () {
    //       // thisButton.classList.toggle('disabled', false);
    //       alert('Sorry, something went wrong. Please check you entered the information correctly.');
    //       throw("Adding to server failed. Help the user understand why");
    //     });
    //   }
    // }
    // editSection.style.display = '';
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
    React.render(
      React.createElement(ActivityList, null),
      document.getElementById('activitiesList')
    );
    //   activityElem.onclick = function () {
    //     selectedActivity = activity.id;
    //     changeState(STATE.detail, {}, true);
    //   };
    //   activityElem.querySelector('.option').onclick = function (e) {

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
