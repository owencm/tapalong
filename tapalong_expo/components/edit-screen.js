import React from 'react'
import { ScrollView, View } from 'react-native'
import PlanCardList from './plan-card-list.js'
import If from './if.js'
import Hint from './hint.js'
import EditPlanCard from './edit-plan-card.js'

const EditSccreen = (props) => {
  return (
    <ScrollView keyboardShouldPersistTaps='always'>
      <If condition={ props.creating }>
        <Hint text="Let friends using the app know what you have planned so they can tag along." />
      </If>
      <EditPlanCard
        plan={ props.plan || props.planTemplate }
        userName={ props.userName }
        onSaveClick={ props.onSaveClick }
        onCreateClick={ props.onCreateClick }
        onDeleteClick={ props.onDeleteClick }
        creating={ props.creating }
      />
      <If condition={ props.creating }>
        <Hint
          text="With Plans does not post to Facebook"
          style={{ fontSize: 12, opacity: 0.7 }}
        />
      </If>
      { /* Padding to ensure the keyboard doesn't cover the save option */ }
      <View style={{ height: 300 }}></View>
    </ScrollView>
  )
}

export default EditSccreen
