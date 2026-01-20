import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { resetCNNState } from '@/lib/cnnStateStore';
import { Layout } from '@/components/layout/Layout';
import { 
  ArrowRight, 
  Layers, 
  Zap, 
  Grid3X3, 
  ArrowDownWideNarrow,
  Brain,
  BarChart3,
  Sparkles,
  Play,
  Eye,
  MonitorPlay
} from 'lucide-react';

const pageCards = [
  {
    title: 'Single Page CNN View',
    description: 'See the COMPLETE CNN pipeline in one scrollable page. Perfect for demos and end-to-end understanding.',
    icon: MonitorPlay,
    color: 'from-indigo-500 to-purple-600',
    link: '/single-page',
    highlight: 'Full Pipeline',
    featured: true,
  },
  {
    title: 'Convolution',
    description: 'Learn how filters slide across images to detect edges, patterns, and features.',
    icon: Layers,
    color: 'from-blue-400 to-blue-600',
    link: '/convolution',
    highlight: 'Feature Detection',
  },
  {
    title: 'Activation Function',
    description: 'Understand why ReLU and other activations are essential for learning complex patterns.',
    icon: Zap,
    color: 'from-purple-400 to-purple-600',
    link: '/activation',
    highlight: 'Non-linearity',
  },
  {
    title: 'Pooling',
    description: 'See how max pooling reduces dimensions while preserving important features.',
    icon: Grid3X3,
    color: 'from-green-400 to-green-600',
    link: '/pooling',
    highlight: 'Dimension Reduction',
  },
  {
    title: 'Flatten',
    description: 'Watch 2D feature maps transform into 1D vectors for the dense layer.',
    icon: ArrowDownWideNarrow,
    color: 'from-orange-400 to-orange-600',
    link: '/flatten',
    highlight: 'Shape Transformation',
  },
  {
    title: 'Dense + Softmax',
    description: 'Explore how neurons combine features and softmax produces probabilities.',
    icon: Brain,
    color: 'from-red-400 to-red-600',
    link: '/dense',
    highlight: 'Classification',
  },
  {
    title: 'Architecture Overview',
    description: 'View the complete CNN pipeline and understand how all layers work together.',
    icon: BarChart3,
    color: 'from-pink-400 to-rose-600',
    link: '/architecture',
    highlight: 'Full Pipeline',
  },
];

export default function HomePage() {
  // Reset CNN state on Home page mount
  useEffect(() => {
    resetCNNState();
  }, []);
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full overflow-x-hidden">
        {/* Hero Section - Technical */}
        <section className="flex flex-col items-center justify-center text-center py-5 md:py-8 w-full mt-1">
          <div className="relative w-full max-w-6xl mx-auto rounded-3xl border border-slate-200 shadow-lg px-3 sm:px-6 md:px-10 py-6 md:py-10 min-h-[220px] md:min-h-[260px] bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 overflow-hidden">
            {/* Subtle blurred geometric shape (circle/blob) */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none select-none" aria-hidden="true"></div>
            <h1 className="text-2xl md:text-4xl font-semibold text-slate-900 mb-3 md:mb-4 z-10 relative">
              CNN Feature Extraction Visualizer
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-5 md:mb-7 max-w-2xl mx-auto z-10 relative">
              Technical, step-by-step visualization of convolution, activation, pooling, flattening and dense layers. Intended for teaching and lab use.
            </p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full max-w-xs md:max-w-none justify-center items-center md:items-stretch z-10 relative">
              <Link
                to="/single-page"
                className="px-5 py-2.5 text-sm font-semibold rounded-md bg-indigo-600 text-white shadow-sm border border-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full xs:w-auto text-center transition-colors"
              >
                View Full Pipeline
              </Link>
              <Link
                to="/convolution"
                className="px-5 py-2.5 text-sm font-semibold rounded-md border border-indigo-600 text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-full xs:w-auto text-center transition-colors"
              >
                Start Step-by-Step
              </Link>
            </div>
          </div>
        </section>

        {/* Featured: Single Page View Card (Technical) */}
        <section className="py-4">
          <Link to="/single-page" className="block border border-slate-200 bg-white p-4 rounded-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-sm">
                <MonitorPlay className="w-8 h-8 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900">Single Page CNN View</h2>
                <p className="text-sm text-slate-600">Complete pipeline view for technical inspection and demonstrations.</p>
              </div>
            </div>
          </Link>
        </section>

        {/* Learning Cards */}
        <div className="w-full flex justify-center my-5">
          <div className="h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        <section className="py-5 md:py-8">
          <h2 className="text-2xl font-semibold text-center text-slate-800 mb-3 tracking-tight">
            Module Topics
          </h2>
          <p className="text-center text-slate-600 mb-4 max-w-2xl mx-auto">
            Interactive modules for each pipeline stage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {pageCards.filter(card => !card.featured).map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.link}
                  className="group relative bg-slate-50 rounded-2xl border border-slate-200 p-3 flex flex-col h-full min-h-[140px] shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all duration-200"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-slate-900 mb-0.5">{card.title}</h3>
                      <p className="text-sm text-slate-600">{card.description}</p>
                    </div>
                  </div>
                  {/* ...existing code for card content if any... */}
                </Link>
              );
            })}
          </div>
        </section>

        {/* End of page content */}
      </div>
    </Layout>
  );
}
