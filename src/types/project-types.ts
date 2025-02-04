export interface Milestone {
  id: string;
  name: string;
  amount: number;
  status: string;
}

export interface ClientProject {
  id: string;
  name: string;
  address: string;
  status: string;
  milestones: Milestone[];
}