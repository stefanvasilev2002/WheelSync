-- Allow 'BOTH' as a valid interval_type in maintenance_reminder

ALTER TABLE maintenance_reminder
    DROP CONSTRAINT IF EXISTS maintenance_reminder_interval_type_check;

ALTER TABLE maintenance_reminder
    ADD CONSTRAINT maintenance_reminder_interval_type_check
        CHECK (interval_type IN ('MILEAGE', 'DATE', 'BOTH'));
