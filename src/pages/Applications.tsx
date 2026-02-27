import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { useState } from "react";

const applications = [
  { id: "APP-2847", name: "Amara Diallo", country: "Senegal", product: "Micro-loan", score: 745, status: "Approved", date: "2026-02-27" },
  { id: "APP-2846", name: "Kwame Mensah", country: "Ghana", product: "SME Working Capital", score: 580, status: "Review", date: "2026-02-27" },
  { id: "APP-2845", name: "Fatima Abdi", country: "Kenya", product: "Nano-credit", score: 820, status: "Approved", date: "2026-02-26" },
  { id: "APP-2844", name: "Jean Habimana", country: "Rwanda", product: "Retail Individual", score: 410, status: "Declined", date: "2026-02-26" },
  { id: "APP-2843", name: "Ngozi Okafor", country: "Nigeria", product: "Micro-enterprise", score: 690, status: "Approved", date: "2026-02-25" },
  { id: "APP-2842", name: "Tendai Moyo", country: "Zimbabwe", product: "Micro-loan", score: 555, status: "Review", date: "2026-02-25" },
  { id: "APP-2841", name: "Adama Traoré", country: "Mali", product: "Nano-credit", score: 730, status: "Approved", date: "2026-02-24" },
  { id: "APP-2840", name: "Hawa Kamara", country: "Sierra Leone", product: "Retail Individual", score: 380, status: "Declined", date: "2026-02-24" },
];

const getStatusColor = (status: string) => {
  if (status === "Approved") return "bg-success/20 text-success border-success/30";
  if (status === "Review") return "bg-warning/20 text-warning border-warning/30";
  return "bg-destructive/20 text-destructive border-destructive/30";
};

const NewApplicationModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-glass-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New Application</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="retail" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="retail">Retail Individual</TabsTrigger>
            <TabsTrigger value="micro">Micro-enterprise</TabsTrigger>
            <TabsTrigger value="sme">SME</TabsTrigger>
          </TabsList>
          <TabsContent value="retail" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input placeholder="Enter borrower name" className="mt-1 bg-muted/50 border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">ID Type & Number</Label>
                <Input placeholder="NIN / BVN / National ID" className="mt-1 bg-muted/50 border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                <Input placeholder="+254 700 000 000" className="mt-1 bg-muted/50 border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Select>
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kenya">Kenya</SelectItem>
                    <SelectItem value="nigeria">Nigeria</SelectItem>
                    <SelectItem value="ghana">Ghana</SelectItem>
                    <SelectItem value="rwanda">Rwanda</SelectItem>
                    <SelectItem value="senegal">Senegal</SelectItem>
                    <SelectItem value="tanzania">Tanzania</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Requested Amount</Label>
                <Input placeholder="50,000" type="number" className="mt-1 bg-muted/50 border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tenor (months)</Label>
                <Input placeholder="12" type="number" className="mt-1 bg-muted/50 border-border" />
              </div>
            </div>
            <Button className="w-full">Submit Application</Button>
          </TabsContent>
          <TabsContent value="micro" className="mt-4">
            <p className="py-8 text-center text-sm text-muted-foreground">Micro-enterprise form — same structure with business fields</p>
            <Button className="w-full">Submit Application</Button>
          </TabsContent>
          <TabsContent value="sme" className="mt-4">
            <p className="py-8 text-center text-sm text-muted-foreground">SME form — includes trade license, business registration fields</p>
            <Button className="w-full">Submit Application</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const Applications = () => {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage borrower applications across all markets</p>
        </div>
        <NewApplicationModal />
      </div>

      {/* Filters */}
      <GlassCard hover={false} className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or country..."
              className="bg-muted/50 pl-9 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 border-border bg-muted/50">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Borrower", "Country", "Product", "Score", "Status", "Date"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications
                .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()))
                .map((app) => (
                  <tr key={app.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="py-3 font-mono text-xs text-muted-foreground">{app.id}</td>
                    <td className="py-3 font-medium text-foreground">{app.name}</td>
                    <td className="py-3 text-muted-foreground">{app.country}</td>
                    <td className="py-3 text-muted-foreground">{app.product}</td>
                    <td className="py-3 font-display font-semibold text-foreground">{app.score}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={getStatusColor(app.status)}>{app.status}</Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{app.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
};

export default Applications;
