import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

const formatPrivateKey = (privateKey: string): string => {
  // Handle escaped backslashes (common in App Runner/ECS)
  if (privateKey.includes('\\')) {
    return privateKey.replace(/\\/g, '\n');
  }
  // Handle escaped newlines from environment variables
  if (privateKey.includes('\\n')) {
    return privateKey.replace(/\\n/g, '\n');
  }
  return privateKey;
};

export class GitHubApp {
  app: App;

  constructor() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
      ? formatPrivateKey(process.env.GITHUB_APP_PRIVATE_KEY)
      : undefined;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!appId || !privateKey || !webhookSecret) {
      throw new Error(
        "GitHub App ID, Private Key, or Webhook Secret is not configured.",
      );
    }

    this.app = new App({
      appId,
      privateKey,
      webhooks: {
        secret: webhookSecret,
      },
    });
  }

  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    return await this.app.getInstallationOctokit(installationId);
  }

  async getInstallationAccessToken(installationId: number): Promise<{
    token: string;
    expiresAt: string;
  }> {
    const octokit = await this.app.getInstallationOctokit(installationId);

    // The installation access token is available on the auth property
    const auth = (await octokit.auth({
      type: "installation",
    })) as any;

    return {
      token: auth.token,
      expiresAt: auth.expiresAt,
    };
  }
}
