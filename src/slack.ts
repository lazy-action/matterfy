import * as github from '@actions/github';
import * as core from '@actions/core';
import {Status} from './utils';
import {
  IncomingWebhook,
  IncomingWebhookSendArguments,
  IncomingWebhookResult
} from '@slack/webhook';

export class Slack extends IncomingWebhook {
  // 0: failure, 1: success, 2: cancel
  static readonly color: string[] = ['#cb2431', '#2cbe4e', '#ffc107'];
  static readonly mark: string[] = [':x:', ':white_check_mark:', ':warning:'];
  static readonly msg: string[] = ['Failure', 'Success', 'Cancel'];

  constructor(
    url: string,
    username: string,
    icon_emoji: string,
    channel: string
  ) {
    super(url, {username, icon_emoji, channel});
  }

  /**
   * Get mattermost fields
   */
  protected get fields(): Object {
    const context = github.context;
    const {sha, eventName, workflow, ref} = context;
    const {owner, repo} = context.repo;
    const repo_url: string = `https://github.com/${owner}/${repo}`;
    const action_url: string = `${repo_url}/commit/${sha}/checks`;

    const fields: Array<Object> = [
      {
        short: true,
        title: `repository`,
        value: `<${repo_url}|${owner}/${repo}>`
      },
      {short: true, title: `ref`, value: `${ref}`},
      {short: true, title: `event name`, value: `${eventName}`},
      {short: true, title: `workflow`, value: `<${action_url}|${workflow}>`}
    ];

    return fields;
  }

  /**
   * Generate payload
   */
  protected generatePayload(
    status: Status,
    msg: string
  ): IncomingWebhookSendArguments {
    const text: string = `${Slack.mark[status]} GitHub Actions ${Slack.msg[status]}`;
    const attachments: Object = {
      color: Slack.color[status],
      title: msg,
      fields: this.fields
    };
    const payload: IncomingWebhookSendArguments = {
      text,
      attachments: [attachments]
    };

    core.debug(`Generated payload for Mattermost: ${JSON.stringify(payload)}`);

    return payload;
  }

  /**
   * Notify information about github actions to Mattermost
   */
  public async notify(
    status: Status,
    msg: string
  ): Promise<IncomingWebhookResult> {
    try {
      const payload: IncomingWebhookSendArguments = this.generatePayload(
        status,
        msg
      );
      const result = await this.send(payload);

      core.debug('Sent message to Mattermost');

      return result;
    } catch (err) {
      throw err;
    }
  }
}
