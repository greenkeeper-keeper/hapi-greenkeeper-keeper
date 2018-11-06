Feature: Commit status event webhook

  Scenario: Success status-event for head commit of greenkeeper PR for project with check_runs and statuses
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the check_run results resolve to success
    But the commit statuses resolve to success
    And the PR can be accepted
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged

  @wip
  Scenario: Success status-event for head commit of greenkeeper PR for project with check_runs but no statuses
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the check_run results resolve to success
    But there are no statuses
    And the PR can be accepted
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged

  @wip
  Scenario: Success status-event for head commit of greenkeeper PR for project with statuses but no check_runs
    Given the server is configured
    And the webhook is for a status event and a success state
    And the commit is only on one, non-master branch
    And the PR was submitted by the greenkeeper integration
    And an open PR exists for the commit
    And the commit statuses resolve to success
    But there are no check_runs
    And the PR can be accepted
    When the webhook is received
    Then the webhook response confirms that it will be processed
    And the PR is merged
