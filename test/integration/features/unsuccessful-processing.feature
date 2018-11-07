Feature: Unsuccessful processing

  Scenario: commit status failure
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the check_run results resolve to success
    But the commit statuses resolve to failure
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: A failed status was found for this PR.

  @wip
  Scenario: commit status success, but check_run failure
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the commit statuses resolve to success
    But the check_run results resolve to failure
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: A failed status was found for this PR.

  @wip
  Scenario: check_run success, but commit status failure
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the check_run results resolve to success
    But the commit statuses resolve to failure
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: A failed status was found for this PR.

  Scenario: pending check_run
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the check_run results resolve to pending
    But the commit statuses resolve to success
    When the webhook is received
    Then the webhook response confirms that it will be processed
    But the PR is not merged

  Scenario: merge failure
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And the check_run results resolve to success
    And the commit statuses resolve to success
    And an open PR exists for the commit
    But the PR cannot be merged
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And a comment is made against the PR: An attempt to merge this PR failed.
