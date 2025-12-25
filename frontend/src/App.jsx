import React, { useState } from 'react';
import CameraComponent from './components/video_component';
import Dashboard from './components/Dashboard';
import logo from './assets/riverbot.png';

export default function App() {
  const [view, setView] = useState('camera'); // 'camera' or 'dashboard'

  return (
    <div className="min-h-screen min-w-full">
      {/* Navigation */}
      {/* <nav className="bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-[2rem] py-4 flex gap-4 items-center">
          <img src={logo} alt='RiverBot logo' className='h-12' />
          <h1 className="text-2xl font-bold text-sky-600 justify-start flex">RiverBot</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setView('camera')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'camera'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎥 Camera
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'dashboard'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
          </div>
        </div>
      </nav> */}

      {/* Main Content */}
      <main className='w-[99dvw] h-screen flex justify-around'>
        {/* {view === 'camera' ? <CameraComponent /> : <Dashboard />} */}
        <div className='min-w-[45dvw]'>
        <CameraComponent />
        </div>
        <div className='min-w-[50dvw] max-h-screen'>
          <Dashboard />
        </div>

      </main>
    </div>
  );
}