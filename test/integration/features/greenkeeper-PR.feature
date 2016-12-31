Feature: Greenkeeper PR

  Scenario: PR created by the greenkeeper github integration
    Given the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper integration
    And statuses exist for the PR
    And the PR can be merged
    When the PR webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged

  Scenario: PR created by the greenkeeper legacy bot
    Given the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper legacy bot
    And statuses exist for the PR
    And the PR can be merged
    When the PR webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
