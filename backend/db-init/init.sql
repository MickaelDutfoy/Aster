DROP TABLE IF EXISTS animals;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS member_organization;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS organizations;

-- Associations
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membre-asso (relation avec rôle)
CREATE TABLE IF NOT EXISTS member_organization (
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('member', 'admin', 'superadmin')) DEFAULT 'member',
  status TEXT CHECK (status IN ('pending', 'validated')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (member_id, organization_id)
);

-- Familles d’accueil
CREATE TABLE families (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  address TEXT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Animaux
CREATE TABLE IF NOT EXISTS animals (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  sex VARCHAR(1),
  color TEXT,
  birth_date DATE NOT NULL,
  is_neutered BOOLEAN NOT NULL,
  status TEXT CHECK (status IN ('unhosted', 'fostered', 'adopted')) DEFAULT 'unhosted',
  last_vax DATE,
  is_primo_vax BOOLEAN DEFAULT false,
  last_deworm DATE,
  is_first_deworm BOOLEAN DEFAULT false,
  information TEXT,
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);