'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Terminal, Zap, Shield, Cloud } from 'lucide-react';

const showcaseItems = [
  {
    icon: <Terminal className="h-5 w-5" />,
    title: 'Easy Integration',
    code: `// Connect your devices
const device = await scada.connect({
  protocol: 'mqtt',
  host: 'localhost:1883'
});`,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Real-time Data',
    code: `// Subscribe to live data
device.on('data', (value) => {
  console.log('New value:', value);
});`,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Secure by Default',
    code: `// Authentication & encryption
const client = new ScadaClient({
  auth: { token: process.env.TOKEN },
  tls: true
});`,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Cloud className="h-5 w-5" />,
    title: 'Cloud Native',
    code: `// Deploy anywhere
docker run -d webscada/backend
kubectl apply -f deployment.yaml`,
    gradient: 'from-amber-500 to-orange-500',
  },
];

export function ShowcaseSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-28 bg-gradient-to-b from-background via-muted/30 to-background dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="inline-block py-1 px-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full text-blue-400 text-sm font-medium border border-blue-500/20 mb-4"
          >
            Developer Experience
          </motion.span>

          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Built for Developers
          </h2>

          <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
            Simple, powerful APIs that get you up and running in minutes, not months.
          </p>
        </motion.div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="relative h-full">
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500`} />

                <div className="relative bg-card dark:bg-[#0F172A] rounded-xl border border-border dark:border-gray-800 overflow-hidden h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border dark:border-gray-800">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}
                    >
                      {item.icon}
                    </motion.div>
                    <h3 className="font-semibold text-foreground dark:text-white">
                      {item.title}
                    </h3>
                  </div>

                  {/* Code Block */}
                  <div className="p-4 bg-muted/50 dark:bg-[#1E293B]/50">
                    <pre className="text-sm font-mono text-muted-foreground dark:text-gray-300 overflow-x-auto">
                      <code className="language-typescript">{item.code}</code>
                    </pre>
                  </div>

                  {/* Bottom accent */}
                  <div className={`h-1 bg-gradient-to-r ${item.gradient}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            Ready to get started?
          </p>
          <motion.a
            href="/docs"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-shadow"
          >
            View Documentation
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
