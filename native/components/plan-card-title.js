import React from 'react';
import { Text } from 'react-native';

// TODO: Refactor these to elsewhere
const styles = {
  text: {
    color: 'black',
    fontSize: 16,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600'
  },
}

// TODO: Refactor this to elsewhere
// E.g. "tomorrow at 2pm", or "on Wednesday at 8pm"
// TODO: Render 0AM as Midnight
const getDateString = (dateTime) => {
  const today = Date.today();
  const tomorrow = (Date.today()).add(1).days();
  // This is a copy of the date (time stripped) used for date comparison
  const dateCopy = dateTime.clone().clearTime();
  let str = '';
  if (today.equals(dateCopy)) {
    str += 'today ';
  } else if (tomorrow.equals(dateCopy)) {
    str += 'tomorrow ';
  } else {
    str += 'on ' + dateTime.toString('dddd') + ' ' + dateTime.toString('dS') + ' ' + dateTime.toString('MMM') + ' ';
  }
  str += 'at ' + dateTime.toString('h');
  const minutes = dateTime.toString('mm');
  if (minutes !== '00') {
    str += ':' + minutes;
  }
  str += dateTime.toString('tt').toLowerCase();
  return str;
}

export default function (props) {
  return (
    <Text style={styles.text}>
      <Text style={styles.boldText}>
        { props.creatorName }
      </Text>
      <Text> will be </Text>
      <Text style={styles.boldText}>
        { props.title + ' ' }
      </Text>
      <Text>
         { getDateString(props.startTime) }
      </Text>
    </Text>
  )
}
