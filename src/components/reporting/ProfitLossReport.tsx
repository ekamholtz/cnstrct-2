import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfitLossReportProps {
  projects: any[];
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ projects }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [activeTab, setActiveTab] = useState("accrual");

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort projects based on selected sort option
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date-asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "profit-desc":
        return b.profit - a.profit;
      case "profit-asc":
        return a.profit - b.profit;
      case "revenue-desc":
        return b.revenue - a.revenue;
      case "revenue-asc":
        return a.revenue - b.revenue;
      case "cash-flow-desc":
        return b.netCashFlow - a.netCashFlow;
      case "cash-flow-asc":
        return a.netCashFlow - b.netCashFlow;
      default:
        return 0;
    }
  });

  // Calculate total metrics (accrual-based)
  const totalRevenue = projects.reduce((sum, project) => sum + (project.revenue || 0), 0);
  const totalExpenses = projects.reduce((sum, project) => sum + (project.expenses || 0), 0);
  const totalProfit = projects.reduce((sum, project) => sum + (project.profit || 0), 0);
  const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Calculate total metrics (cash-based)
  const totalCashIn = projects.reduce((sum, project) => sum + (project.cashIn || 0), 0);
  const totalCashOut = projects.reduce((sum, project) => sum + (project.cashOut || 0), 0);
  const totalNetCashFlow = projects.reduce((sum, project) => sum + (project.netCashFlow || 0), 0);

  return (
    <>
      <Tabs defaultValue="accrual" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="accrual">Accrual Accounting</TabsTrigger>
          <TabsTrigger value="cash">Cash Accounting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accrual">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalRevenue)}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Total amount invoiced (earned)
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalExpenses)}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Total expenses incurred
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Total Profit</CardDescription>
                <CardTitle className={`text-2xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Revenue - Expenses
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Overall Profit Margin</CardDescription>
                <CardTitle className={`text-2xl ${overallProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallProfitMargin.toFixed(2)}%
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  (Profit / Revenue) × 100
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cash">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Total Cash In</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalCashIn)}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Payments collected from clients
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Total Cash Out</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalCashOut)}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Payments made for expenses
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Net Cash Flow</CardDescription>
                <CardTitle className={`text-2xl ${totalNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalNetCashFlow)}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Cash In - Cash Out
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>Cash Flow vs Profit</CardDescription>
                <CardTitle className={`text-2xl ${(totalNetCashFlow - totalProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalNetCashFlow - totalProfit)}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Difference between cash flow and profit
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
        <CardHeader>
          <CardTitle>Project Financial Performance</CardTitle>
          <CardDescription>
            {activeTab === "accrual" 
              ? "Revenue, expenses, and profit for all projects (accrual basis)" 
              : "Cash in, cash out, and net cash flow for all projects (cash basis)"}
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                {activeTab === "accrual" ? (
                  <>
                    <SelectItem value="profit-desc">Highest Profit</SelectItem>
                    <SelectItem value="profit-asc">Lowest Profit</SelectItem>
                    <SelectItem value="revenue-desc">Highest Revenue</SelectItem>
                    <SelectItem value="revenue-asc">Lowest Revenue</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="cash-flow-desc">Highest Cash Flow</SelectItem>
                    <SelectItem value="cash-flow-asc">Lowest Cash Flow</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project Manager</TableHead>
                  {activeTab === "accrual" ? (
                    <>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right">Cash In</TableHead>
                      <TableHead className="text-right">Cash Out</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === "accrual" ? 7 : 6} className="text-center py-6 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            project.status === "completed"
                              ? "secondary"
                              : project.status === "active"
                              ? "default"
                              : "outline"
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.pm?.full_name || "N/A"}</TableCell>
                      
                      {activeTab === "accrual" ? (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(project.revenue || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(project.expenses || 0)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              (project.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(project.profit || 0)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              (project.profitMargin || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {(project.profitMargin || 0).toFixed(2)}%
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(project.cashIn || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(project.cashOut || 0)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              (project.netCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(project.netCashFlow || 0)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
