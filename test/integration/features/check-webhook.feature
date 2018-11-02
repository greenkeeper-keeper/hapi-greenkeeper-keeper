Feature: Check run event webhook

  Scenario: Success check_run event for head commit of greenkeeper PR
    Given the server is configured
    And the webhook is for a check_run event, a completed status, and a success conclusion
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And statuses exist for the PR
    And the PR can be accepted
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
