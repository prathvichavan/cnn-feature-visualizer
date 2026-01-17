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
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section - Technical */}
        <section className="text-left py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-medium text-slate-900 mb-2">
            CNN Feature Extraction Visualizer
          </h1>
          <p className="text-sm text-slate-600 mb-6 max-w-3xl">
            Technical, step-by-step visualization of convolution, activation, pooling, flattening and dense layers. Intended for teaching and lab use.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/single-page"
              className="px-4 py-2 border border-slate-300 text-sm text-slate-800 bg-white rounded-sm"
            >
              View Full Pipeline
            </Link>
            <Link
              to="/convolution"
              className="px-4 py-2 border border-slate-300 text-sm text-slate-800 bg-white rounded-sm"
            >
              Start Step-by-Step
            </Link>
          </div>
        </section>

        {/* Featured: Single Page View Card (Technical) */}
        <section className="py-6">
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
        <section className="py-8">
          <h2 className="text-xl font-medium text-center text-slate-800 mb-4">
            Module Topics
          </h2>
          <p className="text-center text-slate-600 mb-6 max-w-2xl mx-auto">
            Interactive modules for each pipeline stage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageCards.filter(card => !card.featured).map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.link}
                  className="group relative bg-white rounded-sm transition-colors border border-slate-200 p-4 h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-sm">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-md font-medium text-slate-900 mb-1">{card.title}</h3>
                      <p className="text-sm text-slate-600">{card.description}</p>
                    </div>
                  </div>
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
