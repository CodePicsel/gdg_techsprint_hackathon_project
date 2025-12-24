import React, { useEffect, useEffectEvent, useState } from 'react'

function data() {

    const [data, setData] = useState(null)

    useEffect(() => {
        fetch('API')
    })

  return (
    <div>
      
    </div>
  )
}

export default data