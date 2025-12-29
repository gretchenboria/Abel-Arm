import React from 'react';
import { X, AlertTriangle, Download, Lock, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-6 relative shadow-[0_0_30px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-gothic text-red-600 mb-6 border-b border-neutral-800 pb-2">
          Liner Notes
        </h2>

        <div className="space-y-6 text-neutral-300 text-sm font-sans">
          
          <section className="bg-red-950/20 p-4 rounded-lg border border-red-900/30">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security Protocol
            </h3>
            <p className="mb-2 text-xs">
              The browser's security model (Secure Context) dictates hardware access.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-900/20 p-2 rounded border border-green-900/30">
                    <strong className="text-green-400">ALLOWED</strong>
                    <ul className="list-disc pl-3 mt-1 opacity-70">
                        <li>http://localhost</li>
                        <li>http://127.0.0.1</li>
                        <li>https://*</li>
                    </ul>
                </div>
                <div className="bg-red-900/20 p-2 rounded border border-red-900/30">
                    <strong className="text-red-400">BLOCKED</strong>
                    <ul className="list-disc pl-3 mt-1 opacity-70">
                        <li>file://</li>
                        <li>http://192.168...</li>
                        <li>http://example.com</li>
                    </ul>
                </div>
            </div>
          </section>

          <section className="bg-neutral-800/20 p-4 rounded-lg">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Troubleshooting
            </h3>
            <ul className="list-disc pl-4 space-y-2 text-neutral-400">
              <li>
                <span className="text-white font-semibold">Drivers:</span> Ensure CP210x or CH340 drivers are installed.
              </li>
              <li>
                <span className="text-white font-semibold">Browser:</span> Chrome, Edge, or Opera only. Firefox is not supported.
              </li>
              <li>
                <span className="text-white font-semibold">Linux:</span> 
                <code className="block bg-black p-1 mt-1 rounded text-xs font-mono">sudo usermod -a -G dialout $USER</code>
              </li>
            </ul>
          </section>

          <section>
             <h3 className="font-bold text-red-400 mb-1">Hardware Specs</h3>
             <ul className="text-xs text-neutral-500 space-y-1">
                 <li>Baud Rate: 115200</li>
                 <li>Data Bits: 8</li>
                 <li>Stop Bits: 1</li>
                 <li>Parity: None</li>
             </ul>
          </section>
        </div>
      </div>
    </div>
  );
};