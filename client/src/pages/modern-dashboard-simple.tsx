import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Activity, FileText } from "lucide-react";

export default function ModernDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MATT Platform</h1>
          <p className="text-xl text-gray-600">Mars Automated Testing Tool</p>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Intelligent code analysis with multi-agent AI system
                </p>
                <Button className="w-full mt-4">Start Analysis</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Test Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Automated test case generation for comprehensive coverage
                </p>
                <Button className="w-full mt-4">Generate Tests</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Agent Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Monitor AI agents and system performance
                </p>
                <Button className="w-full mt-4">View Status</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}