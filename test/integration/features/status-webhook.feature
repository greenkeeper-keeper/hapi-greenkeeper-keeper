Feature: Commit status event webhook

  Scenario: Success status-event for head commit of greenkeeper PR
    Given the server is configured
    And the webhook is for a status event and a "success" state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And statuses exist for the PR
    And the PR can be merged
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
