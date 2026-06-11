-- Add approval_status column to documents for Government Approval tracking
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Submitted'
        CHECK (approval_status IN ('Pending','Submitted','Approved','Rejected'));
