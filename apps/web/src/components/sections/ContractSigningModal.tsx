'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Award,
  PenTool,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { API_BASE_URL } from '@/lib/constants';

interface ContractSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  onContractSigned?: () => void;
}

export function ContractSigningModal({
  isOpen,
  onClose,
  contractId,
  onContractSigned,
}: ContractSigningModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [signerName, setSignerName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerminateForm, setShowTerminateForm] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setSignerName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && contractId && token) {
      fetchContract();
    }
  }, [isOpen, contractId, token]);

  const fetchContract = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setContract(data.data);
      } else {
        setError(data.error || 'Failed to load contract details');
      }
    } catch {
      setError('Connection failure loading contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signerName.trim()) {
      setError('Please enter your full legal name to sign');
      return;
    }
    if (!acceptedTerms) {
      setError('Please check the box confirming you accept the contract terms');
      return;
    }

    setSigning(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signerName: signerName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setContract(data.data);
        if (onContractSigned) onContractSigned();
      } else {
        setError(data.error || 'Failed to sign contract');
      }
    } catch {
      setError('Failed to process digital signature');
    } finally {
      setSigning(false);
    }
  };

  const handleTerminate = async () => {
    setTerminating(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/contracts/${contractId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: terminationReason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setContract(data.data);
        setShowTerminateForm(false);
      } else {
        setError(data.error || 'Failed to terminate contract');
      }
    } catch {
      setError('Failed to process termination request');
    } finally {
      setTerminating(false);
    }
  };

  if (!isOpen) return null;

  const isStudent = contract?.studentUserId === currentUser?.id;
  const isTutor = contract?.tutorUserId === currentUser?.id;
  const mySignature = isStudent ? contract?.studentSignature : contract?.tutorSignature;
  const alreadySigned = mySignature?.signed;
  const isFullyActive = contract?.status === 'ACTIVE';
  const isTerminating = contract?.status === 'TERMINATING';
  const isTerminated = contract?.status === 'TERMINATED';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#dadee2] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#dadee2] bg-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f6ee] text-[#00A453] border border-[#00A453]/20 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2d2d2d] flex items-center gap-2">
                Tutoring Agreement & Contract
                {isFullyActive && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-[#e6f6ee] text-[#00A453] rounded-full border border-[#00A453]/20">
                    ✓ ACTIVE
                  </span>
                )}
                {isTerminating && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                    ENDING SOON
                  </span>
                )}
                {isTerminated && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                    TERMINATED
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#647380] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00A453]" /> Payments are tracked here,
                but sent directly between you and the other party
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-gray-500 animate-pulse">
              Loading official contract document...
            </div>
          ) : error && !contract ? (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          ) : contract ? (
            <>
              {/* Engagement Overview Card */}
              <div className="bg-[#f8fafc] border border-[#dadee2] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#dadee2] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#647380]">
                      Subject / Program
                    </span>
                    <h3 className="text-base font-black text-[#2d2d2d]">{contract.subject}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-[#647380]">
                      Agreed Tuition Fee
                    </span>
                    <div className="text-lg font-black text-[#00A453]">
                      ₹{contract.agreedRate}
                      <span className="text-xs text-[#647380] font-bold">
                        {' '}
                        / {contract.billingType.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#2d2d2d]">
                  <div>
                    <span className="text-[#647380] block text-[11px]">Class Frequency:</span>
                    <span>{contract.classesPerWeek || 3} Sessions / Week</span>
                  </div>
                  <div>
                    <span className="text-[#647380] block text-[11px]">Schedule / Timing:</span>
                    <span>{contract.scheduleNotes || 'Mutually Agreed Schedule'}</span>
                  </div>
                </div>
              </div>

              {/* Legal Terms & Platform Policies */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Agreement Terms & Obligations
                </h4>
                <div className="bg-white border border-[#dadee2] rounded-2xl p-4 space-y-2.5 text-xs text-[#384148] font-medium leading-relaxed">
                  {(contract.terms || []).map((term: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#e6f6ee] text-[#00A453] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{term}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures Overview Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#647380] uppercase tracking-wider">
                  Digital Signatures Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Student Signature Box */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      contract.studentSignature?.signed
                        ? 'bg-[#e6f6ee] border-[#00A453]/30 text-[#00A453]'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Student Signature</span>
                      {contract.studentSignature?.signed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-100 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    {contract.studentSignature?.signed ? (
                      <p className="text-[11px] font-medium text-emerald-800">
                        Signed by <strong>{contract.studentSignature.signerName}</strong> on{' '}
                        {new Date(contract.studentSignature.signedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-700">Awaiting student signature</p>
                    )}
                  </div>

                  {/* Tutor Signature Box */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      contract.tutorSignature?.signed
                        ? 'bg-[#e6f6ee] border-[#00A453]/30 text-[#00A453]'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Tutor Signature</span>
                      {contract.tutorSignature?.signed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-100 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    {contract.tutorSignature?.signed ? (
                      <p className="text-[11px] font-medium text-emerald-800">
                        Signed by <strong>{contract.tutorSignature.signerName}</strong> on{' '}
                        {new Date(contract.tutorSignature.signedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-700">Awaiting tutor signature</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Signing Action Section */}
              {!alreadySigned ? (
                <div className="bg-[#f8fafc] border border-[#dadee2] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-[#2d2d2d] flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-[#00A453]" /> Execute Digital Signature
                  </h4>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-[#647380] block">
                      Full Legal Name (Digital Signature)
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="e.g. Rishu Rana"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#dadee2] text-xs font-bold text-[#2d2d2d] focus:outline-none focus:border-[#00A453]"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-[#2d2d2d]">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#00A453] focus:ring-[#00A453] mt-0.5 cursor-pointer"
                    />
                    <span>
                      I confirm that I have read and agree to all contract terms, fees, and the
                      findmyTutor platform terms of service.
                    </span>
                  </label>

                  <Button
                    onClick={handleSign}
                    disabled={signing}
                    className="w-full bg-[#00A453] hover:bg-[#009048] text-white font-black text-sm h-11 rounded-xl shadow-xs gap-2"
                  >
                    {signing ? 'Processing Signature...' : '✍ Digitally Sign & Accept Contract'}
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#e6f6ee] border border-[#00A453]/30 text-center space-y-1">
                  <p className="text-xs font-black text-[#00A453] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> You Have Signed This Agreement
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    {isFullyActive
                      ? 'Both parties have signed! Your tutoring engagement is officially active.'
                      : 'Waiting for the other party to complete their signature.'}
                  </p>
                </div>
              )}

              {/* Termination status / action */}
              {isTerminating && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <p className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                    <Ban className="w-4 h-4" /> Termination Notice Given
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold">
                    {contract.terminationRequestedBy === currentUser?.id
                      ? 'You gave'
                      : 'The other party gave'}{' '}
                    notice to end this agreement on{' '}
                    {new Date(contract.terminationNoticeAt).toLocaleDateString()}. It will end on{' '}
                    <strong>
                      {new Date(contract.terminationEffectiveAt).toLocaleDateString()}
                    </strong>
                    .{contract.terminationReason ? ` Reason: "${contract.terminationReason}"` : ''}
                  </p>
                </div>
              )}
              {isTerminated && (
                <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-center">
                  <p className="text-xs font-black text-gray-700 flex items-center justify-center gap-1.5">
                    <Ban className="w-4 h-4" /> This agreement has been terminated
                  </p>
                </div>
              )}
              {isFullyActive && (isStudent || isTutor) && (
                <div className="border-t border-dashed border-gray-200 pt-4">
                  {!showTerminateForm ? (
                    <button
                      onClick={() => setShowTerminateForm(true)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline"
                    >
                      End this agreement
                    </button>
                  ) : (
                    <div className="space-y-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                      <h4 className="text-xs font-black text-red-700 flex items-center gap-1.5">
                        <Ban className="w-4 h-4" /> Give Termination Notice
                      </h4>
                      <p className="text-[11px] text-red-600 font-medium">
                        Per the agreement terms, this takes effect 7 days from now. The other party
                        will be notified immediately.
                      </p>
                      <textarea
                        value={terminationReason}
                        onChange={(e) => setTerminationReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="w-full h-16 px-3 py-2 rounded-xl border border-red-200 text-xs resize-none focus:outline-none focus:border-red-400"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleTerminate}
                          disabled={terminating}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs h-9 rounded-xl"
                        >
                          {terminating ? 'Submitting...' : 'Confirm Termination Notice'}
                        </Button>
                        <button
                          onClick={() => setShowTerminateForm(false)}
                          className="px-4 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
