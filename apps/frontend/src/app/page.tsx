'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  Zap,
  LineChart,
  Shield,
  Cloud,
  Settings,
  Activity,
  ArrowRight,
  ChevronDown,
  Gauge,
  Radio,
  Database,
  Bell,
  Lock,
  Wifi,
  Code2,
  Sparkles,
  Target,
  Rocket,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatedElement, AnimatedContainer } from '@/components/ui/animated-element';
import { AnimatedParticles } from '@/components/AnimatedParticles';
import { EnhancedNavBar } from '@/components/EnhancedNavBar';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { TypewriterText } from '@/components/TypewriterText';
import { ShowcaseSection } from '@/components/ShowcaseSection';
import { EnhancedFeatureCard } from '@/components/EnhancedFeatureCard';

// Features data
const features = [
  {
    title: 'Real-Time Monitoring',
    description:
      'Monitor industrial devices with millisecond precision and instant alerts for critical events.',
    icon: <Zap className="h-8 w-8 text-blue-400" />,
    gradient: 'from-blue-500 to-cyan-400',
    href: '/console/dashboard',
  },
  {
    title: 'Advanced Analytics',
    description:
      'Visualize trends, detect anomalies, and optimize operations with powerful data analytics.',
    icon: <LineChart className="h-8 w-8 text-purple-400" />,
    gradient: 'from-purple-500 to-pink-400',
    href: '/console/dashboard',
  },
  {
    title: 'Enterprise Security',
    description:
      'Bank-level encryption with role-based access control and comprehensive audit trails.',
    icon: <Shield className="h-8 w-8 text-green-400" />,
    gradient: 'from-green-500 to-emerald-400',
    href: '/console/dashboard',
  },
  {
    title: 'Cloud-Native',
    description:
      'Scalable cloud infrastructure with 99.9% uptime and automatic failover capabilities.',
    icon: <Cloud className="h-8 w-8 text-cyan-400" />,
    gradient: 'from-cyan-500 to-blue-400',
    href: '/console/dashboard',
  },
];

// Industrial Solutions
const solutions = [
  {
    title: 'Manufacturing',
    description:
      'Monitor production lines, track equipment health, and optimize manufacturing processes in real-time.',
    icon: <Settings className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-blue-400 to-cyan-500',
  },
  {
    title: 'Energy & Utilities',
    description:
      'Manage power grids, monitor consumption patterns, and ensure reliable energy distribution.',
    icon: <Gauge className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-purple-400 to-indigo-500',
  },
  {
    title: 'Water Treatment',
    description:
      'Control pumps, monitor water quality, and automate treatment processes for optimal efficiency.',
    icon: <Activity className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-green-400 to-emerald-500',
  },
  {
    title: 'Building Automation',
    description:
      'Optimize HVAC systems, lighting, and security for smart, energy-efficient buildings.',
    icon: <Radio className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
];

// Testimonials
const testimonials = [
  {
    name: 'AutoTech Industries',
    role: 'Smart Manufacturing',
    initial: 'AT',
    quote:
      'WebSCADA reduced our equipment downtime by 45% with predictive maintenance and real-time monitoring.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'PowerGrid Solutions',
    role: 'Energy Management',
    initial: 'PG',
    quote:
      'We monitor 500+ substations in real-time with WebSCADA, improving our response time by 60%.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    name: 'AquaPure Systems',
    role: 'Water Treatment',
    initial: 'AS',
    quote:
      "WebSCADA's automation capabilities helped us reduce chemical usage by 30% while improving water quality.",
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    name: 'SmartBuild Corp',
    role: 'Building Management',
    initial: 'SB',
    quote:
      'Managing 50+ commercial buildings with WebSCADA has cut our energy costs by 35% year-over-year.',
    gradient: 'from-amber-500 to-orange-600',
  },
];

// Stats
const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '50ms', label: 'Latency' },
  { value: '10K+', label: 'Devices Connected' },
  { value: '24/7', label: 'Support' },
];

