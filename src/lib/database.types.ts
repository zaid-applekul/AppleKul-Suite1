export type ConsultType   = 'CHAT' | 'CALL' | 'VIDEO' | 'ONSITE_VISIT';
export type ConsultStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED';
export type PrescriptionStatus = 'PENDING' | 'APPLIED' | 'NEEDS_CORRECTION';
export type ActionCategory = 'FUNGICIDE' | 'INSECTICIDE' | 'FERTILIZER' | 'LABOR' | 'IRRIGATION' | 'OTHER';

export interface Database {
  public: {
    Tables: {
      consultations: {
        Row: {
          id: string;
          grower_name: string;
          grower_phone: string;
          orchard_id: string;
          doctor_id: string | null;
          type: ConsultType;
          status: ConsultStatus;
          target_datetime: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consultations']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consultations']['Insert']>;
      };
      prescriptions: {
        Row: {
          id: string;
          consultation_id: string;
          doctor_name: string;
          hospital_name: string;
          issue_diagnosed: string;
          eppo_code: string;
          recommendation: string;
          status: PrescriptionStatus;
          issued_at: string;
          follow_up_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>;
      };
      prescription_action_items: {
        Row: {
          id: string;
          prescription_id: string;
          category: ActionCategory;
          product_name: string;
          dosage: string;
          estimated_cost: number;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['prescription_action_items']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['prescription_action_items']['Insert']>;
      };
    };
  };
}

/* ── Hydrated app-level types (with nested relations) ── */

export interface ActionItem {
  id: string;
  category: ActionCategory;
  productName: string;
  dosage: string;
  estimatedCost: number;
}

export interface DigitalPrescription {
  id: string;
  consultationId: string;
  doctorName: string;
  hospitalName: string;
  issueDiagnosed: string;
  eppoCode: string;
  recommendation: string;
  actionItems: ActionItem[];
  status: PrescriptionStatus;
  issuedAt: string;
  followUpDate: string;
}

export interface ConsultationRequest {
  id: string;
  growerName: string;
  growerPhone: string;
  orchardId: string;
  doctorId: string | null;
  type: ConsultType;
  status: ConsultStatus;
  targetDateTime: string;
  notes: string;
  prescription?: DigitalPrescription;
  createdAt: string;
}
