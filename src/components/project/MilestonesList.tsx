import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Undo } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'in_progress' | 'completed';
}

interface MilestonesListProps {
  milestones: Milestone[];
  onMarkComplete: (id: string) => void;
  hideControls?: boolean;
}

export function MilestonesList({ milestones, onMarkComplete, hideControls = false }: MilestonesListProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role;
    }
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId)
        .select(`
          project_id, 
          amount, 
          name,
          project:project_id (
            contractor_id
          )
        `)
        .single();

      if (milestoneError) throw milestoneError;
      if (!milestone?.project?.contractor_id) throw new Error('No contractor found for project');

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          milestone_id: milestoneId,
          amount: milestone.amount,
          project_id: milestone.project_id,
          contractor_id: milestone.project.contractor_id,
          invoice_number: await generateInvoiceNumber(milestoneId),
          status: 'pending_payment'
        });

      if (invoiceError) throw invoiceError;

      return milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Milestone marked as complete and invoice created",
      });
    },
    onError: (error) => {
      console.error('Error completing milestone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete milestone. Please try again.",
      });
    },
  });

  const handleUndoCompletion = async (milestoneId: string) => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('status')
        .eq('milestone_id', milestoneId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      if (invoice?.status === 'paid') {
        toast({
          variant: "destructive",
          title: "Cannot Undo Completion",
          description: "This milestone cannot be reverted because its invoice has already been paid.",
        });
        return;
      }

      const { data, error } = await supabase.rpc('undo_milestone_completion', {
        milestone_id_param: milestoneId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Milestone has been reverted to pending status",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to undo milestone completion. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error undoing milestone completion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo milestone completion. Please try again.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isHomeowner = userRole === 'homeowner';
  const isGeneralContractor = userRole === 'gc_admin';
  const isContractor = userRole === 'gc_admin';

  const handleMarkComplete = async (milestoneId: string) => {
    await completeMilestoneMutation.mutateAsync(milestoneId);
    if (onMarkComplete) {
      onMarkComplete(milestoneId);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Milestones</h2>
      <div className="space-y-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                    {milestone.description && (
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    )}
                    {milestone.amount && (
                      <p className="text-sm font-medium text-gray-900">
                        ${milestone.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                    {!hideControls && !isHomeowner && (
                      <div className="flex gap-2">
                        {milestone.status !== 'completed' && (
                          <Button
                            onClick={() => handleMarkComplete(milestone.id)}
                            variant="outline"
                          >
                            Mark as Complete
                          </Button>
                        )}
                        {isContractor && milestone.status === 'completed' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={() => setSelectedMilestoneId(milestone.id)}
                              >
                                <Undo className="h-4 w-4 mr-2" />
                                Undo Completion
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Undo Milestone Completion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to undo the completion of this milestone? 
                                  This will delete any associated invoice and revert the milestone 
                                  status to pending.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (selectedMilestoneId) {
                                      handleUndoCompletion(selectedMilestoneId);
                                    }
                                  }}
                                >
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              No milestones found for this project.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

async function generateInvoiceNumber(milestoneId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_invoice_number', {
    milestone_id: milestoneId
  });
  
  if (error) {
    console.error('Error generating invoice number:', error);
    throw error;
  }
  
  return data;
}
