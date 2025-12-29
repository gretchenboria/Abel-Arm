import React from 'react';
import { ServoId, RobotState } from '../types';
import { Sliders, Hand, Activity, XOctagon } from 'lucide-react';

interface ControlPanelProps {
  positions: RobotState;
  isConnected: boolean;
  onMove: (id: ServoId, angle: number) => void;
  onSequence: (name: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ positions, isConnected, onMove, onSequence }) => {
  
  const sliders = [
    { id: ServoId.Base, label: "Base (Rotation)", min: 0, max: 180 },
    { id: ServoId.Shoulder, label: "Shoulder (Fwd/Back)", min: 0, max: 180 },
    { id: ServoId.Elbow, label: "Elbow (Up/Down)", min: 0, max: 180 },
    { id: ServoId.Gripper, label: "Gripper (Claw)", min: 60, max: 120 }, 
  ];

  // Helper for button styles
  const btnClass = (active: boolean) => `
    p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 group relative overflow-hidden
    ${active 
      ? 'bg-neutral-800 border-neutral-600 hover:border-red-600 hover:bg-neutral-800 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
      : 'bg-neutral-900/40 border-neutral-800 opacity-40 cursor-not-allowed grayscale'}
  `;

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl">
      {/* Quick Actions */}
      <div>
        <h3 className="text-neutral-400 font-bold uppercase tracking-widest text-xs mb-3 ml-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            Sequences
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => onSequence('WAVE')} className={btnClass(isConnected)} disabled={!isConnected}>
            <Hand className={`w-6 h-6 group-hover:text-red-500 transition-colors ${isConnected ? 'text-white' : 'text-neutral-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">Wave</span>
            </button>
            
            <button onClick={() => onSequence('NOD_YES')} className={btnClass(isConnected)} disabled={!isConnected}>
            <Activity className={`w-6 h-6 group-hover:text-red-500 transition-colors ${isConnected ? 'text-white' : 'text-neutral-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">Nod Yes</span>
            </button>

            <button onClick={() => onSequence('SHAKE_NO')} className={btnClass(isConnected)} disabled={!isConnected}>
            <XOctagon className={`w-6 h-6 group-hover:text-red-500 transition-colors ${isConnected ? 'text-white' : 'text-neutral-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">Shake No</span>
            </button>

            <button onClick={() => onSequence('HAND_OVER')} className={btnClass(isConnected)} disabled={!isConnected}>
            <Sliders className={`w-6 h-6 group-hover:text-red-500 transition-colors ${isConnected ? 'text-white' : 'text-neutral-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">Hand Over</span>
            </button>
        </div>
      </div>

      {/* Manual Sliders */}
      <div className={`bg-neutral-900/80 border-2 rounded-xl p-6 shadow-xl backdrop-blur transition-all ${isConnected ? 'border-neutral-700' : 'border-neutral-800 opacity-80'}`}>
        <div className="flex justify-between items-center mb-8 border-b border-neutral-700 pb-4">
           <h3 className="text-red-500 font-gothic text-3xl flex items-center gap-3 tracking-wide">
            <Sliders className="w-6 h-6" /> Manual Override
          </h3>
          {!isConnected && <span className="text-[10px] text-red-500 font-bold uppercase border border-red-900 px-2 py-1 rounded bg-red-950/30">Disconnected</span>}
        </div>
       
        <div className="space-y-8">
          {sliders.map((s) => (
            <div key={s.id} className="relative group">
              <div className="flex justify-between text-sm text-neutral-300 mb-2 font-bold tracking-wide">
                <span className="group-hover:text-red-400 transition-colors">{s.label}</span>
                <span className="font-mono text-red-500 bg-black/50 px-2 rounded border border-red-900/50">{positions[s.id]}°</span>
              </div>
              <div className="relative h-4 flex items-center">
                 {/* Custom Track Background */}
                 <div className="absolute w-full h-2 bg-neutral-800 rounded-full border border-neutral-700 overflow-hidden">
                    <div 
                        className="h-full bg-red-900/60" 
                        style={{ width: `${(positions[s.id] / s.max) * 100}%` }}
                    ></div>
                 </div>
                 <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={positions[s.id]}
                    onChange={(e) => onMove(s.id, parseInt(e.target.value))}
                    className={`
                        relative w-full h-2 appearance-none bg-transparent cursor-pointer z-10
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-red-600
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.8)]
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-125
                    `}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};