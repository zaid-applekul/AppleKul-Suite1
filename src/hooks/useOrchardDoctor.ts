/**
 * useOrchardDoctor — manages all state + DB mutations for the module.
 * The component becomes a pure render layer; all side-effects live here.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ConsultationRequest,
  ConsultType,
  ActionItem,
} from '../lib/database.types';
import {
  fetchConsultations,
  createConsultation,
  updateConsultationStatus,
  issuePrescription,
  updatePrescriptionStatus,
} from '../lib/orchardDb';

export type MutationState = 'idle' | 'loading' | 'error';

export function useOrchardDoctor(orchardId: string, growerName: string, growerPhone: string) {
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  /* ── Initial load ── */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchConsultations(orchardId);
      setConsultations(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orchardId]);

  useEffect(() => { reload(); }, [reload]);

  /* ── Derived ── */
  const allPrescriptions = useMemo(
    () => consultations.flatMap(c => c.prescription ? [c.prescription] : []),
    [consultations]
  );

  const pendingRxCount = useMemo(
    () => allPrescriptions.filter(rx => rx.status === 'PENDING').length,
    [allPrescriptions]
  );

  /* ── Helpers ── */
  function withMutation<T extends unknown[]>(fn: (...args: T) => Promise<void>) {
    return async (...args: T) => {
      setMutating(true);
      setError(null);
      try {
        await fn(...args);
        await reload();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setMutating(false);
      }
    };
  }

  /* ── Actions ── */

  const requestConsultation = withMutation(async (payload: {
    doctorId: string;
    type: ConsultType;
    targetDateTime: string;
    notes: string;
  }) => {
    await createConsultation({
      growerName,
      growerPhone,
      orchardId,
      doctorId: payload.doctorId,
      type: payload.type,
      targetDateTime: payload.targetDateTime,
      notes: payload.notes,
    });
  });

  const acceptRequest = withMutation(async (consultationId: string, doctorId: string) => {
    await updateConsultationStatus(consultationId, 'IN_PROGRESS', doctorId);
  });

  const issueRx = withMutation(async (payload: {
    consultationId: string;
    doctorName: string;
    hospitalName: string;
    issueDiagnosed: string;
    eppoCode: string;
    recommendation: string;
    followUpDate: string;
    actionItems: Array<{
      category: ActionItem['category'];
      productName: string;
      dosage: string;
      estimatedCost: number;
    }>;
  }) => {
    await issuePrescription(payload);
  });

  const executeRx = withMutation(async (rxId: string) => {
    await updatePrescriptionStatus(rxId, 'APPLIED');
  });

  const flagCorrection = withMutation(async (rxId: string) => {
    await updatePrescriptionStatus(rxId, 'NEEDS_CORRECTION');
  });

  return {
    consultations,
    allPrescriptions,
    pendingRxCount,
    loading,
    mutating,
    error,
    reload,
    requestConsultation,
    acceptRequest,
    issueRx,
    executeRx,
    flagCorrection,
  };
}
