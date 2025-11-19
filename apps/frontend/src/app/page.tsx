'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/MainLayout';
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
  Cpu,
  BarChart,
  Database,
  Bell,
  Lock,
  Wifi,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatedElement, AnimatedContainer } from '@/components/ui/animated-element';
import { AnimatedParticles } from '@/components/AnimatedParticles';

// Features data
const features = [
  {
    title: 'Real-Time Monitoring',
    description:
      'Monitor industrial devices with millisecond precision and instant alerts for critical events.',
    icon: <Zap className="h-8 w-8 text-blue-400" />,
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Advanced Analytics',
    description:
      'Visualize trends, detect anomalies, and optimize operations with powerful data analytics.',
    icon: <LineChart className="h-8 w-8 text-purple-400" />,
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Enterprise Security',
    description:
      'Bank-level encryption with role-based access control and comprehensive audit trails.',
    icon: <Shield className="h-8 w-8 text-green-400" />,
    gradient: 'from-green-500 to-emerald-400',
  },
  {
    title: 'Cloud-Native',
    description:
      'Scalable cloud infrastructure with 99.9% uptime and automatic failover capabilities.',
    icon: <Cloud className="h-8 w-8 text-cyan-400" />,
    gradient: 'from-cyan-500 to-blue-400',
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

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const solutionsRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const smoothScrollY = useSpring(scrollY, { damping: 50, stiffness: 400 });
  const smoothProgress = useSpring(scrollYProgress, { damping: 50, stiffness: 400 });

  const y = useTransform(smoothScrollY, [0, 500], [0, -100]);
  const scale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);
  const parallax1 = useTransform(smoothScrollY, [0, 1000], [0, -300]);
  const parallax2 = useTransform(smoothScrollY, [0, 1000], [0, -150]);
  const rotation = useTransform(smoothScrollY, [0, 1000], [0, 10]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <motion.section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background dark:bg-[#0F172A] text-foreground dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Enhanced Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-radial from-blue-100/30 via-background/80 to-background dark:from-blue-900/30 dark:via-[#0F172A]/80 dark:to-[#0F172A] opacity-80"></div>

          <AnimatedParticles count={20} className="absolute inset-0 opacity-30" />

          <motion.div className="absolute inset-0 z-10 opacity-10" style={{ y, rotateZ: rotation }}>
            <div className="absolute top-0 left-0 w-full h-full">
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 1000"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </motion.div>

          {/* Animated colored orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-200/10 dark:bg-blue-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ x: parallax1 }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-200/10 dark:bg-purple-500/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, 20, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            style={{ x: parallax2 }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-cyan-200/10 dark:bg-cyan-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -20, 0],
              y: [0, -30, 0],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        {isLoaded && (
          <motion.div
            style={{ opacity: heroOpacity, scale }}
            className="container relative z-10 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.2,
                type: 'spring',
                stiffness: 100,
                damping: 20,
              }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                }}
              >
                <span className="inline-block">WebSCADA</span>
              </motion.h1>
            </motion.div>

            <motion.p
              className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-foreground/80 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Next-generation industrial monitoring and control platform. Connect, visualize, and
              optimize your operations in real-time.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    when: 'beforeChildren',
                    delayChildren: 0.1,
                  },
                },
              }}
            >
              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="relative overflow-hidden group transition-all shadow-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-0 h-14 px-8"
                >
                  <Link href="/dashboard">
                    <span className="relative z-10 flex items-center">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="absolute inset-0 bg-white/10 dark:bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="transition-all border-border hover:bg-muted dark:border-white/20 dark:hover:bg-white/10 h-14 px-8"
                >
                  <Link href="/dashboard">View Live Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Floating Device Mockups */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-6xl">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1,
              delay: 0.8,
              type: 'spring',
              stiffness: 50,
              damping: 15,
            }}
            className="relative h-64 md:h-96"
          >
            {/* Dashboard Mockup */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full backdrop-blur-md bg-white/10 dark:bg-gray-900/50 rounded-t-xl overflow-hidden border border-border dark:border-gray-800 border-b-0 shadow-2xl"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.8,
                ease: [0.22, 1, 0.36, 1],
                type: 'spring',
                stiffness: 50,
                damping: 15,
              }}
              whileHover={{
                y: -10,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                },
              }}
            >
              <div className="w-full h-6 bg-muted/80 dark:bg-gray-800/80 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="w-full aspect-[16/9] relative bg-card/80 dark:bg-[#0F172A]/80 flex items-center justify-center p-4">
                <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
                  <div className="bg-muted/50 dark:bg-gray-800/50 rounded-lg p-2 flex flex-col">
                    <div className="h-2 w-16 bg-blue-300/40 dark:bg-blue-500/40 rounded mb-2"></div>
                    <div className="h-20 bg-blue-200/20 dark:bg-blue-500/20 rounded flex items-center justify-center">
                      <LineChart className="h-8 w-8 text-blue-400/40" />
                    </div>
                  </div>
                  <div className="bg-muted/50 dark:bg-gray-800/50 rounded-lg p-2 flex flex-col">
                    <div className="h-2 w-20 bg-purple-300/40 dark:bg-purple-500/40 rounded mb-2"></div>
                    <div className="h-20 bg-purple-200/20 dark:bg-purple-500/20 rounded flex items-center justify-center">
                      <BarChart className="h-8 w-8 text-purple-400/40" />
                    </div>
                  </div>
                  <div className="bg-muted/50 dark:bg-gray-800/50 rounded-lg p-2 flex flex-col">
                    <div className="h-2 w-14 bg-cyan-300/40 dark:bg-cyan-500/40 rounded mb-2"></div>
                    <div className="h-20 bg-cyan-200/20 dark:bg-cyan-500/20 rounded flex items-center justify-center">
                      <Cpu className="h-8 w-8 text-cyan-400/40" />
                    </div>
                  </div>
                  <div className="bg-muted/50 dark:bg-gray-800/50 rounded-lg p-2 flex flex-col">
                    <div className="h-2 w-16 bg-green-300/40 dark:bg-green-500/40 rounded mb-2"></div>
                    <div className="h-20 bg-green-200/20 dark:bg-green-500/20 rounded flex items-center justify-center">
                      <Activity className="h-8 w-8 text-green-400/40" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex flex-col items-center"
          >
            <span className="text-sm text-foreground/50 dark:text-gray-300 mb-2">
              Scroll to explore
            </span>
            <ChevronDown className="h-6 w-6 text-foreground dark:text-white" />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-28 bg-muted/50 dark:bg-[#1E293B] relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-200/5 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <AnimatedElement animation="slideUp" className="inline-block mb-4">
              <span className="inline-block py-1 px-3 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium border border-blue-500/20 mb-2">
                Powerful Features
              </span>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500">
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

          {/* Stats */}
          <AnimatedContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
            {stats.map((stat, index) => (
              <AnimatedElement
                key={index}
                animation="scale"
                delay={index * 0.1}
                className="text-center"
              >
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <div className="bg-card dark:bg-[#0F172A]/80 backdrop-blur-sm rounded-xl p-6 border border-border dark:border-gray-800/50 relative z-10">
                    <h3 className="text-3xl md:text-4xl font-bold mb-1 text-foreground dark:text-white">
                      {stat.value}
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400">{stat.label}</p>
                  </div>
                </motion.div>
              </AnimatedElement>
            ))}
          </AnimatedContainer>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <AnimatedElement key={index} animation="slideUp" delay={index * 0.1 + 0.2}>
                <motion.div
                  className="bg-card dark:bg-[#0F172A] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 h-full border border-border dark:border-gray-800/50 relative z-10"
                  whileHover={{
                    y: -10,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient}`}></div>
                  <div className="p-6">
                    <motion.div
                      className="mb-6 flex justify-center items-center w-16 h-16 rounded-lg bg-muted dark:bg-gray-800/80"
                      whileHover={{
                        rotate: 5,
                        scale: 1.1,
                        transition: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 10,
                        },
                      }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section
        id="solutions"
        ref={solutionsRef}
        className="py-28 bg-background dark:bg-[#0F172A] relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <AnimatedElement animation="slideUp" className="inline-block mb-4">
              <span className="inline-block py-1 px-3 bg-purple-500/10 rounded-full text-purple-400 text-sm font-medium border border-purple-500/20 mb-2">
                Industry Solutions
              </span>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500">
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
                  className="backdrop-blur-md bg-card/30 dark:bg-[#1E293B]/30 p-6 rounded-xl border border-border dark:border-gray-800/50 h-full"
                  whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                >
                  <motion.div
                    className={`flex items-center justify-center w-16 h-16 rounded-full ${solution.color} text-white mb-6`}
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    {solution.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-400 mb-4">
                    {solution.description}
                  </p>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    <Link
                      href={`/solutions/${solution.title.toLowerCase()}`}
                      className="text-blue-400 hover:text-blue-300 flex items-center group"
                    >
                      Learn more
                      <ArrowRight className="ml-1 h-5 w-5" />
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        ref={testimonialsRef}
        className="py-28 bg-muted/50 dark:bg-[#1E293B] relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedContainer className="text-center mb-20">
            <AnimatedElement animation="slideUp" className="inline-block mb-4">
              <span className="inline-block py-1 px-3 bg-cyan-500/10 rounded-full text-cyan-400 text-sm font-medium border border-cyan-500/20 mb-2">
                Success Stories
              </span>
            </AnimatedElement>

            <AnimatedElement animation="slideUp" delay={0.1}>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
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
                  className="bg-card dark:bg-[#0F172A] p-6 rounded-xl border border-border dark:border-gray-800 h-full"
                  whileHover={{
                    y: -5,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                      "
                    </div>
                    <p className="text-muted-foreground dark:text-gray-300 relative z-10">
                      {testimonial.quote}
                    </p>
                    <div className="absolute -bottom-6 -right-2 text-5xl text-blue-500/20 font-serif rotate-180">
                      "
                    </div>
                  </div>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" ref={ctaRef} className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900">
          <AnimatedParticles count={40} className="absolute inset-0" color="bg-white" />

          <motion.div
            className="absolute right-1/4 bottom-1/3 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute left-1/4 top-1/3 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <AnimatedContainer className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-md p-12 rounded-2xl border border-white/10 shadow-2xl">
              <AnimatedElement animation="slideUp">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white text-center">
                  Start Monitoring Your Operations Today
                </h2>
              </AnimatedElement>

              <AnimatedElement animation="slideUp" delay={0.1}>
                <p className="text-xl mb-10 text-white/90 text-center">
                  Join industry leaders who trust WebSCADA for mission-critical industrial
                  automation.
                </p>
              </AnimatedElement>

              <AnimatedElement animation="scale" delay={0.2}>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-75"></div>
                    <Button
                      asChild
                      size="lg"
                      className="relative bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 font-bold text-white h-14 px-8 rounded-lg border-0"
                    >
                      <Link href="/dashboard">
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
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-14 px-8 rounded-lg"
                    >
                      <Link href="/devices">Explore Devices</Link>
                    </Button>
                  </motion.div>
                </div>
              </AnimatedElement>

              <AnimatedElement animation="fade" delay={0.3} className="mt-12">
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
              </AnimatedElement>
            </AnimatedContainer>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
