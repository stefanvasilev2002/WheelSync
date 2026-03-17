-- =============================================================
-- WheelSync - Initial Schema Migration
-- =============================================================

-- Company
CREATE TABLE company (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500),
    phone       VARCHAR(50),
    contact_person VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    company_id     BIGINT REFERENCES company(id) ON DELETE SET NULL,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(50),
    role           VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'FLEET_MANAGER', 'DRIVER')),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    reset_token    VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vehicle
CREATE TABLE vehicle (
    id               BIGSERIAL PRIMARY KEY,
    company_id       BIGINT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    make             VARCHAR(100) NOT NULL,
    model            VARCHAR(100) NOT NULL,
    year             INTEGER NOT NULL,
    vin              VARCHAR(17) NOT NULL UNIQUE,
    license_plate    VARCHAR(20) NOT NULL,
    color            VARCHAR(50),
    engine_type      VARCHAR(50),
    fuel_type        VARCHAR(20) NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL', 'LPG', 'ELECTRIC', 'HYBRID')),
    current_mileage  INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vehicle Assignment
CREATE TABLE vehicle_assignment (
    id               BIGSERIAL PRIMARY KEY,
    vehicle_id       BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    driver_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_date    DATE NOT NULL,
    unassigned_date  DATE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Constraint: vehicle can have at most one active assignment at a time
CREATE UNIQUE INDEX uq_vehicle_active_assignment
    ON vehicle_assignment(vehicle_id)
    WHERE is_active = TRUE;

-- Mileage Log
CREATE TABLE mileage_log (
    id              BIGSERIAL PRIMARY KEY,
    vehicle_id      BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    driver_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    start_mileage   INTEGER NOT NULL,
    end_mileage     INTEGER NOT NULL,
    distance        INTEGER NOT NULL GENERATED ALWAYS AS (end_mileage - start_mileage) STORED,
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_mileage_order CHECK (end_mileage >= start_mileage)
);

-- Fuel Log
CREATE TABLE fuel_log (
    id                  BIGSERIAL PRIMARY KEY,
    vehicle_id          BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    driver_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    fuel_type           VARCHAR(20) NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL', 'LPG', 'ELECTRIC', 'HYBRID')),
    quantity_liters     NUMERIC(8,2) NOT NULL,
    price_per_liter     NUMERIC(10,2) NOT NULL,
    total_price         NUMERIC(12,2) NOT NULL,
    mileage_at_refuel   INTEGER NOT NULL,
    consumption         NUMERIC(6,2),
    location            VARCHAR(255),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Record
CREATE TABLE service_record (
    id           BIGSERIAL PRIMARY KEY,
    vehicle_id   BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN (
                     'OIL_CHANGE', 'FILTER_CHANGE', 'TIRE_CHANGE',
                     'ENGINE_REPAIR', 'TECHNICAL_INSPECTION', 'OTHER')),
    date         DATE NOT NULL,
    mileage      INTEGER NOT NULL,
    location     VARCHAR(255),
    cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
    description  TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
                     CHECK (status IN ('PENDING', 'CONFIRMED')),
    created_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Document
CREATE TABLE service_document (
    id                BIGSERIAL PRIMARY KEY,
    service_record_id BIGINT NOT NULL REFERENCES service_record(id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_type         VARCHAR(10) NOT NULL CHECK (file_type IN ('PDF', 'JPG', 'PNG')),
    file_size         BIGINT NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Defect
CREATE TABLE defect (
    id               BIGSERIAL PRIMARY KEY,
    vehicle_id       BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    reported_by      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    priority         VARCHAR(10) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status           VARCHAR(20) NOT NULL DEFAULT 'REPORTED'
                         CHECK (status IN ('REPORTED', 'IN_PROGRESS', 'RESOLVED')),
    resolution_note  TEXT,
    resolved_date    DATE,
    service_record_id BIGINT REFERENCES service_record(id) ON DELETE SET NULL,
    photo_path       VARCHAR(500),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Maintenance Reminder
CREATE TABLE maintenance_reminder (
    id                      BIGSERIAL PRIMARY KEY,
    vehicle_id              BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    service_type            VARCHAR(30) NOT NULL CHECK (service_type IN (
                                'OIL_CHANGE', 'FILTER_CHANGE', 'TIRE_CHANGE',
                                'ENGINE_REPAIR', 'TECHNICAL_INSPECTION', 'OTHER')),
    interval_type           VARCHAR(10) NOT NULL CHECK (interval_type IN ('MILEAGE', 'DATE')),
    mileage_interval        INTEGER,
    date_interval_months    INTEGER,
    last_service_date       DATE,
    last_service_mileage    INTEGER,
    next_due_date           DATE,
    next_due_mileage        INTEGER,
    warning_threshold_km    INTEGER DEFAULT 1000,
    warning_threshold_days  INTEGER DEFAULT 14,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for frequent queries
CREATE INDEX idx_vehicle_company ON vehicle(company_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assignment_vehicle ON vehicle_assignment(vehicle_id);
CREATE INDEX idx_assignment_driver ON vehicle_assignment(driver_id);
CREATE INDEX idx_mileage_vehicle ON mileage_log(vehicle_id);
CREATE INDEX idx_mileage_driver ON mileage_log(driver_id);
CREATE INDEX idx_fuel_vehicle ON fuel_log(vehicle_id);
CREATE INDEX idx_service_vehicle ON service_record(vehicle_id);
CREATE INDEX idx_defect_vehicle ON defect(vehicle_id);
CREATE INDEX idx_defect_status ON defect(status);
CREATE INDEX idx_reminder_vehicle ON maintenance_reminder(vehicle_id);
