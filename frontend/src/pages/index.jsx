import React from 'react'
import CameraComponent from '../components/video_component'
import StatCard from '../components/stat_card'

function Index() {

    const stats = [
  { label: "Plastic Detected", value: 128, unit: "items", icon: "♻️" },
  { label: "Confidence Avg", value: 92, unit: "%", icon: "🎯" },
  { label: "Frames / Sec", value: 18, unit: "fps", icon: "🎥" },
  { label: "Camera Status", value: "Active", icon: "📷" },
  { label: "Model Version", value: "YOLOv8", icon: "🧠" },
  { label: "Latency", value: 420, unit: "ms", icon: "⚡" },
  { label: "System Health", value: "All Systems Operational", icon: "🟢" }
    ];

  return (
    <div className='flex w-fi'>
        <div className='min-w-[50vw]'>
            <CameraComponent />
        </div>
        {/* <div className='min-w-[48vw]  grid grid-cols-2 grid-rows-5 gap-2 m-2'>
            {
                [...Array(7)].map((_, index) => {
                    return (
                        <div key={index}> 
                            <StatCard
                                label="Plastic Detected"
                                value={23}
                                unit="items"
                                icon="♻️"
                                status="warning"
                                trend={{ positive: false, value: 12 }}
                            />
                        </div>
                    )
                })
            }
        </div> */}
        <div className='min-w-[48vw]  grid grid-cols-2 grid-rows-5 gap-2 m-2'>
            {stats.map((stat, index) => {
                const isLast = index === stats.length - 1;

                return (
                <div
                    key={index}
                    className={isLast ? "md:col-span-2" : ""}
                >
                    <StatCard {...stat} />
                </div>
                );
            })}
        </div>


    </div>
  )
}

export default Index