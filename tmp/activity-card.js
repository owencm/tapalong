// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');
var AttendeesList = require('./attendees-list.js');
var FriendIcon = require('./friend-icon.js');
var Collapse = require('react-collapse');

// Require core logic
var models = require('./models.js');
var swLibrary = require('./swsetup.js');

var OPTIONS = {
  edit: 0,
  attend: 1,
  undoAttend: 2
};

var ActivityCard = React.createClass({
  displayName: 'ActivityCard',

  getCardsOption: function getCardsOption() {
    if (this.props.activity.is_creator) {
      return OPTIONS.edit;
    } else if (this.props.activity.is_attending) {
      return OPTIONS.undoAttend;
    } else {
      return OPTIONS.attend;
    }
  },
  // E.g. "tomorrow at 2pm", or "on Wednesday at 8pm"
  // TODO: Render 0AM as Midnight
  getDateString: function getDateString() {
    var today = Date.today();
    var tomorrow = Date.today().add(1).days();
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
  // Toggle the selected state
  handleCardClick: function handleCardClick(e) {
    this.props.onClick(this.props.activity);
  },
  handleEditClick: function handleEditClick(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onEditClick(this.props.activity);
  },
  handleAttendClick: function handleAttendClick(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onAttendClick(this.props.activity);
  },
  handleUnattendClick: function handleUnattendClick(e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onUnattendClick(this.props.activity);
  },
  render: function render() {
    var _this = this;

    var optionString = ['Edit', 'Go along', 'Cancel attending'][this.getCardsOption()];
    var onOptionClick = (function () {
      switch (_this.getCardsOption()) {
        case OPTIONS.edit:
          return _this.handleEditClick;
          break;
        case OPTIONS.attend:
          return _this.handleAttendClick;
          break;
        case OPTIONS.undoAttend:
          return _this.handleUnattendClick;
          break;
      }
    })();

    return React.createElement(
      Card,
      { backgroundColor: this.props.activity.is_attending ? '#cdf9c9' : undefined, onClick: this.handleCardClick },
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
          this.getDateString(),

          /* Description and attendees */
          React.createElement(
            Collapse,
            { isOpened: this.props.selected },
            React.createElement(
              'div',
              { style: { paddingTop: '16px' } },
              this.props.activity.description !== '' ? React.createElement(
                'div',
                null,
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
                  { style: { whiteSpace: 'pre-wrap', WebkitUserSelect: 'text' } },
                  this.props.activity.description
                )
              ) : null,
              this.props.activity.description !== '' && this.props.activity.attendees.length > 0 ? React.createElement('br', null) : null,
              React.createElement(AttendeesList, { attendees: this.props.activity.attendees }),
              this.props.activity.description == '' && this.props.activity.attendees.length == 0 ? React.createElement(
                'p',
                null,
                'No more information available for this plan'
              ) : null
            )
          )
        )
      ),
      React.createElement(CardOptions, {
        options: [{ label: optionString, onClick: onOptionClick }]
      })
    );
  }
});

module.exports = ActivityCard;
/* This forces the title to not wrap around the bottom of the icon */ /* Title section */ /* TODO: Tidy up this crap! */ /* whiteSpace ensures we retain line breaks from the text.
                                                                                                                         userSelect enables selection for copy pasting */
