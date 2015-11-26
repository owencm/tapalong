import React from 'react';
import m from '../m.js';
import RaisedButton from './raised-button.js';
import Card from './card.js';

let ActivityCardListPlaceholder = (props) => {
  let styles = {
    container: {
      width: '100%',
      // Set to 80% as a hack so the fab doesn't create a scroll
      height: '80%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inner: {
      maxWidth: '300px',
      color: '#555',
      textAlign: 'center',
      lineHeight: '1.4em'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
          <div>When your friends have plans you can join, you'll see them here.</div>
          <RaisedButton
            label='Make a Plan'
            onClick={props.onCreateClick}
          />
      </div>
    </div>
  );
}

module.exports = ActivityCardListPlaceholder;
