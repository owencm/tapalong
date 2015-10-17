var TextAreaAutoResize = require('react-textarea-autosize');
var models = require('./models.js');
var swLibrary = require('./swsetup.js')
var React = require('react');

var m = function (...objs) {
  return Object.assign({}, ...objs);
}

var SCREEN = {add: 0, list: 1, edit: 2, loggedOut: 3, uninitialized: 4, notificationsOptIn: 5};

var App = React.createClass({
  getInitialState: function() {
    return { screen: SCREEN.loggedOut }
  },
  shouldShowNoActivitiesCard: function () {
    // TODO: Implement showing if we're in the list but there's no content
    return true;
  },
  shouldShowHeader: function () {
    return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(this.state.screen) > 0);
  },
  shouldShowBackButton: function () {
    return ([SCREEN.add, SCREEN.edit].indexOf(this.state.screen) > 0);
  },
  handleStateChange: function (newScreen, options, userTriggered) {
    // TODO: do something with options and userTriggered
    console.log('Changing state to '+newScreen);
    this.setState({screen: newScreen});
    if (newScreen !== SCREEN.edit) {
      this.setState({selectedActivity: undefined});
    }
    // TODO: Read nextScreen from options
  },
  handleActivitySelected: function (activity) {
    this.setState({selectedActivity: activity});
  },
  handleEditModeEnabled: function () {
    this.setState({screen: SCREEN.edit});
  },
  // Syntactic sugar since we call this all the time
  viewList: function () {
    this.handleStateChange(SCREEN.list);
  },
  getScreenTitle: function() {
    if (this.state.screen == SCREEN.list) {
      return 'Upcoming Plans';
    } else if (this.state.screen == SCREEN.edit) {
      return 'Edit';
    } else if (this.state.screen == SCREEN.add) {
      return 'Create'
    } else if (this.state.screen == SCREEN.notificationsOptIn) {
      return 'Stay up to date'
    } else {
      return 'Uh oh: title shouldn\'t be showing';
    }
  },
  render: function() {
    return (
      <div>
        {
          this.state.screen == SCREEN.loggedOut ?
            <Login onLoginComplete={this.viewList} /> : (
              <div>
                <div id='container'>
                  {
                    this.state.screen == SCREEN.list ?
                      <ActivityCardList
                        onActivitySelected={this.handleActivitySelected}
                        onEditModeEnabled={this.handleEditModeEnabled}
                        selectedActivity={this.state.selectedActivity}
                      /> : null }
                  { this.state.screen == SCREEN.notificationsOptIn ? <OptIn reason={reason} nextState={this.state.nextScreen} /> : null }
                  {
                    [SCREEN.add, SCREEN.edit].indexOf(this.state.screen) > 0 ?
                    <EditActivity
                      activity={this.state.selectedActivity}
                      userName={models.user.getUserName()}
                      onReturnToList={this.viewList}
                    /> :
                    null
                  }
                  <div style={{height: '100px'}}></div>
                </div>
                {
                  this.shouldShowHeader() ?
                    <Header
                      title={this.getScreenTitle()}
                      shouldShowBackButton={this.shouldShowBackButton()}
                      onBackButtonClicked={this.viewList}
                    /> :
                    null
                }
              </div>
            )
        }
      </div>
    )
  }
});

var Login = React.createClass({
  handleLogin: function () {
    var userId = 1;
    var userName = 'Owen Campbell-Moore';
    var sessionToken = 'letmein';
    models.user.setUserName(userName);
    models.user.setUserId(userId);
    models.user.setSessionToken(sessionToken);
    models.activities.tryRefreshActivities(function () {
      this.props.onLoginComplete();
    }.bind(this), function () {
      console.log('Failed to download activities')
    });
  },
  render: function () {
    return (
      <div id='login'>
        <div id='splash'>
        </div>
        <div id='slogan'>
          <img src='images/slogan.png'></img>
        </div>
        <div id='loginButton' onClick={this.handleLogin}>
          <img src='images/login-button.png' id='loginButtonImg'></img>
        </div>
      </div>
    )
  }
});

