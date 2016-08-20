// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the multiple-choice correct hints fields in
 *               the simple editor view.
 */

oppia.directive('multipleChoiceHints', [function() {
  return {
    restrict: 'E',
    templateUrl: 'interaction/multipleChoiceHints',
    scope: {
      initCustomizationArgs: '&',
      initAnswerGroups: '&',
      initDefaultOutcome: '&',
      identifier: '@',
      onEdit: '='
    },
    controller: [
      '$scope', 'focusService', function($scope, focusService) {
        $scope.focusLabel = focusService.generateFocusLabel();

        $scope.save = function(newFeedback) {
          $scope.defaultOutcome.feedback[0] = newFeedback;
          $scope.onEdit($scope.answerGroups);
          init();
        };

        $scope.getDefaultFeedback = function() {
          return $scope.defaultOutcome.feedback[0];
        };

        var init = function() {
          $scope.customizationArgs = $scope.initCustomizationArgs();
          $scope.answerGroups = $scope.initAnswerGroups();
          $scope.defaultOutcome = $scope.initDefaultOutcome();

          if ($scope.defaultOutcome.feedback.length === 0) {
            $scope.defaultOutcome.feedback.push('');
          }
        };

        init();
        $scope.$on('externalOpen', function() {
          init();
        });
      }
    ]
  };
}]);
