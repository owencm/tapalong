// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');
var TextAreaAutoResize = require('react-textarea-autosize');

// Require core logic
var models = require('./models.js');
var swLibrary = require('./swsetup.js');

module.exports = React.createClass({
  displayName: 'exports',

  getInitialState: function getInitialState() {
    return {
      title: this.props.activity ? this.props.activity.title : '',
      description: this.props.activity ? this.props.activity.description : '',
      start_time: this.props.activity ? this.props.activity.start_time : Date.today().add(1).days().set({ hour: 16 }),
      saving: false
    };
  },
  componentDidMount: function componentDidMount() {
    // Focus the title input if we're creating
    if (!this.props.activity) {
      this.refs.titleInput.getDOMNode().focus();
    }
    // Disabled as it scrolled poorly on iOS
    // this.refs.titleInput.getDOMNode().scrollIntoView();
    // TODO: If we scrolled into view the elem may be hidden behind the header
  },
  handleTitleChange: function handleTitleChange(e) {
    this.setState({ title: e.target.value });
  },
  handleDescriptionChange: function handleDescriptionChange(e) {
    this.setState({ description: e.target.value });
  },
  handleDateChange: function handleDateChange(e) {
    // Note date will parse the date as if it was UTC, and then convert it into local TZ
    var newDate = new Date(e.target.value);
    // To solve the parsing as UTC issue we add the timezone offset
    newDate.addMinutes(newDate.getTimezoneOffset());
    var newStartTime = this.state.start_time.clone();
    // Set the date component of the state without modifying time
    newStartTime.set({
      day: newDate.getDate(),
      month: newDate.getMonth(),
      // Year values start at 1900
      year: 1900 + newDate.getYear()
    });
    console.log(newStartTime);
    this.setState({ start_time: newStartTime });
  },
  handleTimeChange: function handleTimeChange(e) {
    var tmp = e.target.value.split(':');
    var hour = parseInt(tmp[0]);
    var minute = parseInt(tmp[1]);
    var oldStartTime = this.state.start_time.clone();
    var newStartTime = oldStartTime.set({
      hour: hour,
      minute: minute
    });
    this.setState({ start_time: newStartTime });
  },
  handleSaveClicked: function handleSaveClicked(e) {
    var thisButton = e.target;
    this.setState({ saving: true });

    var activityChanges = { title: this.state.title, description: this.state.description, start_time: this.state.start_time };

    models.activities.tryUpdateActivity(this.props.activity, activityChanges, (function () {
      this.props.onSaveComplete();
    }).bind(this), function () {
      alert('An error occurred! Sorry. Please refresh.');
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
    models.activities.tryCreateActivity(newActivity, (function () {
      this.props.onCreateComplete();
    }).bind(this), function () {
      // thisButton.classList.toggle('disabled', false);
      alert('Sorry, something went wrong. Please check you entered the information correctly.');
      throw "Adding to server failed. Help the user understand why";
    });
  },
  handleDeleteClicked: function handleDeleteClicked() {
    if (confirm('This will notify friends coming that the event is cancelled and remove it from the app. Confirm?')) {
      models.activities.tryCancelActivity(this.props.activity, (function () {
        this.onDeleteComplete();
      }).bind(this), function () {
        alert('An error occurred! Sorry :(. Please refresh.');
        throw "Cancelling on server failed. Help the user understand why";
      });
    } else {
      // Do nothing
    }
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
      outline: 'none',
      // This prevents iOS from rounding corners on input elements
      borderRadius: 0
    };
    // Set up the options on the card
    var options = [];
    var defaultOption;
    if (editing) {
      defaultOption = { label: 'Save', onClick: this.handleSaveClicked };
      if (this.state.saving) {
        defaultOption.label = 'Saving...';
        defaultOption.disabled = true;
      }
      var deleteOption = { label: 'Delete', onClick: this.handleDeleteClicked, position: 'left', type: 'bad' };
      options.push(deleteOption);
    } else {
      defaultOption = { label: 'Create', onClick: this.handleCreateClicked };
    }
    options.push(defaultOption);
    // Provide dates and times for the input elements
    // Documentation for date formatting: https://code.google.com/p/datejs/wiki/FormatSpecifiers
    var getHyphenSeparatedTime = function getHyphenSeparatedTime(date) {
      return date.toString('HH:mm');
    };
    var getHyphenSeparatedDate = function getHyphenSeparatedDate(date) {
      return date.toString('yyyy-MM-dd');
    };
    var getHyphenSeparatedToday = function getHyphenSeparatedToday() {
      return Date.today().toString('yyyy-MM-dd');
    };
    var getHyphenSeparatedTomorrow = function getHyphenSeparatedTomorrow() {
      return Date.today().add(1).days().toString('yyyy-MM-dd');
    };
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
        React.createElement('input', {
          ref: 'titleInput',
          type: 'text',
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
          min: getHyphenSeparatedToday(),
          value: getHyphenSeparatedDate(this.state.start_time),
          onChange: this.handleDateChange,
          required: true }),
        React.createElement('input', {
          type: 'time',
          style: m(inputStyle, { float: 'right', fontSize: '1em', width: '150px' }),
          className: 'input-placeholder-lighter focusUnderline',
          step: '900',
          value: getHyphenSeparatedTime(this.state.start_time),
          onChange: this.handleTimeChange,
          required: true }),
        React.createElement('div', { style: { clear: 'both' } }),
        React.createElement(TextAreaAutoResize, {
          id: 'description',
          style: inputStyle,
          className: 'focusUnderline',
          placeholder: 'Extra information (where? when? what?)',
          rows: '1',
          maxRows: '8',
          value: this.state.description,
          onChange: this.handleDescriptionChange })
      ),
      React.createElement(CardOptions, { options: options })
    );
  }
});
