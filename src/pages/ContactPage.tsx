import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Linkedin, 
  Mail, 
  Send, 
  User, 
  MessageSquare,
  ExternalLink,
  Heart
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend-only form - just show success message
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Get in Touch
              </h1>
              <p className="text-slate-600">Questions, feedback, or collaboration ideas?</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center">
            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Architecture
            </Link>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-200">
          <p className="text-lg text-slate-700 leading-relaxed">
            If you have questions about CNN concepts, feedback on the visualizations, 
            suggestions for improvements, or collaboration ideas — I'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Contact Information</h2>
            
            {/* Creator Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  PC
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Prathviraj Chavan</h3>
                  <p className="text-slate-600 text-sm">Creator & Developer</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">
                Passionate about making machine learning concepts accessible through 
                interactive visualizations and educational tools.
              </p>

              <a
                href="https://www.linkedin.com/in/prathvirajchavan/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <Linkedin className="w-6 h-6" />
                <div className="flex-1">
                  <p className="font-semibold">Connect on LinkedIn</p>
                  <p className="text-sm text-blue-100">linkedin.com/in/prathvirajchavan</p>
                </div>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            {/* Why Connect */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Why Connect?
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Ask questions about CNN concepts or visualizations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Report bugs or suggest new features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Share how you're using this tool for learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Discuss collaboration opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Connect for academic or professional networking</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Send a Message</h2>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Message Sent!</h3>
                  <p className="text-sm text-slate-600">
                    Thank you for reaching out. This is a demo form - for actual contact, 
                    please use LinkedIn.
                  </p>
                </div>
              ) : (
                <form id="contact-form" className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Your Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                      placeholder="Your message here..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    id="contact-submit"
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>

                  <p className="text-xs text-slate-500 text-center mt-4">
                    Note: This is a frontend-only demo form. For actual contact, please connect via LinkedIn.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Thank You for Learning!</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6">
            This CNN Feature Extraction Visualizer was created to help students and beginners 
            understand the inner workings of Convolutional Neural Networks. I hope it makes 
            your learning journey easier and more enjoyable!
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <span>Made with</span>
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
            <span>for the ML community</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
