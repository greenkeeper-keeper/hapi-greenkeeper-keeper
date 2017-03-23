Feature: Non-matching PRs

  Scenario: incorrect webhook event
    Given the PR was submitted by the greenkeeper integration
    And the webhook is for a "foo" event and a "opened" action
    When the PR webhook is received
    Then the webhook response indicates that the PR will be skipped

  Scenario: incorrect webhook action
    Given the PR was submitted by the greenkeeper integration
    And the webhook is for a "pull_request" event and a "foo" action
    When the PR webhook is received
    Then the webhook response indicates that the PR will be skipped

  Scenario: non-greenkeeper user
    Given the PR was submitted by a non-greenkeeper user
    When the PR webhook is received
    Then the webhook response indicates that the PR will be skipped

  Scenario: Non-success status event
    Given the webhook is for a status event and a "pending" state
    When the PR webhook is received
    Then the webhook response indicates that the PR will be skipped
