DO $$ BEGIN
    ALTER TYPE "kyc_status" ADD VALUE 'unsubmitted';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;