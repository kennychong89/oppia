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
 * @fileoverview Directive for the "simple editor" tab in the exploration
 * editor.
 */

// Make the last link active when the scroll reaches the bottom of the page.
oppia.value('duScrollBottomSpy', true);
// This indicates that the observed elements are the first ones in their
// respective sections (rather than the entire sections themselves).
oppia.value('duScrollGreedy', true);

oppia.value('INTERACTION_DETAILS', [{
  id: 'MultipleChoiceInput',
  name: 'Multiple choice',
  getNewTemplate: function(
      questionIndex, isLastQuestion, stateName, generateRandomId) {
    return {
      id: generateRandomId(),
      directiveName: 'question',
      header: 'Question ' + (questionIndex + 1),
      sidebarLabel: 'Question ' + (questionIndex + 1),
      // TODO(sll): Warning -- this does not change?
      stateName: stateName,
      sidebarConfig: {
        numElementsToShow: isLastQuestion ? 1 : 4
      },
      subfields: [{
        id: generateRandomId(),
        sidebarLabel: 'Prompt'
      }, {
        id: generateRandomId(),
        sidebarLabel: 'Correct answer'
      }, {
        id: generateRandomId(),
        sidebarLabel: 'Hints'
      }, {
        id: generateRandomId(),
        sidebarLabel: 'Bridge text'
      }],
      isFilledOut: function() {
        return false;
      },
      save: function() {}
    };
  }
}]);

