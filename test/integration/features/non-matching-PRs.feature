Feature: Non-matching PRs

  Scenario: non-greenkeeper user
    Given the PR was submitted by a non-greenkeeper user
    When the PR webhook is received
    Then the webhook response indicates that the PR will be skipped
