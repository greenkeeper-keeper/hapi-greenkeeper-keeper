Feature: Greenkeeper PR

  Scenario: Acceptable PR
    Given statuses exist for the PR
    And the PR can be merged
    When the PR webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