oppia.directive('simpleEditorTab', [function() {
  return {
    restrict: 'E',
    templateUrl: 'editor/simpleEditorTab',
    controller: [
      '$scope', '$document', '$rootScope', '$anchorScroll', '$window',
      '$timeout', 'EditorModeService', 'explorationTitleService',
      'duScrollDuration', 'explorationStatesService',
      'explorationInitStateNameService', 'INTERACTION_DETAILS',
      function(
          $scope, $document, $rootScope, $anchorScroll, $window,
          $timeout, EditorModeService, explorationTitleService,
          duScrollDuration, explorationStatesService,
          explorationInitStateNameService, INTERACTION_DETAILS) {
        $scope.setEditorModeToFull = EditorModeService.setModeToFull;
        $scope.explorationTitleService = explorationTitleService;
        $scope.fields = [];

        var generateRandomId = function() {
          return Math.random().toString(36).slice(2);
        };

        $scope.defaultScrollOffset = Math.max(
          100, $window.innerHeight / 2 - 100);
        $scope.scrollSpyIsActive = true;
        $window.onresize = function() {
          $scope.defaultScrollOffset = Math.max(
            100, $window.innerHeight / 2 - 100);

          // This is needed in order to reset the offsets for the scroll
          // anchors in the sidebar, until
          // https://github.com/oblador/angular-scroll/issues/179 is addressed.
          $scope.scrollSpyIsActive = false;
          $timeout(function() {
            $scope.scrollSpyIsActive = true;
          }, 5);
        };

        $scope.currentScrollId = null;
        $rootScope.$on('duScrollspy:becameActive', function(
            $event, $element, $target) {
          $scope.currentScrollId = $target[0].id;
          $scope.$apply();
        });

        // Scroll the page so that the directive with the given id is in focus.
        var scrollToElement = function(directiveId) {
          $document.scrollToElementAnimated(
            angular.element(document.getElementById(directiveId)),
            $scope.defaultScrollOffset);
        };

        $scope.getLastSeenFieldId = function() {
          if ($scope.numElementsToShow) {
            return $scope.fields[$scope.numElementsToShow - 1].id;
          }
        };

        // The "go forward" button only appears if all fields have been filled.
        // Clicking it adds a new question to the stack.
        $scope.goForward = function() {
          // TODO(sll): The logic in this function needs to be redone.
          if ($scope.numElementsToShow >= $scope.fields.length) {
            return;
          }
          var firstUnseenFieldId = $scope.fields[$scope.numElementsToShow].id;
          if (firstUnseenFieldId === null) {
            // TODO(sll): Add a new question here, then scroll to it and open
            // its editor.
            return;
          }
        };

        $scope.$on('fieldEditorClosed', function(evt, identifier) {
          evt.stopPropagation();
          for (var i = 0; i < $scope.fields.length; i++) {
            if ($scope.fields[i].id === identifier) {
              // If the field value is not valid, scroll to the next field and,
              // if it is not valid, open it. Otherwise, return without doing
              // anything.
              if ($scope.fields[i].isFilledOut() &&
                  i + 1 < $scope.fields.length) {
                scrollToElement($scope.fields[i + 1].id);
                if (!$scope.fields[i + 1].isFilledOut()) {
                  $timeout(function() {
                    $scope.$broadcast('externalOpen', $scope.fields[i + 1].id);
                  }, duScrollDuration);
                }
              }
              return;
            }
          }
        });

        $scope.$on('refreshStateEditor', function() {
          $scope.initStateEditor();
        });

        $scope.initStateEditor = function() {
          $scope.fields = [{
            id: 'titleId',
            directiveName: 'plaintext-field',
            header: 'What would you like to teach?',
            sidebarLabel: 'Title',
            getInitDisplayedValue: function() {
              return explorationTitleService.displayed;
            },
            isFilledOut: function() {
              return !!explorationTitleService.savedMemento;
            },
            save: function(newValue) {
              explorationTitleService.displayed = newValue;
              explorationTitleService.saveDisplayedValue();
              // TODO(sll): call a generic "recompute numElementsToShow"
              // function, instead.
              if (explorationTitleService.savedMemento) {
                $scope.numElementsToShow = Math.max(
                  $scope.numElementsToShow, 2);
              }
            }
          }, {
            id: 'introId',
            directiveName: 'html-field',
            header: 'Introduction',
            sidebarLabel: 'Introduction',
            getInitDisplayedValue: function() {
              return explorationStatesService.getStateContentMemento(
                explorationInitStateNameService.savedMemento)[0].value;
            },
            isFilledOut: function() {
              return !!explorationStatesService.getStateContentMemento(
                explorationInitStateNameService.savedMemento)[0].value;
            },
            save: function(newValue) {
              explorationStatesService.saveStateContent(
                explorationInitStateNameService.savedMemento, [{
                  type: 'text',
                  value: newValue
                }]
              );

              if ($scope.fields.length === 2) {
                $scope.fields.push({
                  id: 'question1Id',
                  directiveName: 'question',
                  sidebarLabel: 'Question 1'
                });
              }

              $scope.numElementsToShow = Math.max($scope.numElementsToShow, 3);
            }
          }];

          // Get the order of states, if the exploration is linear and uses
          // only "supported" interactions. If it is not linear, switch to the
          // full editor.
          var simpleEditorCanBeUsed = true;
          var stateNamesInOrder = [];
          var currentStateName = explorationInitStateNameService.savedMemento;
          var allowedInteractionIds = INTERACTION_DETAILS.map(
            function(interactionData) {
              return interactionData.id;
            }
          );
          var iterations = 0;
          while (currentStateName) {
            iterations += 1;
            if (iterations > 100) {
              console.error('Too many iterations in while loop');
              break;
            }
            if (stateNamesInOrder.indexOf(currentStateName) !== -1) {
              simpleEditorCanBeUsed = false;
              break;
            }
            stateNamesInOrder.push(currentStateName);

            var stateData = explorationStatesService.getState(
              currentStateName);
            var interactionId = stateData.interaction.id;
            if (!interactionId) {
              break;
            }

            if (allowedInteractionIds.indexOf(interactionId) === -1) {
              simpleEditorCanBeUsed = false;
              break;
            }

            // Is the default answer group a self-loop, and is there exactly
            // one non-self-loop destination among the non-default answer
            // groups, and are there no fallbacks or param changes?
            // TODO(sll): This needs to be generalized into a per-interaction
            // validity check, that also includes checks for the customization
            // args.
            var destinationStateNames = [];
            stateData.interaction.answer_groups.forEach(function(group) {
              if (group.outcome.dest !== currentStateName) {
                destinationStateNames.push(group.outcome.dest);
              }
            });

            var defaultOutcome = stateData.interaction.default_outcome;
            if (destinationStateNames.length > 1 ||
                stateData.param_changes.length > 0 ||
                defaultOutcome.dest !== currentStateName ||
                defaultOutcome.param_changes.length > 0 ||
                stateData.interaction.fallbacks.length > 0) {
              simpleEditorCanBeUsed = false;
              break;
            }

            currentStateName = destinationStateNames[0];
          }

          if (!simpleEditorCanBeUsed) {
            $scope.setEditorModeToFull();
            return;
          }

          // The number of fields to show:
          // - If the title is empty, show just one field.
          // - Otherwise, show (one plus the number of states) fields, plus
          //   another one if the interaction id for the last state is
          //   specified.
          $scope.numElementsToShow = 1;
          if (stateNamesInOrder.length > 1 ||
              explorationTitleService.savedMemento) {
            $scope.numElementsToShow = 1 + stateNamesInOrder.length;
            var lastStateInteractionId = (
              explorationStatesService.getState(
                stateNamesInOrder[stateNamesInOrder.length - 1]
              ).interaction.id);
            if (lastStateInteractionId) {
              $scope.numElementsToShow += 1;
            }
          }

          for (var i = 0; i < stateNamesInOrder.length; i++) {
            var state = explorationStatesService.getState(stateNamesInOrder[i]);

            var interactionIdToCompareWith = state.interaction.id;
            if (i === 0 && !state.interaction.id) {
              interactionIdToCompareWith = INTERACTION_DETAILS[0].id;
            }

            for (var j = 0; j < INTERACTION_DETAILS.length; j++) {
              if (INTERACTION_DETAILS[j].id === interactionIdToCompareWith) {
                $scope.fields.push(INTERACTION_DETAILS[j].getNewTemplate(
                  i, i === stateNamesInOrder.length - 1, stateNamesInOrder[i],
                  generateRandomId));
                break;
              }
            }
          }

          // Give the page a little while to load, then scroll so that the first
          // element is in focus.
          $timeout(function() {
            scrollToElement($scope.fields[0].id);
          }, 50);
        };
      }
    ]
  };
}]);
