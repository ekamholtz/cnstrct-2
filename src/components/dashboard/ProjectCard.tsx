import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronRight, Calendar, Clock, Phone, Mail, DollarSign, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ExpandableCard } from "@/components/ui/expandable-card";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    address: string;
    status: string;
    created_at?: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  
  // Fetch milestones for the project
  const { data: milestones } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', project.id);
      
      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }
      return data;
    }
  });

  // Fetch project details including PM, client, and contract value
  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', project.id],
    queryFn: async () => {
      // First fetch the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();
      
      if (projectError) {
        console.error('Error fetching project details:', projectError);
        throw projectError;
      }

      // Fetch PM details if available
      let pmData = null;
      if (projectData.pm_user_id) {
        const { data: pmProfile, error: pmError } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', projectData.pm_user_id)
          .single();
        
        if (!pmError) {
          pmData = pmProfile;
        }
      }

      // Fetch client details if available
      let clientData = null;
      if (projectData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('name, email, phone_number')
          .eq('id', projectData.client_id)
          .single();
        
        if (!clientError) {
          clientData = client;
        }
      }

      // Fetch milestones to calculate contract value
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('amount')
        .eq('project_id', projectData.id);
      
      let contractValue = 0;
      if (!milestonesError && milestonesData) {
        contractValue = milestonesData.reduce((sum, milestone) => 
          sum + (milestone.amount || 0), 0);
      }

      return {
        ...projectData,
        project_manager: pmData,
        client: clientData,
        contract_value: contractValue
      };
    }
  });

  const calculateCompletion = () => {
    if (!milestones || milestones.length === 0) {
      return 0;
    }

    const totalAmount = milestones.reduce((sum, milestone) => 
      sum + (milestone.amount || 0), 0);
    
    const completedAmount = milestones
      .filter(milestone => milestone.status === 'completed')
      .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

    return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const completionPercentage = calculateCompletion();
  
  // Format the creation date if available
  const formattedDate = project.created_at 
    ? format(new Date(project.created_at), 'MMM d, yyyy')
    : 'No date';

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Card content
  const cardContent = (
    <>
      <div className="h-1 bg-gradient-to-r from-cnstrct-navy to-cnstrct-orange"></div>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-cnstrct-navy line-clamp-1">{project.name}</h3>
          <Badge className={`${getStatusColor(project.status)} border`}>
            {formatStatus(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <p className="text-sm line-clamp-1">{project.address}</p>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <p className="text-sm">{formattedDate}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Progress</span>
              <span className="text-xs font-semibold">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-1.5 bg-cnstrct-grayDark/30" 
              indicatorClassName={
                completionPercentage < 30 
                  ? "bg-blue-500" 
                  : completionPercentage < 70 
                    ? "bg-amber-500" 
                    : "bg-green-500"
              }
            />
          </div>
        </div>
      </CardContent>
    </>
  );

  // Expanded content with PM, client details and contract value
  const expandedContent = (
    <div className="space-y-4 pt-2">
      {projectDetails?.project_manager && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Project Manager
          </h4>
          <div className="pl-5 space-y-1">
            <p className="text-sm">{projectDetails.project_manager.full_name}</p>
            {projectDetails.project_manager.phone_number && (
              <p className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span 
                  className="hover:underline cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${projectDetails.project_manager.phone_number}`;
                  }}
                >
                  {projectDetails.project_manager.phone_number}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {projectDetails?.client && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Client
          </h4>
          <div className="pl-5 space-y-1">
            <p className="text-sm">{projectDetails.client.name}</p>
            {projectDetails.client.email && (
              <p className="text-xs flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span 
                  className="hover:underline cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${projectDetails.client.email}`;
                  }}
                >
                  {projectDetails.client.email}
                </span>
              </p>
            )}
            {projectDetails.client.phone_number && (
              <p className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span 
                  className="hover:underline cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${projectDetails.client.phone_number}`;
                  }}
                >
                  {projectDetails.client.phone_number}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5" /> Contract Value
        </h4>
        <p className="pl-5 text-sm font-medium">
          {formatCurrency(projectDetails?.contract_value || 0)}
        </p>
      </div>

      <div className="flex justify-end items-center pt-1">
        <span className="text-xs font-medium text-cnstrct-navy flex items-center">
          View Details
          <ChevronRight className="h-3 w-3 ml-1" />
        </span>
      </div>
    </div>
  );

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <ExpandableCard
      className="h-full hover:shadow-card-hover transition-all duration-200 cursor-pointer"
      expandedContent={expandedContent}
      onClick={handleCardClick}
    >
      {cardContent}
    </ExpandableCard>
  );
}