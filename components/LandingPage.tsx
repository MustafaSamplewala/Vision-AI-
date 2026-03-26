
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { 
  ArrowRight, CheckCircle, BarChart3, Users, Zap, 
  MessageSquare, Globe, Shield, Instagram, Twitter, 
  Linkedin, Github, ChevronDown, Plus, Minus
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 1100 },
];

const StatCounter = ({ value, label, suffix = "" }: { value: number, label: string, suffix?: string }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
      <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-500 font-medium tracking-wide uppercase text-sm">{label}</div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="text-lg font-semibold text-gray-900">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-gray-400" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pt-4 text-gray-600 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
};

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">VisionAI</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Pricing', 'Integrations', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLaunch} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">Login</button>
            <button onClick={onLaunch} className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-20 right-[10%] w-96 h-96 bg-purple-300 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-[10%] w-96 h-96 bg-pink-200 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Now with Gemini 2.5 Live
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 leading-[1.1] mb-8 tracking-tighter">
              Maximize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Vision AI</span> Presence.
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl">
              Sentinel empowers you with real-time visual intelligence. Connect, process, and act with the world's most advanced vision models.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onLaunch} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-purple-200 transition-all flex items-center gap-2 group">
                Launch Sentinel <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white border-2 border-gray-100 text-gray-900 px-8 py-4 rounded-2xl text-lg font-bold hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm">
                View Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] bg-gradient-to-br from-purple-100 to-pink-50 flex items-center justify-center p-12 relative">
               {/* Animated Floating Abstract Visual */}
               <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-center relative p-8 border border-white/50"
               >
                 <div className="grid grid-cols-2 gap-4 w-full h-full">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`rounded-3xl bg-gray-50 flex items-center justify-center p-4 ${i === 2 ? 'bg-purple-600' : ''}`}>
                         {i === 2 ? <Zap className="text-white w-12 h-12" /> : <div className="w-full h-4 bg-gray-200 rounded-full" />}
                      </div>
                    ))}
                 </div>
               </motion.div>
               
               {/* Accessory Floating Cards */}
               <motion.div 
                 animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity }}
                 className="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-50 flex items-center gap-4"
               >
                 <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
                    <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-sm font-bold text-gray-900">Neural Sync</div>
                    <div className="text-xs text-gray-500">100% Efficiency</div>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="features" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Built for speed and precision</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Detailed analytics and real-time vision processing in a unified interface that scales with your ambition.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-2 bg-gray-50 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm border border-gray-100"
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold">Visual Throughput</h3>
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                    +24% <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
                  </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-gray-900 text-white rounded-[2.5rem] p-10 flex flex-col shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Real-time Insights</h3>
              <div className="space-y-6">
                {[
                  { label: '#MotionTracking', count: '1.2M', color: 'bg-purple-500' },
                  { label: '#ObjectDetection', count: '890K', color: 'bg-pink-500' },
                  { label: '#NeuralSearch', count: '450K', color: 'bg-yellow-500' },
                ].map((tag, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                      <span className="font-medium">{tag.label}</span>
                    </div>
                    <span className="opacity-60">{tag.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-10">
                <div className="text-4xl font-bold mb-1">99.9%</div>
                <div className="text-xs opacity-50 uppercase tracking-widest font-bold">Inference Uptime</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCounter value={248} label="Processed Streams" suffix="K+" />
          <StatCounter value={8} label="Inference Speed" suffix="X" />
          <StatCounter value={40} label="Weekly Time Saved" suffix="h+" />
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Seamlessly integrated</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Connect Sentinel with your existing workflow in seconds. We support over 200+ popular platforms.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[Users, Globe, MessageSquare, Shield, BarChart3, Zap, ArrowRight, Instagram, Twitter, Linkedin, Github, CheckCircle].map((Icon, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                className="aspect-square bg-white border border-gray-100 rounded-3xl flex items-center justify-center shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all cursor-pointer group"
              >
                <Icon className="w-10 h-10 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Loved by visionaries</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">Trusted by high-growth startups and Fortune 500 companies alike.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { name: "Sarah Chen", role: "CTO @ Orbit", content: "VisionAI has completely transformed how we process visual data. The speed is unprecedented." },
            { name: "Marcus Thorne", role: "Product Design", content: "The minimalist app interface is exactly what we needed. Clean, robust, and highly intelligent." },
            { name: "Elena Rodriguez", role: "Founder @ Lumos", content: "We saw a 40% increase in productivity within the first month of using Sentinel. Highly recommend." }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 backdrop-blur-lg border border-white/10 p-10 rounded-[2.5rem]">
              <div className="flex gap-1 mb-6 text-yellow-500">
                {[1,2,3,4,5].map(s => <Zap key={s} className="w-4 h-4" fill="currentColor" />)}
              </div>
              <p className="text-lg text-white/80 leading-relaxed mb-8 italic">"{item.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
                <div>
                  <div className="text-white font-bold">{item.name}</div>
                  <div className="text-white/40 text-sm">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FAQItem question="How secure is my visual data?" answer="We prioritize your privacy. All visual streams are encrypted end-to-end and processed in real-time without persistent storage unless explicitly requested." />
            <FAQItem question="Does it work with standard webcams?" answer="Yes, VisionAI is designed to work with any standard USB or integrated webcam. For professional setups, we also support IP cameras and high-end thermal sensors." />
            <FAQItem question="What is the monthly latency?" answer="Our global edge network ensures sub-100ms latency for vision inference and real-time audio responses, giving you an instantaneous feedback loop." />
            <FAQItem question="Can I integrate my own models?" answer="Absolutely. Sentinel supports custom model hosting through our SDK, allowing you to bring your specialized neural networks into our premium interface." />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6">
        <motion.div 
          whileInView={{ scale: [0.95, 1] }}
          className="max-w-7xl mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-[3rem] p-12 md:p-24 text-center text-white shadow-2xl shadow-purple-200 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-extrabold mb-8 tracking-tighter">Ready to see more clearly?</h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">Join 5,000+ teams who have upgraded their vision intelligence with Sentinel.</p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <button onClick={onLaunch} className="bg-white text-purple-600 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-gray-50 transition-all shadow-xl">
                Get Started Free
              </button>
              <button className="bg-black/20 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-black/30 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">VisionAI</span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed mb-8">
              Building the future of visual intelligence. One frame at a time. Designed in California, made for the world.
            </p>
            <div className="flex gap-4">
              <Instagram className="w-6 h-6 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors" />
              <Twitter className="w-6 h-6 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors" />
              <Github className="w-6 h-6 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors" />
              <Linkedin className="w-6 h-6 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors" />
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-gray-900">Product</h4>
            <ul className="space-y-4 text-gray-500">
              <li><a href="#" className="hover:text-purple-600">Features</a></li>
              <li><a href="#" className="hover:text-purple-600">Integrations</a></li>
              <li><a href="#" className="hover:text-purple-600">Enterprise</a></li>
              <li><a href="#" className="hover:text-purple-600">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-gray-900">Company</h4>
            <ul className="space-y-4 text-gray-500">
              <li><a href="#" className="hover:text-purple-600">About</a></li>
              <li><a href="#" className="hover:text-purple-600">Careers</a></li>
              <li><a href="#" className="hover:text-purple-600">Privacy</a></li>
              <li><a href="#" className="hover:text-purple-600">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} VisionAI Sentinel. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
