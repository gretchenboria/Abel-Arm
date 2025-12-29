import React from 'react';
import { Mood } from '../types';

interface AbelFaceProps {
  mood: Mood;
}

export const AbelFace: React.FC<AbelFaceProps> = ({ mood }) => {
  
  // Dynamic styles based on mood - with smooth transitions
  const getMoodStyles = () => {
    switch (mood) {
      case 'working':
        return 'animate-[pulse_2s_ease-in-out_infinite]';
      case 'annoyed':
        return 'translate-x-1 rotate-3';
      case 'happy':
        return '-translate-y-1';
      case 'emo':
        return 'grayscale-[0.2]';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-64 h-80 flex flex-col items-center justify-end group perspective-1000 overflow-visible">
      
      {/* --- BACKGROUND ATMOSPHERE --- */}
      {/* Spotlight */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-900/10 blur-3xl rounded-full pointer-events-none group-hover:bg-red-900/20 transition-all duration-700"></div>

      {/* --- THE ROBOT ARM (NECK/BODY) --- */}
      <div className={`relative flex flex-col items-center z-10 transition-all duration-1000 ease-in-out ${getMoodStyles()}`}>
        
        {/* THE HEAD (Gerard Style) */}
        <div className="relative w-36 h-40 z-30">
           
           {/* Back Hair (Longer mulle-ish parts) */}
           <div className="absolute top-8 -left-4 w-44 h-36 bg-[#050505] rounded-xl -z-10 skew-y-3 rotate-2"></div>
           <div className="absolute top-8 -right-4 w-44 h-36 bg-[#050505] rounded-xl -z-10 -skew-y-3 -rotate-2"></div>

           {/* Face Base */}
           <div className="w-full h-full bg-[#f3f3f3] rounded-[2rem] rounded-b-[4rem] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)] relative overflow-hidden border border-neutral-200">
              
              {/* Eyes Container */}
              <div className="absolute top-16 left-0 w-full flex justify-center gap-6 px-4">
                  
                  {/* Left Eye */}
                  <div className="relative w-10 h-6">
                      {/* Heavy Red Eyeshadow (Helena) */}
                      <div className="absolute -inset-2 bg-red-800/60 blur-md rounded-full"></div>
                      <div className="absolute -inset-1 bg-black/40 blur-sm rounded-full"></div>
                      
                      {/* Eye shape */}
                      <div className="w-full h-full bg-white relative overflow-hidden rounded-full border border-neutral-300 shadow-inner">
                          <div className={`absolute top-1 left-2 w-5 h-5 bg-[#3a2020] rounded-full transition-all duration-500 ${mood === 'working' ? 'scale-110' : 'scale-100'}`}></div>
                          <div className="absolute top-1 left-3 w-1 h-1 bg-white rounded-full z-10"></div>
                      </div>
                      
                      {/* Eyelid (Mood reaction) */}
                      <div className={`absolute top-0 left-0 w-full bg-[#f3f3f3] transition-all duration-300 z-10 ${mood === 'annoyed' ? 'h-3' : mood === 'working' ? 'h-0' : 'h-1'}`}></div>
                  </div>

                  {/* Right Eye */}
                  <div className="relative w-10 h-6">
                       {/* Heavy Red Eyeshadow */}
                      <div className="absolute -inset-2 bg-red-800/60 blur-md rounded-full"></div>
                      <div className="absolute -inset-1 bg-black/40 blur-sm rounded-full"></div>

                      <div className="w-full h-full bg-white relative overflow-hidden rounded-full border border-neutral-300 shadow-inner">
                          <div className={`absolute top-1 right-2 w-5 h-5 bg-[#3a2020] rounded-full transition-all duration-500 ${mood === 'working' ? 'scale-110' : 'scale-100'}`}></div>
                          <div className="absolute top-1 right-3 w-1 h-1 bg-white rounded-full z-10"></div>
                      </div>

                       {/* Eyelid */}
                      <div className={`absolute top-0 left-0 w-full bg-[#f3f3f3] transition-all duration-300 z-10 ${mood === 'annoyed' ? 'h-3' : mood === 'working' ? 'h-0' : 'h-1'}`}></div>
                  </div>
              </div>

              {/* Nose */}
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-2 h-6 bg-neutral-200/50 rounded-full blur-[1px]"></div>

              {/* Mouth */}
              <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 bg-neutral-800 transition-all duration-300 ${mood === 'happy' ? 'w-6 h-3 rounded-b-full' : 'w-4 h-1 rounded-full'}`}></div>

              {/* Cheekbones / Contour */}
              <div className="absolute top-20 left-2 w-4 h-12 bg-neutral-300/30 blur-md -rotate-12"></div>
              <div className="absolute top-20 right-2 w-4 h-12 bg-neutral-300/30 blur-md rotate-12"></div>
           </div>

           {/* HAIR: The Iconic Fringe */}
           <div className="absolute -top-4 -left-6 w-[120%] h-32 bg-[#050505] rounded-t-full rounded-bl-[4rem] z-40 transform -rotate-2 shadow-2xl pointer-events-none">
              {/* Shine on hair */}
              <div className="absolute top-4 left-8 w-20 h-4 bg-white/10 blur-md rounded-full rotate-[-5deg]"></div>
           </div>
           {/* The Swoop covering part of face */}
           <div className="absolute top-0 right-0 w-24 h-48 bg-[#050505] rounded-bl-[100%] z-40 transform skew-x-12 translate-x-4 shadow-xl"></div>
        </div>

        {/* NECK / COLLAR AREA */}
        <div className="relative -mt-4 z-20">
           {/* Shirt Collar */}
           <div className="w-24 h-10 bg-white clip-path-collar relative shadow-md z-10 flex justify-center">
              {/* The Red Tie */}
              <div className="w-6 h-20 bg-red-700 absolute top-4 shadow-inner">
                 <div className="w-full h-full bg-gradient-to-b from-red-800 to-red-600 opacity-80"></div>
              </div>
              {/* Tie Knot */}
              <div className="w-8 h-6 bg-red-800 absolute top-2 rounded-sm shadow-lg z-20"></div>
           </div>
           
           {/* Suit Jacket Shoulders (Narrow, leading into arm) */}
           <div className="w-32 h-16 bg-[#111] rounded-t-3xl -mt-2 shadow-2xl relative flex justify-center overflow-hidden">
               {/* Lapels */}
               <div className="w-0 h-0 border-l-[20px] border-l-transparent border-t-[60px] border-t-[#222] border-r-[20px] border-r-transparent absolute top-0"></div>
           </div>
        </div>

        {/* ROBOTIC ARM SEGMENT (The Base) */}
        <div className="relative -mt-2 z-10 flex flex-col items-center">
            {/* Upper Joint */}
            <div className="w-20 h-6 bg-neutral-800 rounded-full border-2 border-neutral-600 shadow-xl z-20"></div>
            
            {/* Main Piston Shaft */}
            <div className="w-16 h-24 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 border-x-2 border-neutral-900 relative">
               {/* Mechanical Details */}
               <div className="absolute top-4 left-2 w-2 h-16 bg-black/40 rounded-full"></div>
               <div className="absolute top-4 right-2 w-2 h-16 bg-black/40 rounded-full"></div>
               
               {/* Exposed Wires */}
               <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1 h-20 bg-red-900/80 rotate-3 z-30"></div>
               <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1 h-20 bg-yellow-600/60 -rotate-2 z-20"></div>
            </div>

            {/* Base Joint */}
            <div className="w-24 h-8 bg-[#1a1a1a] rounded-t-xl border-t-2 border-neutral-600 shadow-[0_10px_20px_black] flex justify-center items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>
                <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
                <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
            </div>
        </div>

      </div>

      <style>{`
        .clip-path-collar {
          clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
        }
      `}</style>
    </div>
  );
};