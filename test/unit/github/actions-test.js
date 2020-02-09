import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import * as octokitFactory from '../../../src/github/octokit-factory-wrapper';
import actionsFactory from '../../../src/github/actions';
import {
  FailedCheckRunFoundError,
  FailedStatusFoundError,
  InvalidStatusFoundError,
  MergeFailureError
} from '../../../src/errors';

suite('github actions', () => {
  let
    sandbox,
    actions,
    octokitIssueSearch,
    octokitGetPr,
    octokitMergePr,
    octokitCombinedStatus,
    octokitDeleteRef,
    octokitCreateIssueComment,
    octokitListChecksForRef;
  const token = any.simpleObject();
  const githubCredentials = {...any.simpleObject(), token};
  const sha = any.string();
  const ref = any.string();
  const repoOwner = any.word();
  const repoName = any.word();
  const repo = {name: repoName, owner: {login: repoOwner}};
  const prNumber = any.string();
  const response = {data: any.simpleObject()};
  const log = () => undefined;

  setup(() => {
    sandbox = sinon.createSandbox();

    octokitIssueSearch = sinon.stub();
    octokitGetPr = sinon.stub();
    octokitCombinedStatus = sinon.stub();
    octokitMergePr = sinon.stub();
    octokitDeleteRef = sinon.stub();
    octokitCreateIssueComment = sinon.stub();
    octokitListChecksForRef = sinon.stub();

    sandbox.stub(octokitFactory, 'default');

    octokitFactory.default.withArgs({auth: `token ${token}`}).returns({
      search: {issuesAndPullRequests: octokitIssueSearch},
      pulls: {
        get: octokitGetPr,
        merge: octokitMergePr
      },
      issues: {createComment: octokitCreateIssueComment},
      repos: {getCombinedStatusForRef: octokitCombinedStatus},
      gitdata: {deleteReference: octokitDeleteRef},
      checks: {listForRef: octokitListChecksForRef}
    });
    actions = actionsFactory(githubCredentials);
  });

  teardown(() => sandbox.restore());

  suite('ensure PR can be accepted', () => {
    const successfulCheckRuns = any.listOf(() => ({
      ...any.simpleObject(),
      status: 'completed',
      conclusion: any.fromList(['success', 'neutral'])
    }));

    test('that the passing status is acceptable', async () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: 0}});

      const result = await actions.ensureAcceptability({repo, sha}, () => undefined);

      assert.isTrue(result);
      assert.calledWithNew(octokitFactory.default);
    });

    test('that the failing status results in rejection', () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'failure'}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, () => undefined),
        FailedStatusFoundError,
        /A failed status was found for this PR\./
      );
    });

    test('that the pending status results in rejection', () => {
      octokitCombinedStatus
        .withArgs({owner: repoOwner, repo: repoName, ref: sha})
        .resolves({data: {state: 'pending', statuses: any.listOf(any.simpleObject)}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        'pending'
      );
    });

    test('that the pending status does not result in rejection if no statuses are listed', async () => {
      octokitCombinedStatus
        .withArgs({owner: repoOwner, repo: repoName, ref: sha})
        .resolves({data: {state: 'pending', statuses: []}});
      octokitListChecksForRef.resolves({data: {total_count: 0}});

      const result = await actions.ensureAcceptability({repo, sha}, log, any.integer());

      assert.isTrue(result);
      assert.calledWithNew(octokitFactory.default);
    });

    test('that an invalid status results in rejection', () => {
      octokitCombinedStatus
        .withArgs({owner: repoOwner, repo: repoName, ref: sha})
        .resolves({data: {state: any.string()}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log),
        InvalidStatusFoundError,
        /An invalid status was found for this PR\./
      );
    });

    test('that completed check_runs are acceptable', async () => {
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef
        .withArgs({owner: repoOwner, repo: repoName, ref: sha})
        .resolves({data: {total_count: successfulCheckRuns.length, check_runs: successfulCheckRuns}});

      const result = await actions.ensureAcceptability({repo, sha}, () => undefined);

      assert.isTrue(result);
      assert.calledWithNew(octokitFactory.default);
    });

    test('that pending check_runs result in rejection', () => {
      const checkRuns = [...successfulCheckRuns, {...any.simpleObject(), status: 'in_progress'}];
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: checkRuns.length, check_runs: checkRuns}});

      return assert.isRejected(actions.ensureAcceptability({repo, sha}, log, any.integer()), 'pending');
    });

    test('that a check_run with a `failure` conclusion results in rejection', () => {
      const checkRuns = [...successfulCheckRuns, {...any.simpleObject(), status: 'completed', conclusion: 'failure'}];
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: checkRuns.length, check_runs: checkRuns}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        FailedCheckRunFoundError,
        /A failed check_run was found for this PR\./
      );
    });

    test('that a check_run with a `cancelled` conclusion results in rejection', () => {
      const checkRuns = [...successfulCheckRuns, {...any.simpleObject(), status: 'completed', conclusion: 'cancelled'}];
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: checkRuns.length, check_runs: checkRuns}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        FailedCheckRunFoundError,
        /A failed check_run was found for this PR\./
      );
    });

    test('that a check_run with a `timed_out` conclusion results in rejection', () => {
      const checkRuns = [...successfulCheckRuns, {...any.simpleObject(), status: 'completed', conclusion: 'timed_out'}];
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: checkRuns.length, check_runs: checkRuns}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        FailedCheckRunFoundError,
        /A failed check_run was found for this PR\./
      );
    });

    test('that a check_run with an `action_required` conclusion results in rejection', () => {
      const checkRuns = [
        ...successfulCheckRuns,
        {...any.simpleObject(), status: 'completed', conclusion: 'action_required'}
      ];
      octokitCombinedStatus.withArgs({owner: repoOwner, repo: repoName, ref: sha}).resolves({data: {state: 'success'}});
      octokitListChecksForRef.resolves({data: {total_count: checkRuns.length, check_runs: checkRuns}});

      return assert.isRejected(
        actions.ensureAcceptability({repo, sha}, log, any.integer()),
        FailedCheckRunFoundError,
        /A failed check_run was found for this PR\./
      );
    });
  });

  suite('accept PR', () => {
    test('that the referenced PR gets accepted', async () => {
      const acceptAction = any.string();
      octokitMergePr.withArgs({
        owner: repoOwner,
        repo: repoName,
        pull_number: prNumber,
        sha,
        commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
        merge_method: acceptAction
      }).resolves(response);

      assert.equal(await actions.acceptPR(repo, sha, prNumber, acceptAction, log), response.data);
      assert.calledWithNew(octokitFactory.default);
    });

    test('that a merge failure is reported appropriately', () => {
      octokitMergePr.rejects(new Error('error from PUT request in test'));

      return assert.isRejected(
        actions.acceptPR(repo),
        MergeFailureError,
        /An attempt to merge this PR failed. Error: error from PUT request in test$/
      );
    });
  });

  suite('comments', () => {
    test('that an error comment is posted', async () => {
      const message = any.string();
      const error = new Error(message);
      octokitCreateIssueComment.withArgs({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${message}`
      }).resolves(response);

      assert.equal(await actions.postErrorComment(repo, prNumber, error), response);
      assert.calledWithNew(octokitFactory.default);
    });
  });

  suite('PRs for a commit', () => {
    test('that PRs with HEAD matching a commit are fetched', async () => {
      const pullRequests = any.listOf(any.simpleObject);
      octokitIssueSearch.withArgs({q: `${ref}+type:pr`}).returns({data: {items: pullRequests}});

      assert.equal(await actions.getPullRequestsForCommit({ref}), pullRequests);
      assert.calledWithNew(octokitFactory.default);
    });
  });

  test('that the PR gets requested by issue number', () => {
    const pullRequest = any.simpleObject();
    octokitGetPr.withArgs({owner: repoOwner, repo: repoName, pull_number: prNumber}).resolves({data: pullRequest});

    return assert.becomes(actions.getPullRequest(repo, prNumber), pullRequest);
  });
});
