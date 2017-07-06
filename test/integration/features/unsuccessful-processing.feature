Feature: Unsuccessful processing

  Scenario: commit status failure
    Given the server is configured
    And the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper integration
    But the commit statuses resolve to "failure"
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: "A failed status was found for this PR."

  Scenario: merge failure
    Given the server is configured
    And the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper integration
    And statuses exist for the PR
    But the PR cannot be merged
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: "An attempt to merge this PR failed. Error: Method Not Allowed"

  Scenario: delete branch failure
    Given the server is configured
    And the webhook is for a "pull_request" event and a "opened" action
    And the PR was submitted by the greenkeeper integration
    And statuses exist for the PR
    And the PR can be accepted
    But the branch cannot be deleted
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: "An attempt to delete this branch failed. Error: Internal Server Error"
