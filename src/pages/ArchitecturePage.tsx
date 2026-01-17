import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Layers, 
  Zap, 
  Grid3X3, 
  ArrowDownWideNarrow,
  Brain,
  BarChart3,
  ArrowLeft,
  Image
} from 'lucide-react';

const architectureLayers = [
  {
    name: 'Input Layer',
    icon: Image,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    shape: '28 × 28 × 1',
    description: 'Raw MNIST image with grayscale pixel values (0-255)',
    details: '784 total pixels',
    link: null,
  },
  {
    name: 'Convolution',
    icon: Layers,
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    shape: '26 × 26 × 1',
    description: '3×3 filter slides across image, detecting edges and patterns',
    details: 'Stride: 1, Padding: 0, Filter: 3×3',
    link: '/convolution',
  },
  {
    name: 'Activation (ReLU)',
    icon: Zap,
    color: 'from-yellow-400 to-amber-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    shape: '26 × 26 × 1',
    description: 'Applies non-linearity: negative values become zero',
    details: 'f(x) = max(0, x)',
    link: '/activation',
  },
  {
    name: 'Max Pooling',
    icon: Grid3X3,
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    shape: '13 × 13 × 1',
    description: '2×2 window selects maximum value, reducing dimensions',
    details: 'Pool: 2×2, Stride: 2',
    link: '/pooling',
  },
  {
    name: 'Flatten',
    icon: ArrowDownWideNarrow,
    color: 'from-cyan-400 to-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    shape: '169 × 1',
    description: 'Reshapes 2D feature map into 1D vector (row-major order)',
    details: '13 × 13 = 169 values',
    link: '/flatten',
  },
  {
    name: 'Dense Layer',
    icon: Brain,
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    shape: '10 × 1',
    description: 'Fully connected layer with 10 neurons (one per digit class)',
    details: '169 × 10 = 1,690 weights + 10 biases',
    link: '/dense',
  },
  {
    name: 'Softmax',
    icon: BarChart3,
    color: 'from-pink-400 to-rose-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    shape: '10 × 1',
    description: 'Converts raw outputs into probabilities summing to 1',
    details: 'Output: P(digit = 0), P(digit = 1), ..., P(digit = 9)',
    link: '/dense',
  },
];

export default function ArchitecturePage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-600 rounded-xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                CNN Architecture Overview
              </h1>
              <p className="text-slate-600">Complete pipeline from input to prediction</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/dense"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Dense Layer
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Contact
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
            <p className="text-3xl font-bold">7</p>
            <p className="text-sm text-blue-100">Layers</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center">
            <p className="text-3xl font-bold">1,700+</p>
            <p className="text-sm text-purple-100">Parameters</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white text-center">
            <p className="text-3xl font-bold">28×28</p>
            <p className="text-sm text-green-100">Input Size</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white text-center">
            <p className="text-3xl font-bold">10</p>
            <p className="text-sm text-orange-100">Classes</p>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Layer-by-Layer Architecture
          </h2>
          
          <div className="space-y-4">
            {architectureLayers.map((layer, index) => {
              const Icon = layer.icon;
              const content = (
                <div className={`${layer.bgColor} ${layer.borderColor} border-2 rounded-xl p-4 transition-all duration-300 ${layer.link ? 'hover:shadow-lg hover:scale-[1.01] cursor-pointer' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon and Name */}
                    <div className="flex items-center gap-3 md:w-48">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${layer.color} shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{layer.name}</h3>
                        {layer.link && (
                          <span className="text-xs text-indigo-600">Click to explore →</span>
                        )}
                      </div>
                    </div>

                    {/* Shape */}
                    <div className="md:w-32 text-center">
                      <span className="inline-block px-3 py-1 bg-slate-800 text-white font-mono text-sm rounded-lg">
                        {layer.shape}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{layer.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{layer.details}</p>
                    </div>
                  </div>
                </div>
              );

              return (
                <div key={layer.name}>
                  {layer.link ? (
                    <Link to={layer.link}>{content}</Link>
                  ) : (
                    content
                  )}
                  
                  {/* Arrow between layers */}
                  {index < architectureLayers.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="w-6 h-6 text-slate-400 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shape Changes Flow */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-6 text-center">
            Data Shape Transformation
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { shape: '28×28', label: 'Input', color: 'bg-blue-500' },
              { shape: '26×26', label: 'Conv', color: 'bg-orange-500' },
              { shape: '26×26', label: 'ReLU', color: 'bg-yellow-500' },
              { shape: '13×13', label: 'Pool', color: 'bg-green-500' },
              { shape: '169', label: 'Flat', color: 'bg-cyan-500' },
              { shape: '10', label: 'Dense', color: 'bg-purple-500' },
              { shape: '10', label: 'Softmax', color: 'bg-pink-500' },
            ].map((item, index, arr) => (
              <div key={item.label} className="flex items-center">
                <div className="text-center">
                  <div className={`${item.color} px-4 py-2 rounded-lg font-mono text-sm font-bold mb-1`}>
                    {item.shape}
                  </div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
                {index < arr.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-slate-500 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Parameter Count Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Parameter Count Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-4 font-semibold text-slate-700">Layer</th>
                  <th className="text-center py-2 px-4 font-semibold text-slate-700">Weights</th>
                  <th className="text-center py-2 px-4 font-semibold text-slate-700">Biases</th>
                  <th className="text-center py-2 px-4 font-semibold text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-600">Convolution (3×3)</td>
                  <td className="py-2 px-4 text-center font-mono">9</td>
                  <td className="py-2 px-4 text-center font-mono">0</td>
                  <td className="py-2 px-4 text-center font-mono font-bold">9</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-600">Dense (169 → 10)</td>
                  <td className="py-2 px-4 text-center font-mono">1,690</td>
                  <td className="py-2 px-4 text-center font-mono">10</td>
                  <td className="py-2 px-4 text-center font-mono font-bold">1,700</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-4 font-semibold text-slate-800">Total</td>
                  <td className="py-2 px-4 text-center font-mono">1,699</td>
                  <td className="py-2 px-4 text-center font-mono">10</td>
                  <td className="py-2 px-4 text-center font-mono font-bold text-indigo-600">1,709</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Concepts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
            <h3 className="font-bold text-indigo-800 mb-4">🎯 Key Concepts</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">1.</span>
                <span><strong>Convolution</strong> extracts local features using learnable filters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">2.</span>
                <span><strong>Activation</strong> introduces non-linearity for complex patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">3.</span>
                <span><strong>Pooling</strong> reduces dimensions and provides translation invariance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">4.</span>
                <span><strong>Dense layers</strong> combine all features for final classification</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <h3 className="font-bold text-green-800 mb-4">✅ What This Model Can Do</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Classify handwritten digits (0-9) from MNIST dataset</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Detect edges and basic patterns in images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Output probability distribution over 10 classes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Demonstrate core CNN concepts for educational purposes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Now that you understand the full architecture, dive into each layer to see the 
            computations in action with interactive visualizations.
          </p>
          <Link
            to="/convolution"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-purple-700 font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Start from Convolution
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
