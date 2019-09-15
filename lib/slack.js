"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const webhook_1 = require("@slack/webhook");
class Slack extends webhook_1.IncomingWebhook {
    constructor(url, username, icon_emoji, channel) {
        super(url, { username, icon_emoji, channel });
    }
    /**
     * Get mattermost fields
     */
    get fields() {
        const context = github.context;
        const { sha, eventName, workflow, ref } = context;
        const { owner, repo } = context.repo;
        const repo_url = `https://github.com/${owner}/${repo}`;
        const action_url = `${repo_url}/commit/${sha}/checks`;
        const fields = [
            {
                short: true,
                title: `repository`,
                value: `<${repo_url}|${owner}/${repo}>`
            },
            { short: true, title: `ref`, value: `${ref}` },
            { short: true, title: `event name`, value: `${eventName}` },
            { short: true, title: `workflow`, value: `<${action_url}|${workflow}>` }
        ];
        return fields;
    }
    /**
     * Generate payload
     */
    generatePayload(status, msg, username, icon_emoji) {
        const text = `${Slack.mark[status]} GitHub Actions ${Slack.msg[status]}`;
        const attachments = {
            color: Slack.color[status],
            title: msg,
            fields: this.fields
        };
        const payload = {
            text,
            username,
            icon_emoji,
            attachments: [attachments]
        };
        core.debug(`Generated payload for Mattermost: ${JSON.stringify(payload)}`);
        return payload;
    }
    /**
     * Notify information about github actions to Mattermost
     */
    notify(status, msg, username, icon_emoji) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = this.generatePayload(status, msg, username, icon_emoji);
                const result = yield this.send(payload);
                core.debug('Sent message to Mattermost');
                return result;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
// 0: failure, 1: success, 2: cancel
Slack.color = ['#cb2431', '#2cbe4e', '#ffc107'];
Slack.mark = [':x:', ':white_check_mark:', ':warning:'];
Slack.msg = ['Failure', 'Success', 'Cancel'];
exports.Slack = Slack;
