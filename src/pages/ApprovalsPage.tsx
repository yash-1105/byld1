import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Layers,
  DollarSign,
  FileText,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  Filter,
} from "lucide-react";
import ApprovalCard, { type ApprovalItem } from "@/components/projects/ApprovalCard";

const categories = [
  { key: "all", label: "All Requests", icon: ClipboardCheck },
  { key: "design", label: "Design", icon: Layers },
  { key: "procurement", label: "Procurement", icon: ShoppingCart },
  { key: "financial", label: "Financial", icon: DollarSign },
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "issues", label: "Issues", icon: AlertTriangle },
];

const initialApprovals: ApprovalItem[] = [
  {
    id: "1",
    title: "Modern Wall Light #2",
    category: "Design",
    image: "https://unsplash.com/photos/black-pendant-lamp-turned-on-in-dark-room-ocVpzd5LJOA",
    status: "pending",
    requestedBy: "Sarah Anderson",
    date: "Mar 28, 2025",
    cost: "$1,850",
    description: "Brass three-light pendant cluster for the dining area, replaces single fixture.",
  },
  {
    id: "2",
    title: "Italian Marble Selection",
    category: "Procurement",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    status: "pending",
    requestedBy: "Mike Johnson",
    date: "Mar 27, 2025",
    cost: "$28,000",
    description: "Calacatta Gold marble for master bathroom and kitchen countertops.",
  },
  {
    id: "3",
    title: "HVAC System Upgrade",
    category: "Financial",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop",
    status: "pending",
    requestedBy: "Alex Rivera",
    date: "Mar 26, 2025",
    cost: "$45,000",
    description: "Upgrade from standard to smart HVAC with zone control for all floors.",
  },
  {
    id: "4",
    title: "Floor Tile — Herringbone Oak",
    category: "Design",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    status: "pending",
    requestedBy: "Sarah Anderson",
    date: "Mar 25, 2025",
    cost: "$3,600",
    description: "Engineered oak herringbone tiles for living room and hallway.",
  },
  {
    id: "5",
    title: "Velvet Sofa — Forest Green",
    category: "Design",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    status: "approved",
    requestedBy: "Sarah Anderson",
    date: "Mar 20, 2025",
    cost: "$2,900",
  },
  {
    id: "6",
    title: "Electrical Subcontractor",
    category: "Contracts",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
    status: "approved",
    requestedBy: "Mike Johnson",
    date: "Mar 18, 2025",
    cost: "$95,000",
  },
  {
    id: "7",
    title: "Black Marble Countertop",
    category: "Procurement",
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=400&fit=crop",
    status: "rejected",
    requestedBy: "Mike Johnson",
    date: "Mar 15, 2025",
    cost: "$6,200",
    description: "Clashes with warm palette — architect recommended lighter option.",
  },
];

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "on_hold";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const handleAction = (id: string, action: "approved" | "rejected" | "on_hold", reason?: string) => {
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
  ];

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="soft-card p-4 space-y-1 sticky top-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Categories</h3>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
              {cat.key === "all" && pendingCount > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-semibold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Approval Center</h1>
            <p className="text-muted-foreground text-sm mt-1">{pendingCount} items awaiting review</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 text-warning text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {pendingCount} pending
            </div>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === f.key
                  ? "gradient-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
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
