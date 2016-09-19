import React from 'react'
import {
  View,
  Text,
  TextInput,
} from 'react-native'
import m from '../m.js'
import Card from './card.js'
import CardOptions from './card-options.js'
// import TextAreaAutoResize from 'react-textarea-autosize'
import AutoExpandingTextInput from './auto-expanding-text-input.js'
import {
  isDateValid,
  getHyphenSeparatedTime,
  getHyphenSeparatedDate,
  getHyphenSeparatedToday,
  getHyphenSeparatedTomorrow,
} from '../lib/date-helpers.js'
import DatePicker from 'react-native-datepicker'

// TODO: set form fields to blur after enter pressed
// titleInputElem.addEventListener('keydown', function(key) {
//   if (key.keyCode == 13) {
//     this.blur();
//   }
// });

const EditActivityCard = React.createClass({

  getInitialState: function () {

    const tomorrowFourPm = Date.today().add(1).days().set({hour: 16});
    const todayFourPm = Date.today().set({hour: 16});
    return {
      title: this.props.activity ? this.props.activity.title : '',
      description: this.props.activity ? this.props.activity.description : '',
      startTime: this.props.activity ? this.props.activity.startTime : todayFourPm,
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
    // scroll(window, 0);
  },

  handleTitleChange: function (newTitle) {
    console.log(arguments)
    this.setState({title: newTitle});
    // this.setState({title: event.target.value});
  },

  handleTitleKeyDown: function(event) {
    if (event.keyCode == 13 ) {
      this.refs.dateInput.focus();
    }
  },

  handleDescriptionChange: function (description) {
    this.setState({ description });
  },

  handleDateTimeChange: function (date){
    console.log(date)
    this.setState({ startTime: date })
  },

  handleSaveClick: function () {
    let activityChanges = {title: this.state.title, description: this.state.description, startTime: this.state.startTime};
    this.setState({ saveRequestPending: true });
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
    this.setState({ saveRequestPending: true });
    this.props.onCreateClick(newActivity);
  },

  handleDeleteClick: function () {
    // if (confirm('This will notify friends coming that the event is cancelled and remove it from the app. Confirm?')) {
      this.setState({ deleteRequestPending: true });
      this.props.onDeleteClick(this.props.activity);
    // } else {
      // Do nothing
    // }
  },

  getOptions: function(editing) {
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
        options.push({label: 'Loading...', disabled: true, onClick: this.handleCreateClick});
      } else {
        options.push({label: 'Done', onClick: this.handleCreateClick});
      }
    }
    return options
  },

  render: function () {
    console.log('rendering form with state', this.state)
    let editing = !!this.props.activity;
    /*
      Set up styles
    */
    let inputStyle = {
      height: 20,
      flex: 1,
      // display: 'block',
      // boxSizing: 'border-box',
      marginVertical: 10,
      marginHorizontal: 0,
      padding: 10,
      paddingLeft: 0,
      // borderTop: 'none',
      // borderRight: 'none',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      // borderLeft: 'none',
      backgroundColor: 'rgba(0,0,0,0)',
      // outline: 'none',
      // This prevents iOS from rounding corners on input elements
      borderRadius: 0,
      // fontFamily: 'inherit',
      // fontSize: 'inherit'
    };

    const bigInputStyle = {
      fontSize: 18,
      height: 48,
    }

    const options = this.getOptions(editing)

    return (
      <Card>
        <View style={{padding: 16, paddingBottom: 8}}>
          <Text><Text>{this.props.userName}</Text> is planning on</Text>
          <TextInput
            ref='titleInput'
            style={ m(inputStyle, bigInputStyle) }
            value={ this.state.title }
            placeholder='Watching Game of Thrones'
            // onChange={ this.handleTitleChange }
            onChangeText={ this.handleTitleChange }
            onKeyDown={ this.handleTitleKeyDown }
            required
            multiline
          >
          </TextInput>
          <DatePicker
            customStyles={{
              dateInput: {
                borderWidth: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#DDD',
                alignItems: 'flex-start',
              }
            }}
            showIcon={false}
            mode='datetime'
            confirmBtnText='Confirm'
            cancelBtnText='Cancel'
            format='MM/DD/YY HH:mm'
            min={ Date.today() }
            date={ this.state.startTime }
            onDateChange={ this.handleDateTimeChange }
            style={{ marginBottom: 10 }}
          >
          </DatePicker>
          <AutoExpandingTextInput
            style={ inputStyle }
            placeholder='Extra information (what? where?)'
            rows={ 1 }
            maxRows={ 8 }
            value={ this.state.description }
            onChangeText={ this.handleDescriptionChange }
          >
          </AutoExpandingTextInput>
        </View>
        <CardOptions options={ options }/>
      </Card>
    )
  }
});

export default EditActivityCard


// handleDateChange: function (event) {
//   // Note date will parse the date as if it was UTC, and then convert it into local TZ
//   let newDate = new Date(event.target.value);
//   // Abort the change if the date isn't valid
//   if (!isDateValid(newDate)) {
//     return;
//   };
//   // To solve the parsing as UTC issue we add the timezone offset
//   newDate.addMinutes(newDate.getTimezoneOffset());
//   let newStartTime = this.state.startTime.clone();
//   // Set the date component of the state without modifying time
//   newStartTime.set({
//     day: newDate.getDate(),
//     month: newDate.getMonth(),
//     // Year values start at 1900
//     year: 1900 + newDate.getYear()
//   });
//   this.setState({startTime: newStartTime});
// },
//
// handleTimeChange: function (event) {
//   let tmp = event.target.value.split(':');
//   let hour = parseInt(tmp[0]);
//   let minute = parseInt(tmp[1]);
//   let oldStartTime = this.state.startTime.clone();
//   let newStartTime = oldStartTime.set({
//     hour: hour,
//     minute: minute
//   });
//   // Abort the change if the date isn't valid
//   if (!isDateValid(newStartTime)) {
//     return;
//   };
//   this.setState({startTime: newStartTime});
// },