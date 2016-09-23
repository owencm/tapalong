import React from 'react'
import m from '../m.js'
import {
  View,
} from 'react-native'
import PlanCard from './plan-card.js'
import PlanCardLoader from './plan-card-loader.js'
import PlanCardListPlaceholder from './plan-card-list-placeholder'

const getPlansList = (props) => {
  if (props.plansInitialized === false) {
    return <View>
      <PlanCardLoader/>
      <PlanCardLoader/>
    </View>
  }

  if (props.plans.length === 0) {
    return <PlanCardListPlaceholder onCreateClick={ props.onCreateClick } />
  }

  const handlePlanClick = (plan) => {
    // If something is selected, and it's the plan clicked...
    if (props.selectedPlan &&
        props.selectedPlan.clientId == plan.clientId) {
      props.onUnexpandPlan(plan)
    } else {
      props.onExpandPlan(plan)
    }
  }

  const planElements = props.plans.map((plan) => {
    return (
      <PlanCard
        plan={ plan }
        user={ props.user }
        onClick={ () => handlePlanClick(plan) }
        onAttendClick={ () => props.onAttendPlan(plan) }
        onUnattendClick={ () => props.onUnattendPlan(plan) }
        onEditClick={ () => props.onEditPlan(plan) }
        selected={
          !!props.selectedPlan &&
          props.selectedPlan.clientId == plan.clientId
        }
        key={ plan.clientId }
      />
    );
  });

  return planElements

}

const PlanCardList = (props) => {

  const plansList = getPlansList(props)

  return (
    <View style={ props.style } >
      { plansList }
    </View>
  )

}

export default PlanCardList;
