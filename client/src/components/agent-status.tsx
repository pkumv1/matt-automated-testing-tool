import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Code, Shield, FlaskConical, Cog } from "lucide-react";
import type { Agent } from "@shared/schema";

interface AgentStatusProps {
  agents: Agent[];
}

export default function AgentStatus({ agents }: AgentStatusProps) {
  const getAgentIcon = (type: string) => {
    switch (type) {
      case "supervisor":
        return Crown;
      case "analyzer":
        return Code;
      case "risk":
        return Shield;
      case "test":
        return FlaskConical;
      case "environment":
        return Cog;
      default:
        return Code;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-carbon-gray-10 text-carbon-gray-100";
      case "busy":
        return "bg-ibm-blue text-white";
      case "error":
        return "bg-red-60 text-white";
      default:
        return "bg-carbon-gray-10 text-carbon-gray-100";
    }
  };

  const getIconColor = (type: string, status: string) => {
    if (type === "supervisor") {
      return "text-green-50";
    }
    if (status === "busy") {
      return "text-ibm-blue";
    }
    return "text-ibm-blue";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-carbon-gray-100 mb-4">
          Multi-Agent System
        </h3>

        <div className="space-y-4">
          {agents.map((agent) => {
            const Icon = getAgentIcon(agent.type);
            const isActive = agent.type === "supervisor" || agent.status === "busy";
            
            return (
              <div
                key={agent.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isActive 
                    ? "bg-green-50 border-green-50" 
                    : "bg-carbon-gray-10 border-carbon-gray-20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-green-50" : "bg-ibm-blue"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-carbon-gray-100">
                      {agent.name}
                    </p>
                    <p className="text-xs text-carbon-gray-60 capitalize">
                      {agent.status}
                    </p>
                  </div>
                </div>
                <Icon 
                  className={getIconColor(agent.type, agent.status || 'unknown')} 
                  size={16} 
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-carbon-gray-20">
          <p className="text-xs text-carbon-gray-60">Powered by Claude API</p>
        </div>
      </CardContent>
    </Card>
  );
}
