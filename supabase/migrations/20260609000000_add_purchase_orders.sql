-- Create purchase_orders table (procurement pipeline)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    segment_id UUID REFERENCES public.segments(id) ON DELETE SET NULL,
    item TEXT NOT NULL,
    category TEXT,
    supplier_name TEXT,
    quantity NUMERIC DEFAULT 1,
    unit TEXT,
    total_cost NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested','approved','ordered','in_transit','delivered','cancelled')),
    expected_delivery DATE,
    delivered_at DATE,
    notes TEXT,
    requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view purchase orders for their projects" ON public.purchase_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = purchase_orders.project_id
        )
    );

CREATE POLICY "Users can insert purchase orders" ON public.purchase_orders
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update purchase orders for their projects" ON public.purchase_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = purchase_orders.project_id
        )
    );

CREATE POLICY "Users can delete own purchase orders" ON public.purchase_orders
    FOR DELETE USING (auth.uid() = requested_by);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_project ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
