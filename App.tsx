import React, { useState } from 'react';
import { useAbel } from './hooks/useAbel';
import { AbelFace } from './components/AbelFace';
import { ControlPanel } from './components/ControlPanel';
import { HelpModal } from './components/HelpModal';
import { SEQUENCES } from './constants';
import { Usb, Terminal, HeartCrack, CircleHelp, Moon, Sun, Flower } from 'lucide-react';

const App: React.FC = () => {
  const { 
    isConnected,
    isSimulated,
    positions, 
    mood, 
    logs, 
    connect, 
    disconnect, 
    toggleSimulation,
    moveServo, 
    runSequence 
  } = useAbel();

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleSequence = (name: string) => {
    const seq = (SEQUENCES as any)[name];
    if (seq) {
      runSequence(seq);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8 flex flex-col items-center font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_#2a0a0a_0%,_#000000_100%)] opacity-40"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_transparent_40%,_black_100%)] z-0"></div>

      {/* Particle Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-[ping_3s_linear_infinite]"></div>
          <div className="absolute top-10 left-3/4 w-1 h-1 bg-white rounded-full animate-[ping_4s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-900 rounded-full animate-[ping_5s_linear_infinite]"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-12 z-10 border-b-2 border-red-900/50 pb-4 gap-4 bg-black/40 p-4 rounded-xl backdrop-blur-sm">
        <div>
          <h1 className="text-5xl md:text-7xl font-gothic text-red-500 tracking-wider drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
            ABEL ARM
          </h1>
          <p className="text-neutral-300 text-sm mt-1 italic font-serif tracking-widest">
            "BURNING ON AND ON..."
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-3 rounded-full text-neutral-400 hover:text-white hover:bg-red-950/50 transition-colors border border-transparent hover:border-red-900"
            title="Liner Notes (Help)"
          >
            <CircleHelp className="w-6 h-6" />
          </button>

          <button
            onClick={toggleSimulation}
            className={`
              p-3 rounded-full transition-colors border-2
              ${isSimulated 
                ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'}
            `}
            title={isSimulated ? "Wake Up (Disable Sim)" : "Dream Mode (Simulate)"}
          >
            {isSimulated ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          <button
            onClick={isConnected ? disconnect : connect}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all border-2 shadow-xl uppercase tracking-widest text-sm
              ${isConnected 
                  ? 'bg-red-950 border-red-600 text-red-200 hover:bg-red-900 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                  : 'bg-neutral-200 border-white text-black hover:bg-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'}
            `}
          >
            <Usb className="w-5 h-5" />
            {isConnected ? 'Disconnect' : 'Connect Arm'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl flex flex-col md:flex-row gap-12 z-10">
        
        {/* Left Column: Personality */}
        <div className="flex flex-col items-center gap-8 md:w-1/3">
          <AbelFace mood={mood} />
          
          <div className="w-full bg-black/60 border-2 border-neutral-700 rounded-xl p-4 min-h-[240px] flex flex-col shadow-inner backdrop-blur-md">
            <div className="flex items-center gap-2 text-red-500 mb-2 border-b border-neutral-700 pb-2">
              <Terminal className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Terminal</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[180px] font-mono text-xs p-1">
               {logs.length === 0 && (
                 <span className="text-neutral-500 italic">Waiting for the ghost in the machine...</span>
               )}
               {logs.map((log) => (
                 <div key={log.id} className={`${log.sender === 'Abel' ? 'text-red-400 font-bold border-l-2 border-red-800 pl-2' : 'text-neutral-300'}`}>
                   <span className="opacity-40 text-[10px] mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                   {log.sender === 'System' && <span className="text-neutral-500 font-bold mr-1">SYS:</span>}
                   {log.text}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="flex-1">
          {!isConnected && !isSimulated && (
            <div className="mb-6 p-6 bg-red-950/30 border-2 border-red-900 rounded-xl flex items-center gap-4 text-red-100 shadow-[0_0_15px_rgba(127,29,29,0.2)]">
              <HeartCrack className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <strong className="font-gothic text-xl tracking-wide text-red-400">DISCONNECTED</strong>
                <p className="text-sm opacity-80 mt-1">
                  Abel is currently offline. Connect via USB or toggle <strong>Dream Mode</strong> (Moon icon).
                </p>
              </div>
            </div>
          )}
          
          <ControlPanel 
            positions={positions} 
            isConnected={isConnected || isSimulated} 
            onMove={moveServo} 
            onSequence={handleSequence}
          />
        </div>

      </main>
      
      <footer className="mt-auto py-8 text-neutral-500 text-xs text-center z-10 font-serif flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <Flower className="w-3 h-3 text-red-800" />
        <p>THREE CHEERS FOR SWEET REVENGE</p>
        <Flower className="w-3 h-3 text-red-800" />
      </footer>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;