// Rotating words for typewriter
const rotatingWords = [
  'Industrial IoT',
  'Real-time Monitoring',
  'Smart Manufacturing',
  'Process Automation',
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY, scrollYProgress } = useScroll();
  const smoothScrollY = useSpring(scrollY, { damping: 50, stiffness: 400 });
  const smoothProgress = useSpring(scrollYProgress, { damping: 50, stiffness: 400 });

  const y = useTransform(smoothScrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);
  const parallax1 = useTransform(smoothScrollY, [0, 1000], [0, -300]);
  const parallax2 = useTransform(smoothScrollY, [0, 1000], [0, -150]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced NavBar */}
      <EnhancedNavBar />

      {/* Hero Section */}
      <motion.section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background dark:bg-[#0F172A] text-foreground dark:text-white pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Enhanced Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-background/80 to-background dark:from-blue-900/20 dark:via-[#0F172A]/80 dark:to-[#0F172A]"></div>

          <AnimatedParticles count={30} className="absolute inset-0 opacity-30" />

          {/* Grid pattern */}
          <motion.div className="absolute inset-0 opacity-[0.02]" style={{ y }}>
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </motion.div>

          {/* Animated colored orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            style={{ x: parallax1 }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{ x: parallax2 }}
          />
        </div>

        {isLoaded && (
          <motion.div
            style={{ opacity: heroOpacity }}
            className="container relative z-10 px-6 text-center max-w-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  Next-Gen Industrial IoT Platform
                </span>
              </span>
            </motion.div>

            {/* Main Heading with Typewriter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4">
                <span className="block mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white dark:from-gray-200 dark:via-blue-200 dark:to-gray-200">
                  WebSCADA
                </span>
                <span className="block text-3xl md:text-4xl lg:text-5xl">
                  <TypewriterText
                    words={rotatingWords}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                  />
                </span>
              </h1>
            </motion.div>

            <motion.p
              className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-muted-foreground dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Connect, visualize, and optimize your industrial operations in real-time with
              enterprise-grade SCADA capabilities.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  asChild
                  size="lg"
                  className="relative overflow-hidden group h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-500/25"
                >
                  <Link href="/console/dashboard">
                    <Rocket className="mr-2 h-5 w-5" />
                    <span className="relative z-10">Get Started</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-14 px-8 border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
                >
                  <Link href="/console/dashboard">
                    <Code2 className="mr-2 h-5 w-5" />
                    View Live Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                Enterprise Security
              </span>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                99.9% Uptime SLA
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                50ms Latency
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex flex-col items-center cursor-pointer"
          >
            <span className="text-sm text-muted-foreground mb-2">Scroll to explore</span>
            <ChevronDown className="h-6 w-6 text-blue-400" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30 dark:bg-[#1E293B]/50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <AnimatedCounter key={index} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-background dark:bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block py-1 px-3 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium border border-blue-500/20 mb-4"
            >
              Powerful Features
            </motion.span>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Everything You Need for Industrial IoT
              </h2>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.2} className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground dark:text-gray-300">
                Built for reliability, designed for performance. WebSCADA delivers enterprise-grade
                SCADA capabilities.
              </p>
            </AnimatedElement>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <EnhancedFeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
                href={feature.href}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <ShowcaseSection />

      {/* Solutions Section */}
      <section className="py-28 bg-background dark:bg-[#0F172A] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block py-1 px-3 bg-purple-500/10 rounded-full text-purple-400 text-sm font-medium border border-purple-500/20 mb-4"
            >
              Industry Solutions
            </motion.span>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Solutions for Every Industry
              </h2>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.2} className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground dark:text-gray-300">
                From manufacturing to utilities, WebSCADA powers industrial operations worldwide.
              </p>
            </AnimatedElement>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {solutions.map((solution, index) => (
              <AnimatedElement key={index} animation="scale" delay={index * 0.1 + 0.3}>
                <motion.div
                  className="backdrop-blur-md bg-card/30 dark:bg-[#1E293B]/30 p-6 rounded-xl border border-border dark:border-gray-800/50 h-full group"
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                >
                  <motion.div
                    className={`flex items-center justify-center w-16 h-16 rounded-full ${solution.color} text-white mb-6 relative overflow-hidden`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {solution.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-400 mb-4">
                    {solution.description}
                  </p>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 bg-muted/50 dark:bg-[#1E293B] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block py-1 px-3 bg-cyan-500/10 rounded-full text-cyan-400 text-sm font-medium border border-cyan-500/20 mb-4"
            >
              Success Stories
            </motion.span>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Trusted by Industry Leaders
              </h2>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.2} className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground dark:text-gray-300">
                See how companies are transforming their operations with WebSCADA.
              </p>
            </AnimatedElement>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedElement key={index} animation="scale" delay={index * 0.1 + 0.3}>
                <motion.div
                  className="bg-card dark:bg-[#0F172A] p-6 rounded-xl border border-border dark:border-gray-800 h-full group"
                  whileHover={{
                    y: -5,
                    boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className="flex items-center mb-6">
                    <div
                      className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                    >
                      {testimonial.initial}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-foreground dark:text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-muted-foreground dark:text-gray-400 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -top-4 -left-2 text-5xl text-blue-500/20 font-serif">
                      &ldquo;
                    </div>
                    <p className="text-muted-foreground dark:text-gray-300 relative z-10">
                      {testimonial.quote}
                    </p>
                  </div>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
          <AnimatedParticles count={40} className="absolute inset-0" color="bg-white" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                Start Monitoring Your Operations Today
              </h2>
              <p className="text-xl mb-10 text-white/90">
                Join industry leaders who trust WebSCADA for mission-critical industrial automation.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-75"></div>
                  <Button
                    asChild
                    size="lg"
                    className="relative bg-white text-blue-900 hover:bg-white/90 font-bold h-14 px-8 rounded-lg"
                  >
                    <Link href="/console/dashboard">
                      <span className="flex items-center">
                        View Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </span>
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    asChild
                    size="lg"
                    className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 h-14 px-8 rounded-lg"
                  >
                    <Link href="/devices">Explore Devices</Link>
                  </Button>
                </motion.div>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 text-white/60 text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" /> Real-time Data
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Secure
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" /> Always Connected
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Instant Alerts
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 dark:bg-[#1E293B]">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-lg">WebSCADA</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Modern industrial monitoring and control system for the future of automation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-blue-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-blue-400 transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-blue-400 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-400 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-blue-400 transition-colors">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-blue-400 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-blue-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-blue-400 transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} WebSCADA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
