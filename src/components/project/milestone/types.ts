
export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'in_progress' | 'completed';
}
