// src/pages/EvidenceVaultPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderLock,
  Search,
  Plus,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EvidenceCard from '../components/cards/EvidenceCard';
import Modal from '../components/common/Modal';
import {
  fetchEvidenceItems,
  createEvidenceItem,
  deleteEvidenceItem,
} from '../services/safetyApi';

export default function EvidenceVaultPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Screenshots');
  const [newDescription, setNewDescription] = useState('');
  const [newSource, setNewSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Detail / View modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const categories = ['All', 'Screenshots', 'Documents', 'Messages', 'Links', 'Transaction records', 'Other'];

  const loadEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchEvidenceItems(selectedCategory, searchQuery);
      setItems(res.items || []);
    } catch (err) {
      console.warn('Failed to load evidence:', err.message);
      setError(err.message || 'Unable to retrieve evidence items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEvidence();
  };

  const handleCreateEvidence = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const created = await createEvidenceItem({
        name: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim(),
        source: newSource.trim(),
        size: '1.2 MB',
      });

      setItems([created, ...items]);
      setNewTitle('');
      setNewDescription('');
      setNewSource('');
      setNewCategory('Screenshots');
      setIsAddModalOpen(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvidence = async (id) => {
    if (!window.confirm('Are you sure you want to remove this evidence item from your vault?')) return;
    try {
      setDeletingId(id);
      await deleteEvidenceItem(id);
      setItems(items.filter((item) => (item._id || item.id) !== id));
      if (selectedItem && (selectedItem._id || selectedItem.id) === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title={t('vault.title')}
        subtitle={t('vault.subtitle')}
        backUrl="/my-safety"
        backLabel="Back to My Safety Hub"
        badge={
          <Badge variant="teal" size="sm">
            {items.length} Preserved Records
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            onClick={() => setIsAddModalOpen(true)}
          >
            Preserve New Evidence
          </Button>
        }
      />

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence by name, description, source..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-800 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>User Scoped & Isolated</span>
            </div>
            <button
              type="button"
              onClick={loadEvidence}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading vault artifacts...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadEvidence}>
            Retry
          </Button>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const itemId = item._id || item.id;
            return (
              <div key={itemId} className="relative group">
                <EvidenceCard
                  name={item.name}
                  category={item.category}
                  size={item.size || '1.0 MB'}
                  uploadedDate={
                    item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recently'
                  }
                  relatedIncident={item.relatedIncidentId ? `Incident Linked` : 'Individual Record'}
                  relatedAnalysis={item.relatedAnalysisId ? 'Verification Linked' : null}
                  description={item.description}
                  tag={item.tag}
                  onView={() => setSelectedItem(item)}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteEvidence(itemId)}
                  disabled={deletingId === itemId}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete evidence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <FolderLock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Evidence Vault is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Preserve screenshots, suspicious investment proposals, or chat transcripts here for future dispute resolution.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            onClick={() => setIsAddModalOpen(true)}
          >
            Preserve First Evidence
          </Button>
        </div>
      )}

      {/* Preserve Evidence Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Preserve Evidence in Vault"
        subtitle="Evidence is stored securely and mapped strictly to your authenticated account."
      >
        <form onSubmit={handleCreateEvidence} className="space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="ev-name">
              Evidence Title / File Name *
            </label>
            <input
              id="ev-name"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="e.g. Telegram_VIP_Advisory_Offer.png"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-800"
            >
              <option value="Screenshots">Screenshots</option>
              <option value="Documents">Documents</option>
              <option value="Messages">Messages</option>
              <option value="Links">Links</option>
              <option value="Transaction records">Transaction records</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source / Origin URL</label>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="e.g. t.me/vip_trading_tips or https://unverified-trader.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contextual Description</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide context on what this claim promises and why it was preserved..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <strong className="block font-semibold">Safety Guardrail:</strong>
            <p>
              Do NOT record passwords, OTPs, or UPI PINs. Raw transaction numbers and unedited screenshots
              provide the highest evidentiary value for statutory portals.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={submitting}
              icon={submitting ? Loader2 : Check}
              iconPosition="left"
            >
              {submitting ? 'Preserving...' : 'Save to Vault'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Item Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.name}
          subtitle={`Preserved on ${
            selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'
          }`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-semibold text-slate-800">{selectedItem.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status</span>
                <span className="font-semibold text-slate-800">{selectedItem.status}</span>
              </div>
              {selectedItem.source && (
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Source / Origin</span>
                  <span className="font-mono text-slate-700 break-all">{selectedItem.source}</span>
                </div>
              )}
            </div>

            {selectedItem.description && (
              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Description & Context
                </span>
                <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>
            )}

            <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-teal-950">
              <span className="font-semibold block mb-0.5">Statutory Evidentiary Note</span>
              <p className="text-teal-800">
                {selectedItem.uncertaintyNote ||
                  'Self-reported record preserved in NiveshGuard Evidence Vault. Ready for export to SEBI SCORES or 1930 Cybercrime.'}
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => handleDeleteEvidence(selectedItem._id || selectedItem.id)}
              >
                Delete Record
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
