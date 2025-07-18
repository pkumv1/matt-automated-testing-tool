import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Play, 
  Clock, 
  Shield, 
  FileText,
  Users,
  AlertCircle
} from "lucide-react";
import type { TestCase } from "@shared/schema";

interface HumanReviewGateProps {
  testCases: TestCase[];
  selectedFramework: string;
  isReviewMode: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  executionType: 'single' | 'suite';
  selectedTestCase?: TestCase;
}

export function HumanReviewGate({
  testCases,
  selectedFramework,
  isReviewMode,
  onApprove,
  onReject,
  onClose,
  executionType,
  selectedTestCase
}: HumanReviewGateProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  if (!isReviewMode) return null;

  const testsToReview = executionType === 'single' && selectedTestCase 
    ? [selectedTestCase] 
    : testCases;

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'unit': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'integration': return 'bg-green-50 text-green-700 border-green-200';
      case 'e2e': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'security': return 'bg-red-50 text-red-700 border-red-200';
      case 'performance': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'accessibility': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskLevel = () => {
    const hasSecurityTests = testsToReview.some(tc => tc.type === 'security');
    const hasE2eTests = testsToReview.some(tc => tc.type === 'e2e');
    const hasHighPriorityTests = testsToReview.some(tc => tc.priority === 'high');
    
    if (hasSecurityTests || hasE2eTests) return 'high';
    if (hasHighPriorityTests) return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel();

  const handleApprove = () => {
    setReviewStatus('approved');
    onApprove();
  };

  const handleReject = () => {
    setReviewStatus('rejected');
    onReject();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-4 shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Human Review Required
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve test execution before proceeding
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Risk Assessment */}
          <Alert className={`mb-6 ${
            riskLevel === 'high' ? 'border-red-200 bg-red-50' :
            riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-green-200 bg-green-50'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              riskLevel === 'high' ? 'text-red-600' :
              riskLevel === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`} />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    Risk Level: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  </span>
                  <p className="text-sm mt-1">
                    {riskLevel === 'high' && 'High-risk tests detected. Includes security or end-to-end tests that may affect system state.'}
                    {riskLevel === 'medium' && 'Medium-risk tests detected. Includes integration tests that may affect multiple components.'}
                    {riskLevel === 'low' && 'Low-risk tests detected. Primarily unit tests with minimal system impact.'}
                  </p>
                </div>
                <Badge variant="outline" className={getPriorityColor(riskLevel)}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          {/* Execution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-2 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Execution Type</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {executionType === 'single' ? 'Single Test' : 'Test Suite'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Test Count</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {testsToReview.length} test{testsToReview.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Framework</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedFramework}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Cases Review */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Tests to Execute
            </h3>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-4 space-y-3">
                {testsToReview.map((testCase) => (
                  <div 
                    key={testCase.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{testCase.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={getTestTypeColor(testCase.type)}
                          >
                            {testCase.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(testCase.priority)}
                          >
                            {testCase.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {testCase.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Status: {testCase.status || 'pending'}</span>
                          <span>Framework: {testCase.framework}</span>
                          {testCase.estimatedDuration && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              ~{testCase.estimatedDuration}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Review Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes about this test execution..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Safety Checklist */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Safety Checklist:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Tests have been reviewed for potential system impact</li>
                  <li>• Test environment is appropriate for the selected tests</li>
                  <li>• Backup and rollback procedures are in place if needed</li>
                  <li>• All stakeholders are aware of the test execution</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleReject}
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                disabled={reviewStatus !== 'pending'}
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </Button>
              
              <Button 
                onClick={handleApprove}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                disabled={reviewStatus !== 'pending'}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve & Execute</span>
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {reviewStatus !== 'pending' && (
            <div className={`mt-4 p-3 rounded-lg ${
              reviewStatus === 'approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {reviewStatus === 'approved' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {reviewStatus === 'approved' ? 'Approved - Executing tests...' : 'Rejected - Test execution cancelled'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}