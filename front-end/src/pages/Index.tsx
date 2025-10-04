import React from 'react'
import Galaxy from '../components/reactBits/Galaxy'

const Index = () => {
  return (
    <div className='w-screen h-screen '>
      <Galaxy
        density={0.5}
        glowIntensity={0.2}
        saturation={0}
        hueShift={150}
        twinkleIntensity={0.3}
        rotationSpeed={0.05}
        repulsionStrength={1}
        starSpeed={0.2}
        speed={0.5}
      />
      <div className='absolute top-0 left-0 w-full flex justify-center items-center p-4'>
      </div>
    </div>
  )
}

export default Index