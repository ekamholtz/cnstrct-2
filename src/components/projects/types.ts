import { z } from "zod";

export const milestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().min(1, "Milestone description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
});

export const projectSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().optional(),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  totalContractValue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Total contract value must be a positive number",
  }),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
}).refine((data) => {
  const totalMilestones = data.milestones.reduce((sum, milestone) => 
    sum + Number(milestone.amount), 0
  );
  return Math.abs(Number(data.totalContractValue) - totalMilestones) < 0.01;
}, {
  message: "Total contract value must equal the sum of milestone amounts",
  path: ["totalContractValue"],
});

export type ProjectFormValues = z.infer<typeof projectSchema>;