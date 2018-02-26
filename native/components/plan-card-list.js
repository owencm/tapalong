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

  const getPlanElement = (plan) => {

    const isSelected = props.selectedPlans &&
        props.selectedPlans.indexOf(plan.id) >= 0;

    const handlePlanClick = (plan) => {
      if (isSelected) {
        props.onUnexpandPlan(plan.id)
      } else {
        props.onExpandPlan(plan.id)
      }
    }

    return (
      <PlanCard
        plan={ plan }
        user={ props.user }
        onClick={ () => handlePlanClick(plan) }
        onAttendClick={ () => props.onAttendPlan(plan) }
        onUnattendClick={ () => props.onUnattendPlan(plan) }
        onEditClick={ () => props.onEditPlan(plan) }
        onReportClick={ () => props.onReportPlan(plan) }
        onBlockClick={ () => props.onBlockUser(plan.creator.id) }
        selected={ isSelected }
        key={ plan.clientId }
      />
    );
  }

  return props.plans.map(getPlanElement);
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
