import React from 'react'
import NavigationButtons from '../LearningModules/NavigationButtons'

const MainProfile = () => {
  return (
    <>
      <h1><strong>Work here kun</strong></h1>
      <NavigationButtons 
      buttons = {[{name: "Update Profile", link:"/profile/update"}]}
      includeModules = {false}
      />
    </>
  )
}

export default MainProfile
