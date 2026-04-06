import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Layers, DollarSign, FileText, AlertTriangle,
  ShoppingCart, Wrench, Filter, Users,
} from "lucide-react";
import ApprovalCard, { type ApprovalItem } from "@/components/projects/ApprovalCard";

const categories = [
  { key: "all", label: "All Requests", icon: ClipboardCheck, badge: '' },
  { key: "design", label: "Design", icon: Layers, badge: 'New' },
  { key: "procurement", label: "Procurement", icon: ShoppingCart, badge: '' },
  { key: "financial", label: "Financial", icon: DollarSign, badge: '$' },
  { key: "contracts", label: "Contracts", icon: FileText, badge: '' },
  { key: "execution", label: "Execution", icon: Wrench, badge: '' },
  { key: "issues", label: "Issues", icon: AlertTriangle, badge: '' },
];

const initialApprovals: ApprovalItem[] = [
  {
    id: "1", title: "Light Oak Wood Flooring", category: "Procurement",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    status: "pending", requestedBy: "Sarah Anderson", date: "4 hours ago",
    cost: "$3,600", description: "Engineered oak flooring for living room and hallway areas.",
  },
  {
    id: "2", title: "Modern Wall Light #2", category: "Design",
    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&h=400&fit=crop",
    status: "pending", requestedBy: "Sarah M.", date: "1 day ago",
    cost: "$1,850", description: "Brass three-light pendant cluster for the dining area.",
  },
  {
    id: "3", title: "Cluster Glass Chandelier", category: "Design",
    image: "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=600&h=400&fit=crop",
    status: "pending", requestedBy: "Sarah M.", date: "1 day ago",
    cost: "$5,400", description: "Crystal cluster chandelier for the main foyer.",
  },
  {
    id: "4", title: "Line Item for Contract Revision", category: "Contracts",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
    status: "pending", requestedBy: "Michael B.", date: "2 days ago",
    cost: "$95,000", description: "Updated scope revision for electrical subcontractor agreement.",
  },
  {
    id: "5", title: "Velvet Sofa — Forest Green", category: "Design",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    status: "approved", requestedBy: "Sarah Anderson", date: "Mar 20, 2025",
    cost: "$2,900",
  },
  {
    id: "6", title: "Italian Marble Selection", category: "Procurement",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    status: "approved", requestedBy: "Mike Johnson", date: "Mar 18, 2025",
    cost: "$28,000",
  },
  {
    id: "7", title: "Black Marble Countertop", category: "Procurement",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=400&fit=crop",
    status: "rejected", requestedBy: "Mike Johnson", date: "Mar 15, 2025",
    cost: "$6,200", description: "Clashes with warm palette — architect recommended lighter option.",
  },
];

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "on_hold";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const handleAction = (id: string, action: "approved" | "rejected" | "on_hold") => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: action } : a)));
  };

  const filtered = approvals
    .filter((a) => activeCategory === "all" || a.category.toLowerCase() === activeCategory)
    .filter((a) => statusFilter === "all" || a.status === statusFilter);

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "on_hold", label: "On Hold" },
  ];

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:block">
        <div className="soft-card p-4 space-y-1 sticky top-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Categories</h3>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
              {cat.key === "all" && pendingCount > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {pendingCount}
                </span>
              )}
              {cat.badge === 'New' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold">New</span>
              )}
              {cat.badge === '$' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-semibold">$</span>
              )}
            </button>
          ))}

          {/* My Actions section */}
          <div className="pt-4 mt-4 border-t border-border/60">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">My Actions</h3>
            {[
              { label: 'Procurement', count: 3, icon: ShoppingCart, color: 'text-success' },
              { label: 'Design', count: 3, icon: Layers, color: 'text-primary' },
              { label: 'Contracts', count: 1, icon: FileText, color: 'text-warning' },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                <a.icon className={`w-4 h-4 ${a.color}`} />
                {a.label}
                <span className="ml-auto text-[10px] font-semibold text-muted-foreground">{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Approval Center</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Recent: <span className="font-medium text-foreground">Approvals ({pendingCount})</span>
            </p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                statusFilter === f.key
                  ? "gradient-primary text-primary-foreground shadow-md shadow-primary/15"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:shadow-sm"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item, i) => (
            <ApprovalCard key={item.id} item={item} index={i} onAction={handleAction} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 soft-card">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No approvals match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
