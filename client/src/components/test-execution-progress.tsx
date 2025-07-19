import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  Loader2, 
  Play, 
  Pause,
  Timer,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import type { TestCase } from "@shared/schema";

interface TestExecutionProgressProps {
  testCases: TestCase[];
  isRunning: boolean;
  estimatedTimeRemaining?: number;
  startTime?: Date;
}

export default function TestExecutionProgress({ 
  testCases, 
  isRunning,
  estimatedTimeRemaining,
  startTime 
}: TestExecutionProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>("");

  // Update elapsed time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  // Determine current execution phase
  useEffect(() => {
    const runningTests = testCases.filter(tc => tc.status === 'running');
    const completedTests = testCases.filter(tc => tc.status === 'passed' || tc.status === 'failed');
    
    if (runningTests.length > 0) {
      const currentTest = runningTests[0];
      setCurrentPhase(`Executing: ${currentTest.name} (${currentTest.type})`);
    } else if (completedTests.length > 0 && completedTests.length < testCases.length) {
      setCurrentPhase("Preparing next test...");
    } else if (completedTests.length === testCases.length && testCases.length > 0) {
      setCurrentPhase("✅ All tests completed!");
    } else {
      setCurrentPhase("Initializing test execution...");
    }
  }, [testCases]);

  const getTestStats = () => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'passed').length;
    const failed = testCases.filter(tc => tc.status === 'failed').length;
    const running = testCases.filter(tc => tc.status === 'running').length;
    const pending = testCases.filter(tc => 
      tc.status === 'generated' || tc.status === 'pending' || !tc.status
    ).length;
    
    const completed = passed + failed;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, passed, failed, running, pending, completed, progressPercentage };
  };

  const getEstimatedTimeText = () => {
    if (!estimatedTimeRemaining) return null;
    
    const minutes = Math.floor(estimatedTimeRemaining / 60);
    const seconds = estimatedTimeRemaining % 60;
    
    if (minutes > 0) {
      return `~${minutes}m ${seconds}s remaining`;
    } else {
      return `~${seconds}s remaining`;
    }
  };

  const getElapsedTimeText = () => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s elapsed`;
    } else {
      return `${seconds}s elapsed`;
    }
  };

  const getSuccessRate = () => {
    const stats = getTestStats();
    if (stats.completed === 0) return 0;
    return Math.round((stats.passed / stats.completed) * 100);
  };

  const stats = getTestStats();
  const successRate = getSuccessRate();

  if (testCases.length === 0) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No tests to execute</p>
            <p className="text-sm">Generate tests first to see execution progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-300 ${
      isRunning ? 'border-blue-300 shadow-lg' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isRunning ? (
              <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
            ) : stats.completed === stats.total && stats.total > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Timer className="h-5 w-5 text-gray-400" />
            )}
            Test Execution Progress
          </CardTitle>
          
          <Badge 
            variant={isRunning ? "default" : stats.completed === stats.total ? "default" : "secondary"}
            className={`${
              isRunning ? 'bg-blue-100 text-blue-800 animate-pulse' : 
              stats.completed === stats.total ? 'bg-green-100 text-green-800' : ''
            }`}
          >
            {isRunning ? "Running" : stats.completed === stats.total ? "Completed" : "Ready"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{stats.completed}/{stats.total} tests</span>
          </div>
          <Progress 
            value={stats.progressPercentage} 
            className="h-3 transition-all duration-500"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{stats.progressPercentage}% complete</span>
            {successRate > 0 && (
              <span className={`flex items-center gap-1 ${
                successRate >= 80 ? 'text-green-600' : 
                successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {successRate}% success rate
              </span>
            )}
          </div>
        </div>

        {/* Current Phase */}
        {(isRunning || currentPhase) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium text-blue-900">
                {currentPhase}
              </span>
            </div>
          </div>
        )}

        {/* Time Information */}
        {(isRunning || elapsedTime > 0) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{getElapsedTimeText()}</span>
            </div>
            {estimatedTimeRemaining && isRunning && (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700 font-medium">
                  {getEstimatedTimeText()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Test Status Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-lg font-bold text-green-600">{stats.passed}</div>
            <div className="text-xs text-gray-600">Passed</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-lg font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Activity className={`h-4 w-4 text-blue-500 ${isRunning ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-lg font-bold text-blue-600">{stats.running}</div>
            <div className="text-xs text-gray-600">Running</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-lg font-bold text-gray-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>

        {/* Estimated completion time */}
        {estimatedTimeRemaining && stats.completed > 0 && isRunning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <span className="font-medium text-yellow-900">
                  Estimated completion: 
                </span>
                <span className="text-yellow-700 ml-1">
                  {new Date(Date.now() + estimatedTimeRemaining * 1000).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}