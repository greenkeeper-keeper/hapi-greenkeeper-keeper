Feature: Unsuccessful processing

  @wip
  Scenario: merge failure
    Given the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper legacy bot
    But the PR cannot be merged
    When the PR webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: "A failed status was found for this PR."
