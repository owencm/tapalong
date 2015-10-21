// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');
var AttendeesList = require('./attendees-list.js');
var FriendIcon = require('./friend-icon.js');
var Collapse = require('react-collapse');

var OPTIONS = {
  edit: 0,
  attend: 1,
  undoAttend: 2
};

var ActivityCard = React.createClass({
  getCardsOption: function () {
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
  // Toggle the selected state
  handleCardClick: function (e) {
    this.props.onClick(this.props.activity);
  },
  handleEditClick: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onEditClick(this.props.activity);
  },
  handleAttendClick: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onAttendClick(this.props.activity);
  },
  handleUnattendClick: function (e) {
    // Prevent default so we don't also fire a click on the card
    e.stopPropagation();
    this.props.onUnattendClick(this.props.activity);
  },
  render: function() {
    var optionString = ['Edit', 'Go along', 'Cancel attending'][this.getCardsOption()];
    var onOptionClick = (() => {
      switch(this.getCardsOption()) {
        case OPTIONS.edit:
          return this.handleEditClick;
          break;
        case OPTIONS.attend:
          return this.handleAttendClick;
          break;
        case OPTIONS.undoAttend:
          return this.handleUnattendClick;
          break;
      }
    })();

    return (
      <Card backgroundColor={this.props.activity.is_attending ? '#cdf9c9' : undefined} onClick={this.handleCardClick}>
        <div style={{padding: '24px'}}>
          <FriendIcon thumbnail={this.props.activity.thumbnail}/>
          {/* This forces the title to not wrap around the bottom of the icon */}
          <div style={{overflow: 'hidden'}}>
            { /* Title section */ }
            {
              this.props.activity.is_creator ? (
                <span><b>You</b> are </span>
              ) : (
                <span><b>{this.props.activity.creator_name}</b> is </span>
              )
            }
            <b>{this.props.activity.title}</b> {this.getDateString()}
            {
              /* Description and attendees */
              <Collapse isOpened={this.props.selected}>
                <div style={{paddingTop: '16px'}}>
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
              </Collapse>
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

module.exports = ActivityCard;
