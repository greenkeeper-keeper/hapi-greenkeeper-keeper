Feature: Non-matching webhooks

  Scenario: incorrect webhook event
    Given the PR was submitted by the greenkeeper integration
    And the webhook is for a "foo" event and a "opened" action
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: incorrect webhook action
    Given the PR was submitted by the greenkeeper integration
    And the webhook is for a "pull_request" event and a "foo" action
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: non-greenkeeper user
    Given the PR was submitted by a non-greenkeeper user
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Non-success status event
    Given the webhook is for a status event and a "pending" state
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event with no matching PRs
    Given the webhook is for a status event and a "success" state
    And the commit is only on one, non-master branch
    And no open PRs exist for the commit
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event for commit on `master`
    Given the webhook is for a status event and a "success" state
    And the commit is on the master branch
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Status event for commit in multiple branches
    Given the webhook is for a status event and a "success" state
    And the commit is on multiple branches
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped

  Scenario: Success status-event for head commit of non-greenkeeper PR
    Given the webhook is for a status event and a "success" state
    And the commit is only on one, non-master branch
    And an open PR exists for the commit
    But the PR was submitted by a non-greenkeeper user
    When the webhook is received
    Then the webhook response indicates that the webhook will be skipped