var Header = React.createClass({
  render: function () {
    return (
      <header>
        { this.props.shouldShowBackButton ? <img src='images/back-icon.svg' id='backButton'></img> : null }
        <h1 id='title'>
          {this.props.title}
        </h1>
      </header>
    );
  }
})

// TODO: Re-add history support
// window.addEventListener('popstate', function(e) {
//   console.log('User pressed back, popping a state');
//   console.log(e);
//   if (e.state !== null && e.state.state !== undefined) {
//     console.log('Moving back in history to state '+e.state.state);
//     changeState(e.state.state, {}, false);
//   } else {
//     // Note safari calls popstate on page load so this is expected
//     console.log('Uh oh, no valid state in history to move back to (this is expected on safari pageload)');
//   }
// });

var Card = React.createClass({
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
      <div style={cardStyle} onClick={this.props.onClick ? this.props.onClick : function () {}}>{this.props.children}</div>
    );
  }
});

var CardOptions = React.createClass({
  render: function () {
    var optionStyle = {
      textTransform: 'uppercase',
      fontWeight: '600',
      fontSize: '14px',
      /* Put the padding and margin on the options so the click targets are larger */
      padding: '14px 20px',
      margin: '0px',
      /* A default position */
      float: 'right'
    };
    var enabledOptionStyle = {
      color: '#00BCD4'
    };
    var badEnabledOptionStyle = {
      color: '#e33'
    };
    var disabledOptionStyle = {
      color: '#CCC'
    };
    var optionCards = this.props.options.map(function (option) {
      return (
        <div
          style={m(optionStyle, option.position == 'left' ? {float: 'left'} : {})}
          onClick={option.disabled ? function(){} : option.onClick}
        >
          <a style={
              option.disabled ? disabledOptionStyle : (
                option.type == 'bad' ? badEnabledOptionStyle : enabledOptionStyle
              )
            }
          >
            {option.label}
          </a>
        </div>
      )
    }.bind(this));
    return (
      <div>
        { optionCards }
        <div style={{clear: 'both'}}></div>
      </div>
    )
  }
});

var ImgFadeInOnLoad = React.createClass({
  getInitialState: function () {
    return { loading: false, loaded: false };
  },
  loadImage: function (src) {
    if (!this.loadingStarted) {
      this.loadingStarted = true;
      var img = new Image();
      img.onload = function() {
        this.setState({loaded: true})
      }.bind(this);
      img.src = src;
    }
  },
  render: function () {
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
    }
    // To account for the clipping bug filed against Doug in Chrome
    if (this.props.circular) {
      overlayStyle.borderRadius = '50%';
      overlayStyle.overflow = 'hidden';
      imgStyle.borderRadius = '50%';
      imgStyle.overflow = 'hidden';
    }
    return (
      <div style={{position: 'relative'}}>
        { this.state.loaded ? (<img src={this.props.src} style={imgStyle} />) : {} }
        <div style={overlayStyle} />
      </div>
    )
  }
});
var FriendIcon = React.createClass({
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
      <div style={friendIconStyle}>
        <ImgFadeInOnLoad src={this.props.thumbnail} backgroundColor='ddd' width='38' height='38' circular/>
      </div>
    )
  }
});

var AttendeesList = React.createClass({
  render: function () {
    if (this.props.attendees < 1) {
      return null;
    } else {
      return (
        <div>
          <p><b>People going</b></p>
          {
            this.props.attendees.map(function (attendee) {
              return <p>{attendee}</p>
            })
          }
        </div>
      )
    }
  }
});

