import React from 'react'
import {
  View,
  Text,
  TextInput,
  DatePickerIOS,
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
// import DatePicker from 'react-native-datepicker'

// TODO: set form fields to blur after enter pressed
// titleInputElem.addEventListener('keydown', function(key) {
//   if (key.keyCode == 13) {
//     this.blur();
//   }
// });

export default class EditPlanCard extends React.Component {

  constructor(props) {
    super(props)
    const hasPlan = !!this.props.plan
    const tomorrowFourPm = Date.today().add(1).days().set({hour: 16});
    const todayFourPm = Date.today().set({hour: 16});
    const initialDateTime = todayFourPm - Date.now() > 0 ? todayFourPm : tomorrowFourPm
    this.state = {
      title: hasPlan && this.props.plan.title ? this.props.plan.title : '',
      description: hasPlan && this.props.plan.description ? this.props.plan.description : '',
      startTime: hasPlan && this.props.plan.startTime ? this.props.plan.startTime : initialDateTime,
      saveRequestPending: false,
      deleteRequestPending: false,
    }
  }

  componentDidMount() {
    // Focus the title input if we're creating
    if (!this.props.plan) {
      this.refs.titleInput.focus();
    }
    // Scroll to the top of the page to ensure the editing screen is visible
    // scroll(window, 0);
  }

  handleTitleChange(newTitle) {
    // console.log(arguments)
    this.setState({title: newTitle});
    // this.setState({title: event.target.value});
  }

  handleTitleKeyDown(event) {
    if (event.keyCode == 13 ) {
      this.refs.dateInput.focus();
    }
  }

  handleDescriptionChange(description) {
    this.setState({ description });
  }

  handleDateTimeChange(date){
    this.setState({ startTime: date })
  }

  handleSaveClick() {
    let planChanges = {
      title: this.state.title,
      description: this.state.description,
      startTime: this.state.startTime
    }
    this.setState({ saveRequestPending: true })
    this.props.onSaveClick(this.props.plan, planChanges).catch((e) => {
      this.setState({ saveRequestPending: false })
      console.log('Could not save plan', e)
    });
  }

  handleCreateClick() {
    let newPlan = {
      title: this.state.title,
      startTime: this.state.startTime,
      location: '',
      max_attendees: -1,
      description: this.state.description
    };
    this.setState({ saveRequestPending: true })
    this.props.onCreateClick(newPlan).catch((e) => {
      this.setState({ saveRequestPending: false })
      console.log('Could not create plan', e)
    });
  }

  handleDeleteClick() {
    // if (confirm('This will notify friends coming that the event is cancelled and remove it from the app. Confirm?')) {
      this.setState({ deleteRequestPending: true });
      this.props.onDeleteClick(this.props.plan);
    // } else {
      // Do nothing
    // }
  }

  getOptions(editing) {
    // Set up the options on the card
    let options = [];
    if (editing) {
      if (this.state.saveRequestPending) {
        options.push({label: 'Saving...', disabled: true, onClick: this.handleSaveClick.bind(this)});
      } else {
        options.push({label: 'Save', onClick: this.handleSaveClick.bind(this)});
      }
      if (this.state.deleteRequestPending) {
        options.push({label: 'Deleting...', disabled: true, position: 'left', type: 'bad', onClick: this.handleDeleteClick.bind(this)});
      } else {
        options.push({label: 'Delete', position: 'left', type: 'bad', onClick: this.handleDeleteClick.bind(this)});
      }
    } else {
      if (this.state.saveRequestPending) {
        options.push({label: 'Loading...', disabled: true, onClick: this.handleCreateClick.bind(this)});
      } else {
        options.push({label: 'Done', onClick: this.handleCreateClick.bind(this)});
      }
    }
    return options
  }

  render() {
    // console.log('Rendering form with state and props', this.state, this.props)
    let editing = !this.props.creating;
    /*
      Set up styles
    */
    let inputContainerStyle = {
      height: 20,
      flex: 1,
      // display: 'block',
      // boxSizing: 'border-box',
      marginVertical: 10,
      marginHorizontal: 0,
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

    const bigInputViewStyle = {
      height: 48,
    }

    const bigInputStyle = {
      fontSize: 18,
    }

    const options = this.getOptions(editing)

    // const placeholders = [
    //   'hanging out in Dolores park',
    //   'going to SF Moma',
    //   'working at my place',
    //   'hiking in Santa Cruz',
    //   'playing board games',
    // ]
    //
    // const random = (from, to) => { return from + Math.floor(Math.random()*(to-from+1)) }

    // const placeholder = placeholders[random(0, placeholders.length - 1)]

    const placeholder = 'playing board games'

    return (
      <Card>
        <View style={{padding: 16, paddingBottom: 8}}>
          <Text><Text>{this.props.userName}</Text> will be </Text>
          <View style={ m(inputContainerStyle, bigInputViewStyle) }>
            <TextInput
              ref='titleInput'
              style={ m(bigInputViewStyle, bigInputStyle) }
              value={ this.state.title }
              placeholder={ placeholder }
              // onChange={ this.handleTitleChange }
              onChangeText={ this.handleTitleChange.bind(this) }
              onKeyDown={ this.handleTitleKeyDown.bind(this) }
              required
              autoCapitalize='none'
            />
        </View>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#DDD',
              marginBottom: 10
            }}
          >
            {
            /* <DatePicker
              customStyles={{
                dateInput: {
                  borderWidth: 0,
                  alignItems: 'flex-start',
                  flex: 1,
                }
              }}
              showIcon={false}
              mode='datetime'
              confirmBtnText='Confirm'
              cancelBtnText='Cancel'
              format='dddd Do MMMM, ha'
              min={ Date.today() }
              date={ this.state.startTime }
              onDateChange={ ((_, date) => this.handleDateTimeChange(date)).bind(this) }
              style={{ flexDirection: 'row' }}
              />*/
            }
            <DatePickerIOS
              mode='datetime'
              confirmBtnText='Confirm'
              cancelBtnText='Cancel'
              format='dddd Do MMMM, ha'
              minimumDate={ Date.today() }
              date={ this.state.startTime }
              onDateChange={ (date => this.handleDateTimeChange(date)).bind(this) }
            />
          </View>
          <AutoExpandingTextInput
            style={ inputContainerStyle }
            placeholder='Extra information (what? where?)'
            rows={ 1 }
            maxRows={ 8 }
            value={ this.state.description }
            onChangeText={ this.handleDescriptionChange.bind(this) }
          >
          </AutoExpandingTextInput>
        </View>
        <CardOptions options={ options }/>
      </Card>
    )
  }
}

// handleDateChange(event) {
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
// }
//
// handleTimeChange(event) {
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
