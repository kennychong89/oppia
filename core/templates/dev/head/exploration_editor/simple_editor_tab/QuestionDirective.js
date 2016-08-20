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
 * @fileoverview Directive for a question in the simple editor.
 */

oppia.directive('question', [function() {
  return {
    restrict: 'E',
    templateUrl: 'editor/question',
    scope: {
      initDisplayedValue: '&',
      identifier: '@',
      onFinishEditing: '=',
      getStateName: '&stateName',
      sidebarConfig: '='
    },
    controller: [
      '$scope', 'focusService', 'INTERACTION_DETAILS', 'INTERACTION_SPECS',
      'explorationStatesService',
      function(
          $scope, focusService, INTERACTION_DETAILS, INTERACTION_SPECS,
          explorationStatesService) {
        $scope.INTERACTION_DETAILS = INTERACTION_DETAILS;

        var getNewCustomizationArgs = function(interactionId) {
          var customizationArgSpecs = INTERACTION_SPECS[
            interactionId].customization_arg_specs;

          var newCustomizationArgs = {};
          customizationArgSpecs.forEach(function(caSpec) {
            newCustomizationArgs[caSpec.name] = {
              value: angular.copy(caSpec.default_value)
            };
          });

          return newCustomizationArgs;
        };

        $scope.interaction = explorationStatesService.getState(
          $scope.getStateName()).interaction;
        if (!$scope.interaction.id) {
          var newInteractionId = $scope.INTERACTION_DETAILS[0].id;
          var newCustomizationArgs = getNewCustomizationArgs(newInteractionId);

          explorationStatesService.saveInteractionId(
            $scope.getStateName(), newInteractionId);
          explorationStatesService.saveInteractionCustomizationArgs(
            $scope.getStateName(), newCustomizationArgs);

          // TODO(sll): adjust things so that updating the interaction id does
          // not change the underlying reference.
          $scope.interaction = explorationStatesService.getState(
            $scope.getStateName()).interaction;
        }

        $scope.fields = [{
          id: 'prompt',
          directiveName: 'multiple-choice-prompt',
          initCustomizationArgs: function() {
            return $scope.initDisplayedValue().interaction.customization_args;
          },
          save: function(newCustomizationArgs) {
            explorationStatesService.saveInteractionCustomizationArgs(
              $scope.getStateName(), newCustomizationArgs);
            // Refresh descendants.
            $scope.$broadcast('externalOpen');
            $scope.sidebarConfig.numElementsToShow = Math.max(
              $scope.sidebarConfig.numElementsToShow, 2);
          }
        }, {
          id: 'correct-answer',
          directiveName: 'multiple-choice-correct-answer',
          initCustomizationArgs: function() {
            return $scope.initDisplayedValue().interaction.customization_args;
          },
          initAnswerGroups: function() {
            return $scope.initDisplayedValue().interaction.answer_groups;
          },
          save: function(newAnswerGroups) {
            explorationStatesService.saveInteractionAnswerGroups(
              $scope.getStateName(), newAnswerGroups);
            $scope.sidebarConfig.numElementsToShow = Math.max(
              $scope.sidebarConfig.numElementsToShow, 3);
          }
        }, {
          id: 'hints',
          directiveName: 'multiple-choice-hints',
          initCustomizationArgs: function() {
            return $scope.initDisplayedValue().interaction.customization_args;
          },
          initAnswerGroups: function() {
            return $scope.initDisplayedValue().interaction.answer_groups;
          },
          initDefaultOutcome: function() {
            return $scope.initDisplayedValue().interaction.default_outcome;
          },
          save: function(newAnswerGroups) {
            explorationStatesService.saveInteractionAnswerGroups(
              $scope.getStateName(), newAnswerGroups);
            $scope.sidebarConfig.numElementsToShow = Math.max(
              $scope.sidebarConfig.numElementsToShow, 4);
          }
        }, {
          id: 'html-field',
          directiveName: 'html-field',
          initContent: function() {
            var interaction = $scope.initDisplayedValue().interaction;
            return explorationStatesService.getStateContentMemento(
              interaction.answer_groups[0].outcome.dest)[0].value;
          },
          save: function(newContent) {
            var interaction = $scope.initDisplayedValue().interaction;
            explorationStatesService.saveStateContent(
              interaction.answer_groups[0].outcome.dest, [{
                type: 'text',
                value: newContent
              }]
            );
          }
        }];

        $scope.saveNewInteractionId = function() {
          // TODO(sll): Show a warning if this change will result in response
          // data being lost.
          var newCustomizationArgs = getNewCustomizationArgs(newInteractionId);
          explorationStatesService.saveInteractionId(
            $scope.getStateName(), newInteractionId);
          explorationStatesService.saveInteractionCustomizationArgs(
            $scope.getStateName(), newCustomizationArgs);
        };

        // TODO(sll): This should reflect what's currently completed in this
        // question.
        $scope.sidebarConfig.numElementsToShow = Math.max(
          $scope.sidebarConfig.numElementsToShow, 1);

        $scope.inEditMode = false;
        $scope.focusLabel = focusService.generateFocusLabel();

        $scope.startEditing = function() {
          $scope.inEditMode = true;
          focusService.setFocus($scope.focusLabel);
        };

        $scope.finishEditing = function() {
          $scope.inEditMode = false;
          $scope.onFinishEditing($scope.displayedValue);
          $scope.$emit('fieldEditorClosed', $scope.identifier);
        };
      }
    ]
  };
}]);
