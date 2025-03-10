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
import { formatCurrency } from "@/utils/format";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectTypeReportProps {
  projectsByType: any[];
}

// Color palette for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF6B6B"];

export const ProjectTypeReport: React.FC<ProjectTypeReportProps> = ({ projectsByType }) => {
  const [activeTab, setActiveTab] = useState("accrual");
  
  // Sort project types by total profit (highest first) for accrual view
  const sortedTypesByProfit = [...projectsByType].sort((a, b) => b.totalProfit - a.totalProfit);
  
  // Sort project types by net cash flow (highest first) for cash view
  const sortedTypesByCashFlow = [...projectsByType].sort((a, b) => 
    (b.totalNetCashFlow || 0) - (a.totalNetCashFlow || 0)
  );

  // Prepare data for pie chart (revenue distribution) - accrual
  const revenuePieChartData = sortedTypesByProfit.map((type, index) => ({
    name: type.type,
    value: type.totalRevenue,
    color: COLORS[index % COLORS.length],
  }));
  
  // Prepare data for pie chart (cash in distribution) - cash
  const cashInPieChartData = sortedTypesByCashFlow.map((type, index) => ({
    name: type.type,
    value: type.totalCashIn || 0,
    color: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart (profit margin comparison) - accrual
  const profitBarChartData = sortedTypesByProfit.map((type, index) => ({
    name: type.type,
    ProfitMargin: type.avgProfitMargin,
    Revenue: type.totalRevenue,
    Expenses: type.totalExpenses,
    Profit: type.totalProfit,
    color: COLORS[index % COLORS.length],
  }));
  
  // Prepare data for bar chart (cash flow comparison) - cash
  const cashFlowBarChartData = sortedTypesByCashFlow.map((type, index) => ({
    name: type.type,
    "Cash In": type.totalCashIn || 0,
    "Cash Out": type.totalCashOut || 0,
    "Net Cash Flow": type.totalNetCashFlow || 0,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <>
      <Tabs defaultValue="accrual" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="accrual">Accrual Accounting</TabsTrigger>
          <TabsTrigger value="cash">Cash Accounting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accrual">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Revenue Distribution by Project Type</CardTitle>
                <CardDescription>
                  Percentage of total revenue by project type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenuePieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenuePieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Profit Margin by Project Type</CardTitle>
                <CardDescription>
                  Compare profit margins across different project types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={profitBarChartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value}%`, "Profit Margin"]}
                      />
                      <Legend />
                      <Bar dataKey="ProfitMargin" name="Profit Margin">
                        {profitBarChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Project Type Performance Details (Accrual Basis)</CardTitle>
              <CardDescription>
                Detailed financial metrics for each project type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Type</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Avg. Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTypesByProfit.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTypesByProfit.map((type) => (
                        <TableRow key={type.type}>
                          <TableCell className="font-medium capitalize">{type.type}</TableCell>
                          <TableCell className="text-right">{type.projects.length}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(type.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(type.totalExpenses)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              type.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(type.totalProfit)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              type.avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {typeof type.avgProfitMargin === 'number' ? type.avgProfitMargin.toFixed(2) : type.avgProfitMargin}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cash">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Cash In Distribution by Project Type</CardTitle>
                <CardDescription>
                  Percentage of total cash in by project type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cashInPieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {cashInPieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Cash Flow by Project Type</CardTitle>
                <CardDescription>
                  Compare cash in, cash out, and net cash flow across project types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cashFlowBarChartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="Cash In" fill="#8884d8" />
                      <Bar dataKey="Cash Out" fill="#ffc658" />
                      <Bar dataKey="Net Cash Flow" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Project Type Cash Flow Details</CardTitle>
              <CardDescription>
                Detailed cash flow metrics for each project type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Type</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Cash In</TableHead>
                      <TableHead className="text-right">Cash Out</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTypesByCashFlow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTypesByCashFlow.map((type) => (
                        <TableRow key={type.type}>
                          <TableCell className="font-medium capitalize">{type.type}</TableCell>
                          <TableCell className="text-right">{type.projects.length}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(type.totalCashIn || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(type.totalCashOut || 0)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              (type.totalNetCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(type.totalNetCashFlow || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};