var ActivityCard = React.createClass({
  OPTIONS: {
    edit: 0,
    attend: 1,
    undoAttend: 2
  },
  getCardsOption: function () {
    if (this.props.activity.is_creator) {
      return this.OPTIONS.edit;
    } else if (this.props.activity.is_attending) {
      return this.OPTIONS.undoAttend;
    } else {
      return this.OPTIONS.attend;
    }
  },
  // E.g. "tomorrow at 2pm", or "on Wednesday at 8pm"
  // TODO: Render 0AM as Midnight
  getDateString: function () {
    var today = Date.today();
    var tomorrow = (Date.today()).add(1).days();
    // This is the full date + time
    var dateTime = this.props.activity.start_time;
    // This is a copy of the date (time stripped) used for date comparison
    var dateCopy = dateTime.clone().clearTime();
    var str = '';
    if (today.equals(dateCopy)) {
      str += 'today ';
    } else if (tomorrow.equals(dateCopy)) {
      str += 'tomorrow ';
    } else {
      str += 'on ' + dateTime.toString('dddd dS') + ' ';
    }
    str += 'at ' + dateTime.toString('h');
    var minutes = dateTime.toString('mm');
    if (minutes !== '00') {
      str += ':' + minutes;
    }
    str += dateTime.toString('tt').toLowerCase();
    return str;
  },
  handleCardClicked: function (e) {
    this.props.onActivitySelected(this.props.activity);
  },
  handleEditClicked: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onActivitySelected(this.props.activity);
    this.props.onEditClicked();
  },
  handleAttendClicked: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    // If the browser supports notifications but doesn't have permission,
    // optimistically go to the opt in without waiting
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission(function(){}, function() {
        changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'if the plan changes'}, false);
      });
    }
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = this.props.activity.dirty == undefined;
    models.activities.trySetAttending(this.props.activity, !this.props.activity.is_attending, optimistic, function () {}, function () {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  },
  handleUndoAttendClicked: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = this.props.activity.dirty == undefined;
    models.activities.trySetAttending(this.props.activity, !this.props.activity.is_attending, optimistic, function () {}, function () {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  },
  render: function() {
    var optionString = ['Edit', 'Go along', 'Cancel attending'][this.getCardsOption()];
    var onOptionClick = (function () {
      switch(this.getCardsOption()) {
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
    }.bind(this))();

    return (
      <Card backgroundColor={this.props.activity.is_attending ? '#cdf9c9' : undefined} onClick={this.handleCardClicked}>
        <div style={{padding: '24px'}}>
          <FriendIcon thumbnail={this.props.activity.thumbnail}/>
          {/* This forces the title to not wrap around the bottom of the icon */}
          <div style={{overflow: 'hidden'}}>
            { /* Title section */ }
            {this.props.activity.is_creator ? (
              <span><b>You</b> are </span>
            ) : (
              <span><b>{this.props.activity.creator_name}</b> is </span>
            )}<b>{this.props.activity.title}</b> {this.getDateString()}
            {
              /* Description and attendees */
              this.props.selected ? (
                <div style={{marginTop: '16px'}}>
                  { /* TODO: Tidy up this crap! */ }
                  {
                    this.props.activity.description !== '' ? (
                      <div>
                        <p><b>Description</b></p>
                        { /* whiteSpace ensures we retain line breaks from the text.
                          userSelect enables selection for copy pasting */ }
                        <p style={{whiteSpace: 'pre-wrap', WebkitUserSelect: 'text'}}>
                          {this.props.activity.description}
                        </p>
                      </div>
                    ) : null
                  }
                  {
                    (this.props.activity.description !== '' && this.props.activity.attendees.length > 0) ?
                      <br /> : null
                  }
                  <AttendeesList attendees={this.props.activity.attendees}/>
                  {
                    (this.props.activity.description == '' && this.props.activity.attendees.length == 0) ? (
                      <p>No more information available for this plan</p>
                    ) : null
                  }
                </div>
              ) : null
            }
          </div>
        </div>
        <CardOptions
          options={[{label: optionString, onClick: onOptionClick}]}
        />
      </Card>
    );
  }
});

var ActivityCardList = React.createClass({
  handleSelected: function (activity) {
    this.props.onActivitySelected(activity);
  },
  handleEditClicked: function () {
    this.props.onEditModeEnabled();
  },
  render: function () {
    var activitiesList = models.activities.getActivities().map(function (activity) {
      activity.key = activity.id;
      return (
        <ActivityCard
          activity={activity}
          onActivitySelected={this.handleSelected}
          onEditClicked={this.handleEditClicked}
          selected={this.props.selectedActivity == activity}
        />
      );
    }.bind(this));
    return (
      <div>
        {activitiesList}
      </div>
    );
  }
});

var EditActivity = React.createClass({
  getInitialState: function () {
    return {
      title: this.props.activity ? this.props.activity.title : '',
      description: this.props.activity ? this.props.activity.description : '',
      start_time: this.props.activity ? this.props.activity.start_time : Date.today().add(1).days().set({hour: 16}),
      saving: false
    };
  },
  componentDidMount: function () {
    // Ensure the title input is in view
    this.refs.titleInput.getDOMNode().scrollIntoView();
    // TODO: If we scrolled into view the elem may be hidden behind the header
  },
  handleTitleChange: function (e) {
    this.setState({title: e.target.value});
  },
  handleDescriptionChange: function (e) {
    this.setState({description: e.target.value});
  },
  handleDateChange: function (e) {
    // Note date will parse the date as if it was UTC, and then convert it into local TZ
    var newDate = new Date(e.target.value);
    // To solve the parsing as UTC issue we add the timezone offset
    newDate.addMinutes(newDate.getTimezoneOffset())
    var newStartTime = this.state.start_time.clone();
    // Set the date component of the state without modifying time
    newStartTime.set({
      day: newDate.getDate(),
      month: newDate.getMonth(),
      // Year values start at 1900
      year: 1900 + newDate.getYear()
    });
    console.log(newStartTime);
    this.setState({start_time: newStartTime});
  },
  handleTimeChange: function (e) {
    var tmp = e.target.value.split(':');
    var hour = parseInt(tmp[0]);
    var minute = parseInt(tmp[1]);
    var oldStartTime = this.state.start_time.clone();
    var newStartTime = oldStartTime.set({
      hour: hour,
      minute: minute
    });
    this.setState({start_time: newStartTime});
  },
  handleSaveClicked: function (e) {
    var thisButton = e.target;
    this.setState({saving: true});

    var activityChanges = {title: this.state.title, description: this.state.description, start_time: this.state.start_time};

    models.activities.tryUpdateActivity(this.props.activity, activityChanges, function () {
      // Don't ask the user to grant permission unless the browser supports it
      if (swLibrary.browserSupportsSWAndNotifications()) {
        swLibrary.hasPushNotificationPermission(function() {
          this.props.onReturnToList();
        }.bind(this), function () {
          changeState(STATE.notificationsOptIn, {nextState: STATE.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
        });
      } else {
        this.props.onReturnToList();
      }
    }.bind(this), function () {
      alert('An error occurred! Sorry :(. Please refresh.');
      throw('Editing the activity failed. Help the user understand why.');
    });
  },
  handleCreateClicked: function () {
    var newActivity = {
      title: this.state.title,
      start_time: this.state.start_time,
      location: '',
      max_attendees: -1,
      description: this.state.description
    };
    models.activities.tryCreateActivity(newActivity, function () {
      if (swLibrary.browserSupportsSWAndNotifications()) {
        swLibrary.hasPushNotificationPermission(function() {
          this.props.onReturnToList();
        }.bind(this), function () {
          changeState(STATE.notificationsOptIn, {
            nextState: STATE.list,
            userTriggered: true,
            reason: 'when a friend says they want to come along'
          }, false);
        });
      } else {
        this.props.onReturnToList();
      }
    }, function () {
      // thisButton.classList.toggle('disabled', false);
      alert('Sorry, something went wrong. Please check you entered the information correctly.');
      throw("Adding to server failed. Help the user understand why");
    });
  },
  handleDeleteClicked: function () {
    if (confirm('This will notify everyone coming that the event is cancelled and remove it from the app. Confirm?')) {
       models.activities.tryCancelActivity(this.props.activity, function () {
         this.props.onReturnToList();
       }.bind(this), function () {
         alert('An error occurred! Sorry :(. Please refresh.');
         throw("Cancelling on server failed. Help the user understand why");
       });
     } else {
       // Do nothing
     }
  },
  render: function () {
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
      outline: 'none',
      // This prevents iOS from rounding corners on input elements
      borderRadius: 0
    };
    // Set up the options on the card
    var options = [];
    var defaultOption;
    if (editing) {
      defaultOption = {label: 'Save', onClick: this.handleSaveClicked};
      if (this.state.saving) {
        defaultOption.label = 'Saving...';
        defaultOption.disabled = true;
      }
      var deleteOption = {label: 'Delete', onClick: this.handleDeleteClicked, position: 'left', type: 'bad'};
      options.push(deleteOption);
    } else {
      defaultOption = {label: 'Create', onClick: this.handleCreateClicked};
    }
    options.push(defaultOption);
    // Provide dates and times for the input elements
    // Documentation for date formatting: https://code.google.com/p/datejs/wiki/FormatSpecifiers
    var getHyphenSeparatedTime = function(date) {
      return date.toString('HH:mm');
    }
    var getHyphenSeparatedDate = function(date) {
      return date.toString('yyyy-MM-dd');
    }
    var getHyphenSeparatedToday = function () {
      return Date.today().toString('yyyy-MM-dd');
    }
    var getHyphenSeparatedTomorrow = function () {
      return Date.today().add(1).days().toString('yyyy-MM-dd');
    }
    return (
      <Card>
        <div style={{padding: '24px'}}>
          <b>{this.props.userName}</b> is<br />
          <input
            ref='titleInput'
            type='text'
            style={m(inputStyle, {fontSize: '1.2em'})}
            className='input-placeholder-lighter focusUnderline'
            value={this.state.title}
            placeholder='Watching Frozen'
            autoCapitalize='words'
            required
            autoFocus
            onChange={this.handleTitleChange}>
          </input>
          <input
            type='date'
            style={m(inputStyle, {float: 'left', fontSize: '1em', width: 'auto'})}
            className='input-placeholder-lighter focusUnderline'
            min={getHyphenSeparatedToday()}
            value={ getHyphenSeparatedDate(this.state.start_time) }
            onChange={this.handleDateChange}
            required>
          </input>
          <input
            type='time'
            style={m(inputStyle, {float: 'right', fontSize: '1em', width: '150px'})}
            className='input-placeholder-lighter focusUnderline'
            step="900"
            value={ getHyphenSeparatedTime(this.state.start_time) }
            onChange={this.handleTimeChange}
            required>
          </input>
          <div style={{clear: 'both'}}></div>
          <TextAreaAutoResize
            id='description'
            style={inputStyle}
            className='focusUnderline'
            placeholder='Extra information (where? when? what?)'
            rows='1'
            maxRows='8'
            value={this.state.description}
            onChange={this.handleDescriptionChange}>
          </TextAreaAutoResize>
        </div>
        <CardOptions options={options}/>
      </Card>
    )
  }
});

var permissionOverlay = document.querySelector('div#permissionOverlay');

// TODO: set form fields to blur after enter pressed
  // titleInputElem.addEventListener('keydown', function(key) {
  //   if (key.keyCode == 13) {
  //     this.blur();
  //   }
  // });

var OptIn = React.createClass({
  handleOKClicked: function (e) {
    showOverlay();
    // 300ms wait until the overlay has shown
    setTimeout(function() {
      swLibrary.requestPushNotificationPermissionAndSubscribe(function () {
        hideOverlay();
        changeState(this.props.nextState);
      }, function () {
        // TODO: Handle failure or permission rejection
      });
    }.bind(this), 300);
  },
  render: function () {
    return (
      <Card>
        <div style={{padding: '24px'}}>
          <p>Up Dog will send you a notification {this.props.reason}.</p>
        </div>
        <CardOptions
          options={[{label: 'OK', onClick: this.handleOKClicked}]}
        />
      </Card>
    )
  }
});

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
  React.render(
    <App />,
    document.getElementById('appShell')
  );
};
var setLoginButtonCallback = function (callback) {
  var loginElem = document.querySelector('#login');
  loginElem.onclick = callback;
};
var fbLoginSuccess = function (fbToken) {
  models.startLogin(fbToken, appLoginSuccess, function () {
    throw('login to app failed');
  });
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

module.exports = {
  setLoginButtonCallback: setLoginButtonCallback,
  fbLoginSuccess: fbLoginSuccess,
  // debugSkipLogin: appLoginSuccess
};
