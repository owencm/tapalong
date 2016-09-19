import React from 'react'
import { View } from 'react-native'
import ActivityCardList from './activity-card-list.js'
import If from './if.js'
import Hint from './hint.js'
import EditActivityCard from './edit-activity-card.js'

const EditScene = (props) => {
  return (
    <View>
      <If condition={ props.creating }>
        <Hint text="Let friends using the app know what you have planned so they can tag along." />
      </If>
      <EditActivityCard
        activity={ props.activity }
        userName={ props.userName }
        onSaveClick={ props.onSaveClick }
        onCreateClick={ props.onCreateClick }
        onDeleteClick={ props.onDeleteClick }
      />
      <If condition={ props.creating }>
        <Hint
          text="Up Dog will never post to Facebook on your behalf."
          style={{ fontSize: '0.85em', padding: 12, opacity: 0.7 }}
        />
      </If>
    </View>
  )
}

export default EditScene