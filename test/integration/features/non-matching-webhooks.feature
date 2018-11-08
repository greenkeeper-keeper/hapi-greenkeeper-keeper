Feature: Non-matching webhooks

  Scenario: incorrect webhook event
    Given the server is configured
    And the PR was submitted by the greenkeeper integration
    And the webhook is for a foo event
    When the webhook is received
    Then the webhook response indicates that the webhook action is incorrect

  Scenario: incorrect webhook action
    Given the server is configured
    And the PR was submitted by the greenkeeper integration
    And the webhook is for a status event and a foo state
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: non-greenkeeper user
    Given the server is configured
    And the PR was submitted by a non-greenkeeper user
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And an open PR exists for the commit
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Non-success status event
    Given the server is configured
    And the webhook is for a status event and a pending state
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event with no matching PRs
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And no open PRs exist for the commit
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event for commit on `master`
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is on the master branch
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event for commit in multiple branches
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is on multiple branches
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Success status-event for head commit of non-greenkeeper PR
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    But the PR was submitted by a non-greenkeeper user
    And an open PR exists for the commit
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Non-success check_run event
    Given the server is configured
    And the webhook is for a check_run event and a in_progress status
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped
