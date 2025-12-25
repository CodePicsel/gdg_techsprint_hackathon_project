import React, { useState } from 'react';
import CameraComponent from './components/video_component';
import Dashboard from './components/Dashboard';

export default function App() {
  const [view, setView] = useState('camera'); // 'camera' or 'dashboard'

  return (
    <div className="min-h-screen min-w-full bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">RiverBot</h1>
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
      </nav>

      {/* Main Content */}
      <main className='w-[100dvw]'>
        {view === 'camera' ? <CameraComponent /> : <Dashboard />}
      </main>
    </div>
  );
}