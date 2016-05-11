import React from 'react';
import m from '../m.js';
import Card from './card.js';
import CardOptions from './card-options.js';
import TextAreaAutoResize from 'react-textarea-autosize';
import isDateValid from '../is-date-valid.js';

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
      startTime: this.props.activity ? this.props.activity.startTime : Date.today().add(1).days().set({hour: 16}),
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

  handleTitleChange: function (event) {
    this.setState({title: event.target.value});
  },

  handleTitleKeyDown: function(event) {
    if (event.keyCode == 13 ) {
      this.refs.dateInput.focus();
    }
  },

  handleDescriptionChange: function (event) {
    this.setState({description: event.target.value});
  },

  handleDateChange: function (event) {
    // Note date will parse the date as if it was UTC, and then convert it into local TZ
    let newDate = new Date(event.target.value);
    // Abort the change if the date isn't valid
    if (!isDateValid(newDate)) {
      return;
    };
    // To solve the parsing as UTC issue we add the timezone offset
    newDate.addMinutes(newDate.getTimezoneOffset());
    let newStartTime = this.state.startTime.clone();
    // Set the date component of the state without modifying time
    newStartTime.set({
      day: newDate.getDate(),
      month: newDate.getMonth(),
      // Year values start at 1900
      year: 1900 + newDate.getYear()
    });
    this.setState({startTime: newStartTime});
  },

  handleTimeChange: function (event) {
    let tmp = event.target.value.split(':');
    let hour = parseInt(tmp[0]);
    let minute = parseInt(tmp[1]);
    let oldStartTime = this.state.startTime.clone();
    let newStartTime = oldStartTime.set({
      hour: hour,
      minute: minute
    });
    // Abort the change if the date isn't valid
    if (!isDateValid(newStartTime)) {
      return;
    };
    this.setState({startTime: newStartTime});
  },

  handleSaveClick: function () {
    let activityChanges = {title: this.state.title, description: this.state.description, startTime: this.state.startTime};
    this.setState({saveRequestPending: true});
    this.props.onSaveClick(this.props.activity, activityChanges);
  },

  handleCreateClick: function () {
    let newActivity = {
      title: this.state.title,
      startTime: this.state.startTime,
      location: '',
      max_attendees: -1,
      description: this.state.description
    };
    this.setState({saveRequestPending: true});
    this.props.onCreateClick(newActivity);
  },

  handleDeleteClick: function () {
    if (confirm('This will notify friends coming that the event is cancelled and remove it from the app. Confirm?')) {
      this.setState({deleteRequestPending: true});
      this.props.onDeleteClick(this.props.activity);
    } else {
      // Do nothing
    }
  },

  render: function () {
    let editing = !!this.props.activity;
    /*
      Set up styles
    */
    let inputStyle = {
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
    let options = [];
    if (editing) {
      if (this.state.saveRequestPending) {
        options.push({label: 'Saving...', disabled: true, onClick: this.handleSaveClick});
      } else {
        options.push({label: 'Save', onClick: this.handleSaveClick});
      }
      if (this.state.deleteRequestPending) {
        options.push({label: 'Deleting...', disabled: true, position: 'left', type: 'bad', onClick: this.handleDeleteClick});
      } else {
        options.push({label: 'Delete', position: 'left', type: 'bad', onClick: this.handleDeleteClick});
      }
    } else {
      if (this.state.saveRequestPending) {
        options.push({label: 'Creating...', disabled: true, onClick: this.handleCreateClick});
      } else {
        options.push({label: 'Create', onClick: this.handleCreateClick});
      }
    }
    // Provide dates and times for the input elements
    // Documentation for date formatting: https://code.google.com/p/datejs/wiki/FormatSpecifiers
    let getHyphenSeparatedTime = function(date) {
      return date.toString('HH:mm');
    }
    let getHyphenSeparatedDate = function(date) {
      return date.toString('yyyy-MM-dd');
    }
    let getHyphenSeparatedToday = function () {
      return Date.today().toString('yyyy-MM-dd');
    }
    let getHyphenSeparatedTomorrow = function () {
      return Date.today().add(1).days().toString('yyyy-MM-dd');
    }
    return (
      <Card>
        <div style={{padding: '24px', paddingBottom: '6px'}}>
          <b>{this.props.userName}</b> is planning on<br />
          <input
            ref='titleInput'
            type='text'
            style={m(inputStyle, {fontSize: '1.2em'})}
            className='input-placeholder-lighter focusUnderline'
            value={this.state.title}
            placeholder='Watching Spectre'
            required
            onChange={this.handleTitleChange}
            onKeyDown={this.handleTitleKeyDown}>
          </input>
          <input
            ref='dateInput'
            type='date'
            style={m(inputStyle, {float: 'left', fontSize: '1em', width: 'auto'})}
            className='input-placeholder-lighter focusUnderline'
            min={getHyphenSeparatedToday()}
            value={ getHyphenSeparatedDate(this.state.startTime) }
            onChange={this.handleDateChange}
            required>
          </input>
          <input
            type='time'
            style={m(inputStyle, {float: 'right', fontSize: '1em', width: '150px'})}
            className='input-placeholder-lighter focusUnderline'
            step="900"
            value={ getHyphenSeparatedTime(this.state.startTime) }
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
