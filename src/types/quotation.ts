
import { Project, User } from './index';

export interface Provider {
  id: string;
  provider_name: string;
  equipment_name: string;
  contact?: string;
  price?: number;
  delivery_time_days?: number;
  created_at: Date;
}

export interface Quotation {
  id: string;
  project_id: string;
  requested_by?: string;
  status: 'En elaboración' | 'Enviada' | 'Aprobada' | 'Rechazada';
  delivery_deadline: Date;
  created_at: Date;
  updated_at: Date;
  
  // Relationships (not stored in database)
  project?: Project;
  requester?: User;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  equipment_name: string;
  ficha_estado: 'Por hacer' | 'En proceso' | 'Completado';
  ficha_responsable?: string;
  created_at: Date;
  updated_at: Date;
  
  // Relationships (not stored in database)
  responsible?: User;
}
