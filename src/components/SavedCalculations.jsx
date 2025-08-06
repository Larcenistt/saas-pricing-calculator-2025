import { useState, useEffect } from 'react';
import { 
  getSavedCalculations, 
  deleteCalculation, 
  updateCalculation,
  createShareableUrl,
  exportCalculations 
} from '../utils/savedCalculations';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function SavedCalculations({ onLoad }) {
  const [calculations, setCalculations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = () => {
    const saved = getSavedCalculations();
    setCalculations(saved);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="mb-2">Delete this calculation?</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={() => {
              deleteCalculation(id);
              loadCalculations();
              toast.dismiss(t.id);
              toast.success('Calculation deleted');
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 bg-gray-500 text-white rounded"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleRename = (id) => {
    if (editName.trim()) {
      updateCalculation(id, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      loadCalculations();
      toast.success('Calculation renamed');
    }
  };

  const handleShare = (calc) => {
    const url = createShareableUrl(calc.id);
    setShareUrl(url);
    setShowShareModal(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Share link copied to clipboard!');
    });
  };

  const handleExport = () => {
    exportCalculations();
    toast.success('Calculations exported');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (calculations.length === 0) {
    return (
      <GlassCard className="text-center py-8">
        <svg className="w-16 h-16 mx-auto mb-4 text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-secondary/60 mb-2">No saved calculations yet</p>
        <p className="text-sm text-secondary/40">Your calculations will appear here after you save them</p>
      </GlassCard>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-secondary">Saved Calculations</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            className="text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All
          </Button>
        </div>

        {calculations.map((calc) => (
          <div key={calc.id}>
              <GlassCard className="p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === calc.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleRename(calc.id)}
                          className="input input-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRename(calc.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <h4 className="font-semibold text-secondary mb-1">{calc.name}</h4>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-secondary/60 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(calc.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${calc.inputs.currentPrice}/mo → ${calc.results?.pricingTiers?.basic?.price || 'N/A'}/mo
                      </span>
                    </div>

                    {calc.notes && (
                      <p className="text-sm text-secondary/50 mb-3">{calc.notes}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onLoad(calc)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleShare(calc)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(calc.id);
                          setEditName(calc.name);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(calc.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-darker border border-subtle rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
              <h3 className="text-xl font-semibold mb-4">Share Calculation</h3>
              <p className="text-secondary/60 mb-4">
                Share this link with anyone to let them view your calculation:
              </p>
              <div className="bg-dark/50 rounded-lg p-3 mb-4 break-all text-sm font-mono">
                {shareUrl}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Copied to clipboard!');
                  }}
                  className="flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowShareModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}