// var TextAreaResizing = require('react-textarea-autosize');
'use strict';

var models = require('./models.js');
var m = function m() {
  for (var _len = arguments.length, objs = Array(_len), _key = 0; _key < _len; _key++) {
    objs[_key] = arguments[_key];
  }

  return Object.assign.apply(Object, [{}].concat(objs));
};
var React = require('react');

var toTwoDigitString = function toTwoDigitString(digit) {
  return digit < 10 ? '0' + digit : '' + digit;
};

var getDateString = function getDateString(dateTime) {
  return [1900 + dateTime.getYear(), toTwoDigitString(dateTime.getMonth() + 1), toTwoDigitString(dateTime.getDate())].join('-');
};

var STATE = { add: 0, list: 1, edit: 2, loggedOut: 3, uninitialized: 4, notificationsOptIn: 5 };
var currentState = STATE.uninitialized;
var selectedActivity;
var changeState = function changeState(newState, options, userTriggered) {
  console.log('Changing state to ' + newState);
  var lastState = currentState;
  if (lastState == STATE.loggedOut) {
    showHeader();
    hideLogin();
  }
  currentState = newState;
  if (currentState == STATE.list) {
    hideBackButton();
    setTitle('Upcoming Plans');
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
    showCreateActivityForm();
    showBackButton();
    if (userTriggered) {
      // history.pushState({state: STATE.add}, 'Create a plan');
    }
  } else if (currentState == STATE.edit) {
      alert('editing');
      setTitle('Edit');
      hideAddButton();
      hideActivitiesList();
      showCreateActivityForm();
      showBackButton();
      if (userTriggered) {
        // history.pushState({state: STATE.edit}, 'Edit plan');
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
        hideActivitiesList();
        hideCreateActivityForm();
      } else {
        throw 'Unknown state';
      }
};
window.addEventListener('popstate', function (e) {
  console.log('User pressed back, popping a state');
  console.log(e);
  if (e.state !== null && e.state.state !== undefined) {
    console.log('Moving back in history to state ' + e.state.state);
    changeState(e.state.state, {}, false);
  } else {
    // Note safari calls popstate on page load so this is expected
    console.log('Uh oh, no valid state in history to move back to');
  }
});
var Card = React.createClass({
  displayName: 'Card',

  render: function render() {
    var cardStyle = {
      /* This puts the border inside the edge */
      boxSizing: 'border-box',
      maxWidth: '600px',
      margin: '0 auto',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      color: '#444',
      lineHeight: '1.5em',
      backgroundColor: '#fafafa'
    };
    /* For fading into 'attending' */
    /*-webkitTransition: 'background-color 0.5s',*/
    if (this.props.backgroundColor !== undefined) {
      cardStyle = m(cardStyle, { backgroundColor: this.props.backgroundColor });
    }
    return React.createElement(
      'div',
      { style: cardStyle, onClick: this.props.onClick ? this.props.onClick : function () {} },
      this.props.children
    );
  }
});
var CardOptions = React.createClass({
  displayName: 'CardOptions',

  render: function render() {
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
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { style: optionStyle },
        React.createElement(
          'a',
          { style: this.props.options[0].disabled ? disabledOptionStyle : enabledOptionStyle,
            onClick: this.props.options[0].disabled ? function () {} : this.props.options[0].onClick },
          this.props.options[0].label
        )
      ),
      React.createElement('div', { style: { clear: 'both' } })
    );
  }
});
var ImgFadeInOnLoad = React.createClass({
  displayName: 'ImgFadeInOnLoad',

  getInitialState: function getInitialState() {
    return { loading: false, loaded: false };
  },
  loadImage: function loadImage(src) {
    if (!this.loadingStarted) {
      this.loadingStarted = true;
      var img = new Image();
      img.onload = (function () {
        this.setState({ loaded: true });
      }).bind(this);
      img.src = src;
    }
  },
  render: function render() {
    this.loadImage(this.props.src);
    var overlayStyle = {
      width: this.props.width,
      height: this.props.height,
      backgroundColor: this.props.backgroundColor,
      opacity: '1',
      transition: 'opacity 300ms',
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
    };
    // To account for the clipping bug filed against Doug in Chrome
    if (this.props.circular) {
      overlayStyle.borderRadius = '50%';
      overlayStyle.overflow = 'hidden';
      imgStyle.borderRadius = '50%';
      imgStyle.overflow = 'hidden';
    }
    return React.createElement(
      'div',
      { style: { position: 'relative' } },
      this.state.loaded ? React.createElement('img', { src: this.props.src, style: imgStyle }) : {},
      React.createElement('div', { style: overlayStyle })
    );
  }
});
var FriendIcon = React.createClass({
  displayName: 'FriendIcon',

  render: function render() {
    var friendIconStyle = {
      border: '1px solid #ccc',
      borderRadius: '19px',
      width: '38px',
      height: '38px',
      marginRight: '24px',
      float: 'left',
      overflow: 'hidden'
    };
    return React.createElement(
      'div',
      { style: friendIconStyle },
      React.createElement(ImgFadeInOnLoad, { src: this.props.thumbnail, backgroundColor: 'ddd', width: '38', height: '38', circular: true })
    );
  }
});
var AttendeesList = React.createClass({
  displayName: 'AttendeesList',

  render: function render() {
    if (this.props.attendees < 1) {
      return null;
    } else {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          null,
          React.createElement(
            'b',
            null,
            'People going'
          )
        ),
        this.props.attendees.map(function (attendee) {
          return React.createElement(
            'p',
            null,
            'attendee'
          );
        })
      );
    }
  }
});
var ActivityCard = React.createClass({
  displayName: 'ActivityCard',

  getInitialState: function getInitialState() {
    return {
      viewingDetails: false
    };
  },
  OPTIONS: {
    edit: 0,
    attend: 1,
    undoAttend: 2
  },
  getCardsOption: function getCardsOption() {
    if (this.props.activity.is_creator) {
      return this.OPTIONS.edit;
    } else if (this.props.activity.is_attending) {
      return this.OPTIONS.undoAttend;
    } else {
      return this.OPTIONS.attend;
    }
  },
  handleCardClicked: function handleCardClicked() {
    this.setState({ viewingDetails: !this.state.viewingDetails });
  },
  handleEditClicked: function handleEditClicked(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    selectedActivity = this.props.activity.id;
    changeState(STATE.edit, {}, true);
  },
  handleAttendClicked: function handleAttendClicked(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    // Optimistically move onto the next page
    swLibrary.hasPushNotificationPermission(function () {}, function () {
      changeState(STATE.notificationsOptIn, { nextState: STATE.list, userTriggered: true, reason: 'if the plan changes' }, false);
    });
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = this.props.activity.dirty == undefined;
    models.activities.trySetAttending(this.props.activity, !this.props.activity.is_attending, optimistic, function () {}, function () {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  },
  handleUndoAttendClicked: function handleUndoAttendClicked(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    alert('undo attend');
  },
  render: function render() {
    var optionString = ['Edit', 'Go along', 'Cancel attending'][this.getCardsOption()];
    var onOptionClick = (function () {
      switch (this.getCardsOption()) {
        case this.OPTIONS.edit:
          return this.handleEditClicked;
          break;
        case this.OPTIONS.attend:
          return this.handleAttendClicked;
          break;
        case this.OPTIONS.undoAttend:
          return this.handleUndoAttendClicked;
          break;
      }
    }).bind(this)();

    return React.createElement(
      Card,
      { backgroundColor: this.props.activity.is_attending ? '#cdf9c9' : undefined, onClick: this.handleCardClicked },
      React.createElement(
        'div',
        { style: { padding: '24px' } },
        React.createElement(FriendIcon, { thumbnail: this.props.activity.thumbnail }),
        React.createElement(
          'div',
          { style: { overflow: 'hidden' } },
          this.props.activity.is_creator ? React.createElement(
            'span',
            null,
            React.createElement(
              'b',
              null,
              'You'
            ),
            ' are '
          ) : React.createElement(
            'span',
            null,
            React.createElement(
              'b',
              null,
              this.props.activity.creator_name
            ),
            ' is '
          ),
          React.createElement(
            'b',
            null,
            this.props.activity.title
          ),
          ' ',
          this.props.activity.start_time,

          /* Description and attendees */
          this.state.viewingDetails ? React.createElement(
            'div',
            { style: { marginTop: '16px' } },
            React.createElement(
              'p',
              null,
              React.createElement(
                'b',
                null,
                'Description'
              )
            ),
            React.createElement(
              'p',
              { style: { whiteSpace: 'pre' } },
              this.props.activity.description
            ),
            React.createElement(AttendeesList, { attendees: this.props.activity.attendees })
          ) : {}
        )
      ),
      React.createElement(CardOptions, {
        options: [{ label: optionString, onClick: onOptionClick }]
      })
    );
  }
});
var ActivityCardList = React.createClass({
  displayName: 'ActivityCardList',

  render: function render() {
    var activitiesList = models.activities.getActivities().map(function (activity) {
      activity.key = activity.id;
      return React.createElement(ActivityCard, { activity: activity });
    });
    return React.createElement(
      'div',
      null,
      activitiesList
    );
  }
});
var EditActivity = React.createClass({
  displayName: 'EditActivity',

  getInitialState: function getInitialState() {
    return {
      title: this.props.activity ? this.props.activity.title : '',
      description: this.props.activity ? this.props.activity.description : '',
      start_time: new Date(),
      saving: false
    };
  },
  handleTitleChange: function handleTitleChange(e) {
    this.setState({ title: e.target.value });
  },
  handleDescriptionChange: function handleDescriptionChange(e) {
    this.setState({ description: e.target.value });
  },
  handleDateTimeChange: function handleDateTimeChange(e) {
    // TODO: Implement me
    // date assumes the input was in GMT and then converts to local time
    var date = editSection.querySelector('input#date').valueAsDate;
    var dateTime = new Date(date);
    console.log('DateTime created in the form is ', dateTime);
    // Make a timezone adjustment
    dateTime.addMinutes(dateTime.getTimezoneOffset());
    var time = editSection.querySelector('input#time').value.split(':');
    dateTime.setHours(time[0]);
    dateTime.setMinutes(time[1]);
    console.log('DateTime created in the form is ', dateTime);
  },
  handleDateChange: function handleDateChange(e) {},
  handleTimeChange: function handleTimeChange(e) {},
  handleSaveClicked: function handleSaveClicked(e) {
    var thisButton = e.target;
    this.setState({ saving: true });

    var activityChanges = { title: this.state.title, description: this.state.description, start_time: this.state.start_time };

    models.activities.tryUpdateActivity(this.props.activity, activityChanges, function () {
      swLibrary.hasPushNotificationPermission(function () {
        changeState(STATE.list, {}, true);
      }, function () {
        changeState(STATE.notificationsOptIn, { nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along' }, false);
      });
    }, function () {
      alert('An error occurred! Sorry :(. Please refresh.');
      throw 'Editing the activity failed. Help the user understand why.';
    });
  },
  handleCreateClicked: function handleCreateClicked() {
    var newActivity = {
      title: this.state.title,
      start_time: this.state.start_time,
      location: '',
      max_attendees: -1,
      description: this.state.description
    };
    models.activities.tryCreateActivity(newActivity, function () {
      swLibrary.hasPushNotificationPermission(function () {
        changeState(STATE.list, {}, true);
      }, function () {
        changeState(STATE.notificationsOptIn, {
          nextState: STATE.list,
          userTriggered: true,
          reason: 'when a friend says they want to come along'
        }, false);
      });
    }, function () {
      // thisButton.classList.toggle('disabled', false);
      alert('Sorry, something went wrong. Please check you entered the information correctly.');
      throw "Adding to server failed. Help the user understand why";
    });
  },
  render: function render() {
    var editing = !!this.props.activity;
    /*
      Set up styles
    */
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
      backgroundColor: 'rgba(0,0,0,0)',
      outline: 'none'
    };
    /*
      Set up the options on the card
    */
    var option = { label: 'Create', onClick: this.handleCreateClicked };
    if (editing) {
      option = { label: 'Save', onClick: this.handleSaveClicked };
      if (this.state.saving) {
        option.label = 'Saving...';
        option.disabled = true;
      }
    }
    /*
      Set up dates for the form
    */
    var getTimeAndDateFormatted = function getTimeAndDateFormatted(dateTime) {
      if (!dateTime instanceof Date) {
        alert('An error occurred! Sorry :(. Please refresh.');
        throw "start_time should be a Date but it was a string!";
      }
      var colonSeparatedTime = toTwoDigitString(dateTime.getHours()) + ':' + toTwoDigitString(dateTime.getMinutes());
      var hyphenSeparatedDate = getDateString(dateTime);
      return { time: colonSeparatedTime, date: hyphenSeparatedDate };
    };
    var hyphenSeparatedToday = getDateString(Date.today());
    var hyphenSeparatedTomorrow = getDateString(Date.today().add(1).days());
    if (editing) {
      var timeAndDate = getTimeAndDateFormatted(this.props.activity.start_time);
      var hyphenSeparatedEventDate = timeAndDate.date;
      var hyphenSeparatedEventTime = timeAndDate.time;
    }
    return React.createElement(
      Card,
      null,
      React.createElement(
        'div',
        { style: { padding: '24px' } },
        React.createElement(
          'b',
          null,
          this.props.userName
        ),
        ' is',
        React.createElement('br', null),
        React.createElement('input', { type: 'text',
          style: m(inputStyle, { fontSize: '1.2em' }),
          className: 'input-placeholder-lighter focusUnderline',
          value: this.state.title,
          placeholder: 'Watching Frozen',
          autoCapitalize: 'words',
          required: true,
          onChange: this.handleTitleChange }),
        React.createElement('input', {
          type: 'date',
          style: m(inputStyle, { float: 'left', fontSize: '1em', width: 'auto' }),
          className: 'input-placeholder-lighter focusUnderline',
          min: hyphenSeparatedToday,
          value: editing ? hyphenSeparatedEventDate : hyphenSeparatedTomorrow,
          required: true }),
        React.createElement('input', {
          type: 'time',
          style: m(inputStyle, { float: 'right', fontSize: '1em', width: '150px' }),
          className: 'input-placeholder-lighter focusUnderline',
          step: '900',
          value: editing ? hyphenSeparatedEventTime : '13:00',
          required: true }),
        React.createElement('div', { style: { clear: 'both' } }),
        React.createElement('textarea', {
          id: 'description',
          style: inputStyle,
          className: 'focusUnderline',
          placeholder: 'Extra information (where? when? what?)',
          rows: '1',
          value: this.state.description,
          onChange: this.handleDescriptionChange })
      ),
      React.createElement(CardOptions, { options: [option] })
    );
  }
});

var activitiesSection = document.querySelector('section#activitiesList');
var editSection = document.querySelector('section#editActivity');
var addButton = document.querySelector('#addButton');
var backButton = document.querySelector('#backButton');
var title = document.querySelector('#title');
var noActivitiesCard = document.querySelector('#noActivitiesCard');
var notificationsOptInSection = document.querySelector('section#notificationsOptIn');
var permissionOverlay = document.querySelector('div#permissionOverlay');
var setTitle = function setTitle(newTitle) {
  title.innerHTML = newTitle;
};
var showHeader = function showHeader() {
  var headerElem = document.querySelector('header');
  headerElem.style.display = '';
};
var hideHeader = function hideHeader() {
  var headerElem = document.querySelector('header');
  headerElem.style.display = 'none';
};
var showLogin = function showLogin() {
  var loginElem = document.querySelector('#login');
  loginElem.style.display = '';
};
var hideLogin = function hideLogin() {
  var loginElem = document.querySelector('#login');
  loginElem.style.display = 'none';
};
var showBackButton = function showBackButton() {
  backButton.style.display = '';
};
var hideBackButton = function hideBackButton() {
  backButton.style.display = 'none';
};
var showCreateActivityForm = function showCreateActivityForm() {
  var activity = null;
  if (currentState == STATE.edit) {
    // Get the selected activity if we're editing
    activity = models.activities.getActivity(selectedActivity);
  }
  React.render(React.createElement(EditActivity, { activity: activity, userName: models.user.getUserName() }), document.getElementById('editActivity'));

  editSection.style.display = '';
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
};
var hideCreateActivityForm = function hideCreateActivityForm() {
  editSection.style.display = 'none';
};
var showNotificationOptIn = function showNotificationOptIn(reason, nextState) {
  // TODO(owencm): Show something different if the notification permission is denied
  var source = document.querySelector('#notifications-opt-in-template').innerHTML;
  var template = Handlebars.compile(source);
  var config = { reason: reason };
  notificationsOptInSection.innerHTML = template(config);
  notificationsOptInSection.style.display = '';
  // Add interactivity
  notificationsOptInSection.querySelector('.option').onclick = function (e) {
    showOverlay();
    this.classList.add('disabled');
    e.stopPropagation();
    setTimeout(function () {
      swLibrary.requestPushNotificationPermissionAndSubscribe(function (userChoice) {
        hideOverlay();
        if (userChoice == 'granted') {
          changeState(nextState);
        } else {
          alert('You denied the permission, you naughty person.');
        }
        // TODO Handle rejection or error case
      });
    }, 300);
  };
};
var hideNotificationOptIn = function hideNotificationOptIn() {
  notificationsOptInSection.style.display = 'none';
};
var showAddButton = function showAddButton() {
  addButton.style.display = '';
};
var hideAddButton = function hideAddButton() {
  addButton.style.display = 'none';
};
var showNoActivitiesCard = function showNoActivitiesCard() {
  noActivitiesCard.style.display = '';
};
var hideNoActivitiesCard = function hideNoActivitiesCard() {
  noActivitiesCard.style.display = 'none';
};
var showActivitiesList = function showActivitiesList() {
  activitiesSection.style.display = '';
};
var hideActivitiesList = function hideActivitiesList() {
  activitiesSection.style.display = 'none';
};
var showOverlay = function showOverlay() {
  permissionOverlay.style.display = '';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 1;
};
var hideOverlay = function hideOverlay() {
  permissionOverlay.style.display = 'none';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 0;
};
var redrawCurrentView = function redrawCurrentView() {
  if (currentState == STATE.list) {
    redrawActivitiesList();
  }
};
var redrawActivitiesList = function redrawActivitiesList() {
  React.render(React.createElement(ActivityCardList, null), document.getElementById('activitiesList'));
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
var setLoginButtonCallback = function setLoginButtonCallback(callback) {
  var loginElem = document.querySelector('#login');
  loginElem.onclick = callback;
};
var appLoginSuccess = function appLoginSuccess(userId, userName, sessionToken) {
  models.user.setUserName(userName);
  models.user.setUserId(userId);
  models.user.setSessionToken(sessionToken);
  // TODO: Change to the list before we even have the activities to avoid an extra RTT on first load
  models.activities.tryRefreshActivities(function () {
    changeState(STATE.list, {}, true);
  }, function () {
    console.log('Failed to download activities');
  });
};
var fbLoginSuccess = function fbLoginSuccess(fbToken) {
  models.startLogin(fbToken, appLoginSuccess, function () {
    throw 'login to app failed';
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

module.exports = {
  setLoginButtonCallback: setLoginButtonCallback,
  fbLoginSuccess: fbLoginSuccess,
  debugSkipLogin: appLoginSuccess
};
/* This forces the title to not wrap around the bottom of the icon */ /* Title section */
//# sourceMappingURL=view.js.map
