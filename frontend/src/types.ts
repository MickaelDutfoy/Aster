export type MemberForm = {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
};

export type LogForm = {
  email: string;
  password: string;
};

export type Org = {
  id: number;
  name: string;
  superadmin_first_name?: string;
  superadmin_last_name?: string;
};

export type PendingMember = {
  org_id: number;
  org_name: string;
  member_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

export type AnimalListItem = {
  id: number;
  name: string;
  species: string;
  sex?: 'M' | 'F' | '';
  color: string;
  birth_date: string; // date
  is_neutered: boolean;
  last_vax?: string; // date
  is_primo_vax?: boolean;
  last_deworm?: string; // date
  is_first_deworm?: boolean;
  information?: string;
};