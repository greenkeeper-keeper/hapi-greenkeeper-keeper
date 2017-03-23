Feature: Commit status event webhook

  @wip
  Scenario: Success status-event for head commit of greenkeeper PR
    Given the webhook is for a status event and a "success" state
    And a PR exists for the commit
    And the PR was submitted by the greenkeeper integration
    And statuses exist for the PR
    And the PR can be merged
    When the PR webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
