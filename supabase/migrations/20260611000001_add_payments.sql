-- Create payments table for tracking project payments to vendors/contractors
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    payee TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Other',
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'AED',
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled','processing','completed','overdue','cancelled')),
    reference TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their projects" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = payments.project_id
        )
    );

CREATE POLICY "Users can insert payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update payments for their projects" ON public.payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = payments.project_id
        )
    );

CREATE POLICY "Users can delete own payments" ON public.payments
    FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
