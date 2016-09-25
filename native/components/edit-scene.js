import React from 'react'
import { ScrollView } from 'react-native'
import PlanCardList from './plan-card-list.js'
import If from './if.js'
import Hint from './hint.js'
import EditPlanCard from './edit-plan-card.js'

const EditScene = (props) => {
  return (
    <ScrollView>
      <If condition={ props.creating }>
        <Hint text="Let friends using the app know what you have planned so they can tag along." />
      </If>
      <EditPlanCard
        plan={ props.plan }
        userName={ props.userName }
        onSaveClick={ props.onSaveClick }
        onCreateClick={ props.onCreateClick }
        onDeleteClick={ props.onDeleteClick }
        creating={ props.creating }
      />
      <If condition={ props.creating }>
        <Hint
          text="Withapp does not post to Facebook"
          style={{ fontSize: 12, opacity: 0.7 }}
        />
      </If>
    </ScrollView>
  )
}

export default EditScene
