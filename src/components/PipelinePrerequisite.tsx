/**
 * PipelinePrerequisite Component
 * 
 * Shows a warning when a user visits a CNN stage page
 * without completing the required previous stage.
 */

import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export interface PrerequisiteInfo {
  stageName: string;
  stageRoute: string;
  isComplete: boolean;
}

interface PipelinePrerequisiteProps {
  prerequisite: PrerequisiteInfo | null;
  currentStageName: string;
}

export function PipelinePrerequisite({ prerequisite, currentStageName }: PipelinePrerequisiteProps) {
  // If no prerequisite or prerequisite is complete, don't show anything
  if (!prerequisite || prerequisite.isComplete) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-800 text-lg mb-2">
            Previous Step Required
          </h3>
          <p className="text-amber-700 mb-4">
            To visualize <strong>{currentStageName}</strong>, you need to complete 
            the <strong>{prerequisite.stageName}</strong> step first. 
            The CNN pipeline processes data sequentially, and each stage depends 
            on the output of the previous stage.
          </p>
          <Link
            to={prerequisite.stageRoute}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to {prerequisite.stageName}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * PipelineProgress Component
 * 
 * Shows the overall progress of the CNN pipeline
 */

interface PipelineStage {
  name: string;
  route: string;
  isComplete: boolean;
  isCurrent: boolean;
}

interface PipelineProgressProps {
  stages: PipelineStage[];
}

export function PipelineProgress({ stages }: PipelineProgressProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-slate-700 mb-3 text-sm">Pipeline Progress</h3>
      <div className="flex items-center gap-2 flex-wrap">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center gap-2">
            <Link
              to={stage.route}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-colors
                ${stage.isCurrent 
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' 
                  : stage.isComplete 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
              `}
            >
              {stage.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              )}
              {stage.name}
            </Link>
            {index < stages.length - 1 && (
              <span className="text-slate-300">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
