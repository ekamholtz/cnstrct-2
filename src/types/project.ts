
export interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  created_at: string;
  client_id?: string; // Adding client_id as optional since it can be null in the database
}
