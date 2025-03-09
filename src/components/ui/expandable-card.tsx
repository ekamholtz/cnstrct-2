
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useExpandable } from "@/components/hooks/use-expandable";
import { Project } from "@/types/project";
import { Link } from "react-router-dom";

interface ExpandableProjectCardProps {
  project: Project;
  completionPercentage: number;
  projectManager?: { id: string; full_name: string } | null;
  client?: { id: string; name: string; email: string; phone_number?: string } | null;
  contractValue?: number;
}

export function ExpandableProjectCard({
  project,
  completionPercentage,
  projectManager,
  client,
  contractValue,
}: ExpandableProjectCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className="w-full cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={toggleExpand}
    >
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start w-full">
          <div className="space-y-2">
            <Badge
              className={getStatusColor(project.status)}
            >
              {project.status}
            </Badge>
            <h3 className="text-lg font-semibold">{project.name}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <p className="truncate">{project.address}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <motion.div
            style={{ height: animatedHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={contentRef}>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 pt-4 border-t border-gray-100 mt-4"
                  >
                    {/* Project Manager */}
                    {projectManager && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Project Manager
                        </h4>
                        <p className="text-sm text-gray-600 pl-6">{projectManager.full_name}</p>
                      </div>
                    )}

                    {/* Client Information */}
                    {client && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Client Information</h4>
                        <div className="grid grid-cols-1 gap-1 pl-6">
                          <p className="text-sm text-gray-600">Name: {client.name}</p>
                          <p className="text-sm text-gray-600">Email: {client.email}</p>
                          {client.phone_number && (
                            <p className="text-sm text-gray-600">Phone: {client.phone_number}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contract Value */}
                    {contractValue !== undefined && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Contract Value
                        </h4>
                        <p className="text-sm text-gray-600 pl-6">
                          ${contractValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full text-sm text-gray-600">
          <span>Last updated: {new Date(project.updated_at).toLocaleDateString()}</span>
          <Link 
            to={`/project/${project.id}`} 
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()} // Prevent card expansion when clicking the link
          >
            View Details
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
