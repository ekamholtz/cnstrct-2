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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesmanReportProps {
  projectsByPM: any[];
}

export const SalesmanReport: React.FC<SalesmanReportProps> = ({ projectsByPM }) => {
  const [activeTab, setActiveTab] = useState("accrual");
  
  // Sort PMs by total profit (highest first) for accrual view
  const sortedPMsByProfit = [...projectsByPM].sort((a, b) => b.totalProfit - a.totalProfit);
  
  // Sort PMs by net cash flow (highest first) for cash view
  const sortedPMsByCashFlow = [...projectsByPM].sort((a, b) => 
    (b.totalNetCashFlow || 0) - (a.totalNetCashFlow || 0)
  );

  // Prepare data for accrual chart
  const accrualChartData = sortedPMsByProfit.map((pm) => ({
    name: pm.pmName,
    Revenue: pm.totalRevenue,
    Expenses: pm.totalExpenses,
    Profit: pm.totalProfit,
    ProfitMargin: pm.avgProfitMargin,
  }));
  
  // Prepare data for cash chart
  const cashChartData = sortedPMsByCashFlow.map((pm) => ({
    name: pm.pmName,
    "Cash In": pm.totalCashIn || 0,
    "Cash Out": pm.totalCashOut || 0,
    "Net Cash Flow": pm.totalNetCashFlow || 0,
  }));

  return (
    <>
      <Tabs defaultValue="accrual" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="accrual">Accrual Accounting</TabsTrigger>
          <TabsTrigger value="cash">Cash Accounting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accrual">
          <Card className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Performance by Project Manager (Accrual Basis)</CardTitle>
              <CardDescription>
                Compare revenue, expenses, and profit across project managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={accrualChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip formatter={(value, name) => {
                      if (name === "ProfitMargin") {
                        return [`${typeof value === 'number' ? value.toFixed(2) : value}%`, "Profit Margin"];
                      }
                      return [formatCurrency(value as number), name];
                    }} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="Revenue"
                      fill="#8884d8"
                      name="Revenue"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="Expenses"
                      fill="#ffc658"
                      name="Expenses"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="Profit"
                      fill="#82ca9d"
                      name="Profit"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="ProfitMargin"
                      fill="#ff8042"
                      name="Profit Margin"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Project Manager Performance Details (Accrual Basis)</CardTitle>
              <CardDescription>
                Detailed financial metrics for each project manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Manager</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Avg. Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPMsByProfit.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPMsByProfit.map((pm) => (
                        <TableRow key={pm.pmId}>
                          <TableCell className="font-medium">{pm.pmName}</TableCell>
                          <TableCell className="text-right">{pm.projects.length}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pm.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pm.totalExpenses)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              pm.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(pm.totalProfit)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              pm.avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {typeof pm.avgProfitMargin === 'number' ? pm.avgProfitMargin.toFixed(2) : pm.avgProfitMargin}%
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
          <Card className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Cash Flow Performance by Project Manager</CardTitle>
              <CardDescription>
                Compare cash in, cash out, and net cash flow across project managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cashChartData}
                    margin={{
                      top: 20,
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
                    <Bar
                      dataKey="Cash In"
                      fill="#8884d8"
                    />
                    <Bar
                      dataKey="Cash Out"
                      fill="#ffc658"
                    />
                    <Bar
                      dataKey="Net Cash Flow"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Project Manager Cash Flow Details</CardTitle>
              <CardDescription>
                Detailed cash flow metrics for each project manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Manager</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Cash In</TableHead>
                      <TableHead className="text-right">Cash Out</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPMsByCashFlow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPMsByCashFlow.map((pm) => (
                        <TableRow key={pm.pmId}>
                          <TableCell className="font-medium">{pm.pmName}</TableCell>
                          <TableCell className="text-right">{pm.projects.length}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pm.totalCashIn || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(pm.totalCashOut || 0)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              (pm.totalNetCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(pm.totalNetCashFlow || 0)}
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
