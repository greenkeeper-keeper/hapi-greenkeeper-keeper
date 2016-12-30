Feature: Greenkeeper PR

  Scenario: Acceptable PR
    Given statuses exist for the PR
    And the PR can be merged
    When the PR webhook is received
    Then a successful response is returned
    And the PR is merged
