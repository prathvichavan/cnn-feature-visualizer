import { Linkedin, Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="text-sm text-slate-300">
          <div className="font-medium">Educational CNN Feature Extraction Visualizer</div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
            <span>Developed with</span>
            <Heart className="w-3 h-3 text-rose-400" />
            <a
              href="https://www.linkedin.com/in/prathvirajchavan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              Prathviraj Chavan
            </a>
            <span className="text-slate-500">for academic demonstration.</span>
          </div>
        </div>

        <div>
          <a
            href="https://www.linkedin.com/in/prathvirajchavan/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-sm hover:bg-slate-800/90"
            title="Connect on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
            <span>Connect on LinkedIn</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CNN Feature Visualizer. For academic and learning purposes.
      </div>
    </footer>
  );
}
