-- Create reimbursements table for tracking client-reimbursable expenses
CREATE TABLE IF NOT EXISTS public.reimbursements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    client_id TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    submitted_by_name TEXT NOT NULL DEFAULT '',
    expense_type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'AED',
    description TEXT NOT NULL DEFAULT '',
    date_incurred DATE NOT NULL,
    submission_date DATE,
    payment_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','pending_client_review','approved','rejected','paid','overdue')),
    receipt_url TEXT,
    supporting_docs TEXT[],
    notes TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;

-- View: accessible by anyone who can see the project
CREATE POLICY "Users can view reimbursements for their projects" ON public.reimbursements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = reimbursements.project_id
        )
    );

-- Insert: submitter must be authenticated user
CREATE POLICY "Users can insert reimbursements" ON public.reimbursements
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Update: anyone who can see the project can update (approve/reject/mark paid)
CREATE POLICY "Users can update reimbursements for their projects" ON public.reimbursements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = reimbursements.project_id
        )
    );

-- Delete: only submitter can delete (draft only enforced in app logic)
CREATE POLICY "Users can delete own reimbursements" ON public.reimbursements
    FOR DELETE USING (auth.uid() = submitted_by);

CREATE INDEX IF NOT EXISTS idx_reimbursements_project ON public.reimbursements(project_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON public.reimbursements(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_submitted_by ON public.reimbursements(submitted_by);
