// TODO: Move calls to models into main.js via actions

// Require react, convenience libraries and UI components
var React = require('react');
var m = require('../m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');
var TextAreaAutoResize = require('react-textarea-autosize');

// Require core logic
// TODO: Refactor out these requirements
var models = require('../models.js');
var swLibrary = require('../swsetup.js')

// TODO: set form fields to blur after enter pressed
  // titleInputElem.addEventListener('keydown', function(key) {
  //   if (key.keyCode == 13) {
  //     this.blur();
  //   }
  // });

let EditActivity = React.createClass({

  getInitialState: function () {
    return {
      title: this.props.activity ? this.props.activity.title : '',
      description: this.props.activity ? this.props.activity.description : '',
      start_time: this.props.activity ? this.props.activity.start_time : Date.today().add(1).days().set({hour: 16}),
      saveRequestPending: false,
      deleteRequestPending: false,
    };
  },

  componentDidMount: function () {
    // Focus the title input if we're creating
    if (!this.props.activity) {
      this.refs.titleInput.focus();
    }
    // Scroll to the top of the page to ensure the editing screen is visible
    scroll(window, 0);
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

  handleSaveClicked: function () {
    let activityChanges = {title: this.state.title, description: this.state.description, start_time: this.state.start_time};
    this.setState({saveRequestPending: true});
    this.props.onSaveClicked(this.props.activity, activityChanges);
  },

  handleCreateClicked: function () {
    let newActivity = {
      title: this.state.title,
      start_time: this.state.start_time,
      location: '',
      max_attendees: -1,
      description: this.state.description
    };
    this.setState({saveRequestPending: true});
    this.props.onCreateClicked(newActivity);
  },

  handleDeleteClicked: function () {
    if (confirm('This will notify friends coming that the event is cancelled and remove it from the app. Confirm?')) {
      this.setState({deleteRequestPending: true});
      this.props.onDeleteClicked(this.props.activity);
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
      borderRadius: 0,
      fontFamily: 'inherit',
      fontSize: 'inherit'
    };
    // Set up the options on the card
    var options = [];
    if (editing) {
      if (this.state.saveRequestPending) {
        options.push({label: 'Saving...', disabled: true, onClick: this.handleSaveClicked});
      } else {
        options.push({label: 'Save', onClick: this.handleSaveClicked});
      }
      if (this.state.deleteRequestPending) {
        options.push({label: 'Deleting...', disabled: true, position: 'left', type: 'bad', onClick: this.handleDeleteClicked});
      } else {
        options.push({label: 'Delete', position: 'left', type: 'bad', onClick: this.handleDeleteClicked});
      }
    } else {
      if (this.state.saveRequestPending) {
        options.push({label: 'Creating...', disabled: true, onClick: this.handleCreateClicked});
      } else {
        options.push({label: 'Create', onClick: this.handleCreateClicked});
      }
    }
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
          <b>{this.props.userName}</b> is planning on<br />
          <input
            ref='titleInput'
            type='text'
            style={m(inputStyle, {fontSize: '1.2em'})}
            className='input-placeholder-lighter focusUnderline'
            value={this.state.title}
            placeholder='Watching Frozen'
            autoCapitalize='words'
            required
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
            rows={1}
            maxRows={8}
            value={this.state.description}
            onChange={this.handleDescriptionChange}>
          </TextAreaAutoResize>
        </div>
        <CardOptions options={options}/>
      </Card>
    )
  }
});

module.exports = EditActivity;
