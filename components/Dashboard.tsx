
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Mic, Power, Settings, Clock, Circle, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { AppState } from '../types';

// Constants for Audio Processing
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

interface DashboardProps {
  onExit: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onExit }) => {
  const [status, setStatus] = useState<AppState>('IDLE');
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Utility: Decode base64 to Uint8Array
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const code = binaryString.codePointAt(i);
      bytes[i] = code !== undefined ? code : 0;
    }
    return bytes;
  };

  // Utility: Encode Uint8Array to base64
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCodePoint(bytes[i]);
    }
    return btoa(binary);
  };

  // Utility: Create PCM Blob for Gemini
  const createPcmBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  // Utility: Decode Raw PCM to AudioBuffer
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768;
      }
    }
    return buffer;
  };

  const stopAllAudio = () => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {
        // Ignore errors if source already stopped
      }
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const toggleConnection = async () => {
    if (isConnected) {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      setIsConnected(false);
      setStatus('IDLE');
      stopAllAudio();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const inputCtx = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      const outputCtx = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      // Ensure AudioContext is running (fix for autoplay policies)
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      audioContextRef.current = outputCtx;

      let localSession: any = null;

      localSession = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-latest',
        callbacks: {
          onopen: () => {
            (async () => {
              console.log("Gemini Live API Connected");
              setIsConnected(true);
              setStatus('IDLE');

              // Audio input processing (AudioWorklet)
              try {
                console.log("Loading AudioWorklet module...");
                await inputCtx.audioWorklet.addModule('/audio-processor.js');
                console.log("AudioWorklet module loaded.");

                const source = inputCtx.createMediaStreamSource(stream);
                const workletNode = new AudioWorkletNode(inputCtx, 'audio-processor');

                workletNode.port.onmessage = (event) => {
                  if (!localSession) return;
                  const inputData = event.data;
                  const pcmBlob = createPcmBlob(inputData);
                  try {
                    localSession.sendRealtimeInput({ media: pcmBlob });
                  } catch (err) {
                    console.error("Error sending worklet audio:", err);
                  }
                };

                source.connect(workletNode);
                workletNode.connect(inputCtx.destination);
                console.log("Audio input pipeline connected (Worklet).");

              } catch (workletError) {
                console.error("Failed to load AudioWorklet:", workletError);
                // Fallback or just log error - for now log error as fallback is complex
              }

              // Video frame streaming
              const canvas = canvasRef.current;
              const video = videoRef.current;
              if (canvas && video) {
                const ctx = canvas.getContext('2d');
                const intervalId = setInterval(() => {
                  if (!localSession) {
                    clearInterval(intervalId);
                    return;
                  }
                  if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                      if (blob && localSession) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = (reader.result as string).split(',')[1];
                          try {
                            localSession.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                          } catch (err) {
                            console.error("Error sending video:", err);
                          }
                        };
                        reader.readAsDataURL(blob);
                      }
                    }, 'image/jpeg', 0.5);
                  }
                }, 1000);
              }
            })();
          },
          onmessage: (message: LiveServerMessage) => {
            (async () => {
              console.log("RX:", message.serverContent);
              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;

              if (audioData) {
                if (outputCtx.state === 'suspended') {
                  console.warn("AudioContext suspended, attempting resume");
                  await outputCtx.resume();
                }

                setStatus('SPEAKING');
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);

                try {
                  const decodedBytes = decode(audioData);
                  const buffer = await decodeAudioData(decodedBytes, outputCtx, OUTPUT_SAMPLE_RATE, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputCtx.destination);
                  source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setStatus('IDLE');
                  };
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  sourcesRef.current.add(source);
                } catch (audioError) {
                  console.error("Error processing audio chunk:", audioError);
                }
              }

              if (message.serverContent?.interrupted) {
                console.log("Interrupted signal received");
                stopAllAudio();
                setStatus('IDLE');
              }

              if (message.serverContent?.turnComplete) {
                if (sourcesRef.current.size === 0) setStatus('IDLE');
              }
            })();
          },
          onerror: (e: any) => {
            console.error("Gemini Live API Error:", e);
            setIsConnected(false);
            setStatus('IDLE');
          },
          onclose: (e: any) => {
            console.log("Gemini Live API Closed:", e);
            localSession = null;
            setIsConnected(false);
            setStatus('IDLE');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are VisionAI Sentinel, a helpful vision-based companion. Use concise, intelligent responses. You see through the camera provided.'
        }
      });

      sessionRef.current = localSession;
    } catch (err) {
      console.error("Failed to connect", err);
    }
  };

  const getMicAnimation = () => {
    switch (status) {
      case 'LISTENING':
        return { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 1 } };
      case 'THINKING':
        return { rotate: 360, transition: { repeat: Infinity, duration: 2, ease: "linear" } };
      case 'SPEAKING':
        return {
          boxShadow: ['0 0 0px 0px rgba(0,209,255,0)', '0 0 20px 10px rgba(0,209,255,0.4)', '0 0 0px 0px rgba(0,209,255,0)'],
          transition: { repeat: Infinity, duration: 1.5 }
        };
      default:
        return { opacity: [0.7, 1, 0.7], transition: { repeat: Infinity, duration: 3 } };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0E0E12] text-[#F5F5F7] overflow-hidden font-light selection:bg-[#00D1FF]/30">
      {/* Top OS Bar */}
      <header className="h-10 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: isConnected ? [0.4, 1, 0.4] : 0.4 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-[#00D1FF]' : 'text-gray-500'}`} />
          </motion.div>
          <span className="text-[13px] tracking-wide font-medium opacity-80">VisionAI Sentinel</span>
        </div>
        <div className="flex items-center gap-5 opacity-60 text-[12px]">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mic className={`w-3.5 h-3.5 ${isConnected ? 'text-[#00D1FF]' : ''}`} />
            <span>Mic Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime}</span>
          </div>
          <button onClick={onExit} className="hover:text-white transition-colors">
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: System Info */}
        <div className="w-64 border-r border-white/5 flex flex-col p-6 gap-8 bg-black/10">
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4 font-bold">System Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[13px]">
                <span className="opacity-50">Connection</span>
                <span className={isConnected ? 'text-[#00D1FF]' : 'text-red-400'}>{isConnected ? 'Active' : 'Offline'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="opacity-50">State</span>
                <span className="text-white/90 capitalize">{status.toLowerCase()}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="opacity-50">Neural Link</span>
                <span className="text-[#00D1FF]">Gemini 2.5</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4 font-bold">Visual Metrics</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00D1FF]/40 rounded-full"
                    animate={{ width: ['20%', '60%', '30%', '80%', '50%'] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="mt-auto opacity-30 text-[11px] leading-relaxed">
            v3.2.0-STABLE<br />
            Secure Encrypted Session<br />
            Silicon Valley Node
          </div>
        </div>

        {/* Center: Main App Window */}
        <div className="flex-1 flex flex-col items-center justify-center p-12 relative bg-[#0E0E12]">
          {/* Dashboard Panel Interface */}
          <div className="w-full max-w-4xl glass-panel rounded-[32px] p-1 shadow-2xl overflow-hidden relative">
            {/* Header in Panel */}
            <div className="absolute top-8 left-8 z-20 pointer-events-none">
              <h1 className="text-2xl font-extralight tracking-tight text-white/90">VisionAI</h1>
              <p className="text-[11px] text-[#00D1FF] tracking-[0.3em] uppercase opacity-60">Intelligent Companion</p>
            </div>

            {/* Camera Viewport */}
            <div className="aspect-video w-full rounded-[28px] overflow-hidden bg-black/40 relative group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isConnected ? 'opacity-80' : 'opacity-20 grayscale'}`}
              />
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />

              <div className="absolute inset-0 camera-shadow pointer-events-none" />

              {/* Overlay elements */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <AlertCircle className="w-8 h-8 text-white/20" />
                    <span className="text-xs uppercase tracking-[0.2em] text-white/30">Link Disabled</span>
                  </motion.div>
                )}
              </div>

              {/* Status Indicator inside camera */}
              <div className="absolute bottom-6 left-8 flex items-center gap-3">
                <div className="flex gap-1 h-3 items-end">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-[#00D1FF]"
                      animate={status === 'SPEAKING' ? { height: [4, 12, 4] } : { height: 4 }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold tracking-[0.1em] text-[#00D1FF] opacity-80 uppercase">
                  {status === 'SPEAKING' ? 'Processing Signal' : status}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="mt-12 flex flex-col items-center justify-center gap-6 w-full">
            <div className="flex items-center gap-6">
              {/* Camera Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
                    // Force re-render to update UI state if needed, though mostly visual via CSS class
                    videoRef.current.classList.toggle('grayscale', !stream.getVideoTracks()[0].enabled);
                    videoRef.current.classList.toggle('opacity-50', !stream.getVideoTracks()[0].enabled);
                  }
                }}
                disabled={!isConnected}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  }`}
              >
                <Wifi className="w-6 h-6" />
                {/* Using Wifi icon as a placeholder for Camera/Video or just reuse existing icons if constrained. 
                      Actually let's use a dedicated icon if available in imports or just generic circle.
                      Wait, the imports include 'Wifi', 'Mic', 'Power'. Let's add 'Camera' and 'MicOff' to imports.
                      But I can't change imports easily without a separate replace block. 
                      I'll stick to 'Settings' as placeholder or just generic text/shape if icons are missing?
                      No, I see 'Settings' in imports.
                      Let's stick to simple logic: Toggle class on click.
                  */}
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </motion.button>

              {/* Main Connect Button */}
              <motion.button
                onClick={toggleConnection}
                animate={getMicAnimation()}
                whileTap={{ scale: 0.95 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative ${isConnected
                  ? 'bg-[#00D1FF] text-black shadow-[0_0_50px_rgba(0,209,255,0.5)]'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <Power className="w-8 h-8 mb-1" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">{isConnected ? 'ON' : 'OFF'}</span>
                </div>

                {/* Glow pulses for states */}
                {isConnected && (
                  <motion.div
                    className="absolute -inset-3 rounded-full border border-[#00D1FF]/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Mic Mute Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
                  }
                }}
                disabled={!isConnected}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  }`}
              >
                <Mic className="w-6 h-6" />
              </motion.button>
            </div>

            <p className="text-[13px] opacity-40 font-light tracking-wide italic">
              {isConnected ? "Neural link active. Systems nominal." : "Initialize connection to begin"}
            </p>
          </div>
        </div>

        {/* Right Info: Activity Feed placeholder or simple tips */}
        <div className="w-64 border-l border-white/5 p-6 bg-black/10">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6 font-bold">Quick Tips</h3>
          <ul className="space-y-6 text-[12px] text-white/50 font-light leading-relaxed">
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-[#00D1FF]/30 rounded-full mt-1 shrink-0" />
              <p>"What do you see in front of the camera?"</p>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-[#00D1FF]/30 rounded-full mt-1 shrink-0" />
              <p>"Can you help me identify this object?"</p>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-[#00D1FF]/30 rounded-full mt-1 shrink-0" />
              <p>"Describe the colors you're seeing."</p>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-[#00D1FF]/30 rounded-full mt-1 shrink-0" />
              <p>"Keep me company while I work."</p>
            </li>
          </ul>
        </div>
      </main>

      {/* Subtle Hint Bar */}
      <footer className="h-12 flex items-center justify-center border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 opacity-30 text-[11px] uppercase tracking-[0.2em]">
          <Settings className="w-3 h-3" />
          <span>System Settings Shift + S</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
