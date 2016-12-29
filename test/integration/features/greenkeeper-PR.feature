Feature: Greenkeeper PR

  Scenario: Acceptable PR
    When the PR webhook is received
    Then a successful response is returned
