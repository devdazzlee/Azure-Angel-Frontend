import React from 'react';
import { AlertTriangle, Info, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ValidationWarning } from '@/utils/budgetValidation';

interface BudgetWarningPanelProps {
  warnings: ValidationWarning[];
  suggestions: ValidationWarning[];
  completenessScore?: number;
  onDismissWarning?: (warningId: string) => void;
  onApplySuggestion?: (suggestion: ValidationWarning) => void;
  className?: string;
}

const BudgetWarningPanel: React.FC<BudgetWarningPanelProps> = ({
  warnings,
  suggestions,
  completenessScore = 0,
  onDismissWarning,
  onApplySuggestion,
  className = ''
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const highWarnings = warnings.filter(w => w.severity === 'high');
  const mediumWarnings = warnings.filter(w => w.severity === 'medium');
  const lowWarnings = warnings.filter(w => w.severity === 'low');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Errors */}
      {criticalWarnings.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              Critical Issues
              <Badge variant="destructive" className="ml-2">
                {criticalWarnings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalWarnings.map((warning) => (
              <div key={warning.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(warning.type)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800">{warning.field}</div>
                  <div className="text-red-700 text-sm">{warning.message}</div>
                  {warning.suggestion && (
                    <div className="mt-2 text-red-600 text-sm">
                      <strong>Suggestion:</strong> {warning.suggestion}
                      {warning.autoFix && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 ml-2"
                          onClick={warning.autoFix}
                        >
                          Apply Fix
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {onDismissWarning && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => onDismissWarning(warning.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* High Priority Warnings */}
      {highWarnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              High Priority Warnings
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                {highWarnings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highWarnings.map((warning) => (
              <div key={warning.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(warning.type)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-orange-800">{warning.field}</div>
                  <div className="text-orange-700 text-sm">{warning.message}</div>
                  {warning.suggestion && (
                    <div className="mt-2 text-orange-600 text-sm">
                      <strong>Suggestion:</strong> {warning.suggestion}
                      {warning.autoFix && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 ml-2"
                          onClick={warning.autoFix}
                        >
                          Apply Fix
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {onDismissWarning && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-orange-600 hover:text-orange-800"
                    onClick={() => onDismissWarning(warning.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Medium Priority Warnings */}
      {mediumWarnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Suggestions
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                {mediumWarnings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mediumWarnings.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                <div className="flex-shrink-0 mt-1">
                  <Info className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-yellow-800">{suggestion.field}</div>
                  <div className="text-yellow-700 text-sm">{suggestion.message}</div>
                  {suggestion.autoFix && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 ml-2"
                      onClick={suggestion.autoFix}
                    >
                      Apply Fix
                    </Button>
                  )}
                </div>
                {onApplySuggestion && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-yellow-600 hover:text-yellow-800"
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Low Priority Info */}
      {lowWarnings.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              Additional Recommendations
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {lowWarnings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowWarnings.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-800">{suggestion.field}</div>
                  <div className="text-blue-700 text-sm">{suggestion.message}</div>
                  {suggestion.autoFix && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 ml-2"
                      onClick={suggestion.autoFix}
                    >
                      Apply Fix
                    </Button>
                  )}
                </div>
                {onApplySuggestion && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget Completeness Score */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <CheckCircle className="w-5 h-5" />
            Budget Completeness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Overall Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800">{completenessScore}%</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {completenessScore < 25 && "Just getting started - Add more budget items to improve your score"}
              {completenessScore >= 25 && completenessScore < 50 && "Good foundation - Continue adding items and details"}
              {completenessScore >= 50 && completenessScore < 75 && "Well underway - Your budget is taking shape"}
              {completenessScore >= 75 && completenessScore < 90 && "Almost complete - Just a few more items needed"}
              {completenessScore >= 90 && "Excellent - Your budget is comprehensive and ready"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetWarningPanel;
