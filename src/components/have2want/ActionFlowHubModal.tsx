import React, { useState } from 'react';
import { X, ExternalLink, Settings, RotateCcw, Check, Zap, Layers } from 'lucide-react';
import { toast } from 'sonner';
import {
  ActionFlowAppSlot,
  loadActionFlowSlots,
  saveActionFlowSlots,
  resetActionFlowSlots,
  isSafeExternalUrl,
} from '@/lib/actionFlowAppsConfig';

interface ActionFlowHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActionFlowHubModal({ isOpen, onClose }: ActionFlowHubModalProps) {
  const [slots, setSlots] = useState<ActionFlowAppSlot[]>(() => loadActionFlowSlots());
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [draftSlot, setDraftSlot] = useState<ActionFlowAppSlot | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (slot: ActionFlowAppSlot) => {
    setEditingSlotId(slot.slotId);
    setDraftSlot({ ...slot });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftSlot) return;
    if (!isSafeExternalUrl(draftSlot.targetUrl)) {
      toast.error('Inserisci un URL valido che inizi con https:// o http://');
      return;
    }
    const updated = slots.map((s) => (s.slotId === draftSlot.slotId ? { ...draftSlot, isConfigured: true } : s));
    setSlots(updated);
    saveActionFlowSlots(updated);
    setEditingSlotId(null);
    setDraftSlot(null);
    toast.success(`Slot "${draftSlot.name}" aggiornato`);
  };

  const handleResetAll = () => {
    const defaults = resetActionFlowSlots();
    setSlots(defaults);
    setEditingSlotId(null);
    setDraftSlot(null);
    toast.info('Slot ActionFlow Hub ripristinati ai valori predefiniti');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-lime-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/20 border border-lime-400/50 flex items-center justify-center text-lime-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-lime-400">
                ACTIONFLOW HUB • SATELLITE BRIDGE ESTERNO
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                3 Slot App Esterne Pronte all'Uso
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              title="Ripristina i 3 slot predefiniti"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ripristina</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-lime-950/30 border border-lime-500/30 text-xs text-lime-200 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-lime-400 shrink-0" />
            <span>
              Collega o sostituisci in qualsiasi momento le 3 applicazioni esterne partner senza toccare il codice principale.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {slots.map((slot, index) => {
              const isEditing = editingSlotId === slot.slotId && draftSlot;
              return (
                <div
                  key={slot.slotId}
                  className="rounded-2xl bg-zinc-900/75 border border-zinc-800 p-4 flex flex-col justify-between gap-3"
                >
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-2.5 text-xs">
                      <div className="font-black text-lime-300 uppercase text-[10px]">
                        Configura Slot #{index + 1}
                      </div>
                      <input
                        type="text"
                        value={draftSlot.name}
                        onChange={(e) => setDraftSlot({ ...draftSlot, name: e.target.value })}
                        placeholder="Nome App"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs"
                        required
                      />
                      <input
                        type="text"
                        value={draftSlot.category}
                        onChange={(e) => setDraftSlot({ ...draftSlot, category: e.target.value })}
                        placeholder="Categoria"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs"
                      />
                      <input
                        type="url"
                        value={draftSlot.targetUrl}
                        onChange={(e) => setDraftSlot({ ...draftSlot, targetUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs font-mono"
                        required
                      />
                      <textarea
                        value={draftSlot.tagline}
                        onChange={(e) => setDraftSlot({ ...draftSlot, tagline: e.target.value })}
                        placeholder="Descrizione breve"
                        rows={2}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-white text-xs resize-none"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSlotId(null);
                            setDraftSlot(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-1.5 rounded-lg bg-lime-400 text-black font-black flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salva</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{slot.icon}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Slot {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-lime-400">
                            {slot.category}
                          </div>
                          <h3 className="text-sm font-black text-white mt-0.5">{slot.name}</h3>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            {slot.tagline}
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">
                          {slot.targetUrl}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                        <a
                          href={slot.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Apri App</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(slot)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                          title="Sostituisci o configura questa app"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
