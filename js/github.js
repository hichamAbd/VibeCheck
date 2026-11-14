// The only outside connection the app makes, and only on the owner's phone:
// the GitHub API, to save encrypted files into this repository.

export class GitHubError extends Error {
  constructor(status, detail) {
    super(`GitHub ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

export class GitHub {
  constructor({ token, owner, repo, branch }) {
    this.token = token;
    this.branch = branch;
    this.base = `https://api.github.com/repos/${owner}/${repo}`;
  }

  async req(method, path, body, accept = 'application/vnd.github+json') {
    const headers = { Accept: accept, Authorization: `Bearer ${this.token}` };
    if (body) headers['Content-Type'] = 'application/json';
    let res;
    try {
      res = await fetch(this.base + path, {
        method,
        headers,
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new GitHubError(0, 'network');
    }
    if (!res.ok) {
      let detail = '';
      try { detail = await res.text(); } catch (e) { /* ignore */ }
      throw new GitHubError(res.status, detail);
    }
    if (accept.includes('raw')) return res.text();
    return res.status === 204 ? null : res.json();
  }

  // Confirms the key is valid and can see this repository.
  async check() {
    await this.req('GET', `/git/ref/heads/${this.branch}`);
  }

  // Returns the file's text, or null when it does not exist yet.
  async readFile(path) {
    try {
      return await this.req('GET', `/contents/${path}?ref=${this.branch}`, null, 'application/vnd.github.raw+json');
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  // Writes several files in one commit. Throws status 409 if someone else
  // pushed in between, so the caller can re-read and try again.
  async commit(files, message = 'Update') {
    const ref = await this.req('GET', `/git/ref/heads/${this.branch}`);
    const parent = ref.object.sha;
    const parentCommit = await this.req('GET', `/git/commits/${parent}`);
    const tree = await this.req('POST', '/git/trees', {
      base_tree: parentCommit.tree.sha,
      tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })),
    });
    const commit = await this.req('POST', '/git/commits', { message, tree: tree.sha, parents: [parent] });
    try {
      await this.req('PATCH', `/git/refs/heads/${this.branch}`, { sha: commit.sha, force: false });
    } catch (e) {
      if (e.status === 422) throw new GitHubError(409, 'moved');
      throw e;
    }
    return commit.sha;
  }
}
