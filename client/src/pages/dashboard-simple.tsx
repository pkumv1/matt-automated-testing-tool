import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">MATT Platform</h1>
                  <p className="text-sm text-gray-600">Mars Automated Testing Tool</p>
                </div>
              </div>
            </div>
            <Button>
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your testing projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">AI testing agents status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View testing reports</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}