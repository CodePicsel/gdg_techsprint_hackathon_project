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
  ]

  return (
    <div className="w-screen h-screen flex overflow-hidden">

      {/* LEFT: Camera */}
      <div className="w-1/2 h-full">
        <CameraComponent />
      </div>

      {/* RIGHT: Stats */}
      <div className="w-1/2 h-full grid grid-cols-2 gap-2 p-2 overflow-auto">
        {stats.map((stat, index) => {
          const isLast = index === stats.length - 1

          return (
            <div
              key={index}
              className={isLast ? "col-span-2" : ""}
            >
              <StatCard {...stat} />
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default Index
