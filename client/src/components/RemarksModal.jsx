import React from 'react';
import { Modal } from './Modal';
import { MessageSquare, Calendar, MapPin, Tag } from 'lucide-react';

export const RemarksModal = ({ isOpen, onClose, title = "Remarks", subtitle, remarks, event }) => {
  if (!isOpen) return null;

  const displaySubtitle = subtitle || event?.event_name || 'Details';
  const displayRemarks = remarks !== undefined ? remarks : event?.remarks;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={displaySubtitle}
    >
      <div className="space-y-4">
        {event && (
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600 font-semibold">
              {event.event_type && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>{event.event_type}</span>
                </span>
              )}
              {event.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.event_date} {event.event_time ? `@ ${event.event_time}` : ''}</span>
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.venue}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
            <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
            <span>Recorded Remarks</span>
          </div>
          <p className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
            {displayRemarks ? displayRemarks : 'No remarks recorded.'}
          </p>
        </div>

        {event?.alumni_details && (
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs text-slate-800">
            <span className="font-bold text-[#7C3AED]">Alumni Resource Person:</span> {event.alumni_details}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
