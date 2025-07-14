export interface RequestHeaders extends Record<string, string> {
  'Content-Type': string;
  'Authorization': string;
}

export interface GistResponseFile {
  filename: string;
  language: string;
  raw_url: string;
  size: number;
  type: string;

  // file content
  content?: string;
}

export interface GistResponse {
  commits_url: string;
  created_at: string;
  updated_at: string;
  description: string;
  url: string;
  files: Record<string, GistResponseFile>;
  forks_url: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  id: string;
  node_id: string;
  owner: {
    avatar_url: string;
    events_url: string;
    followers_url: string;
    gists_url: string;
    gravatar_id: string;
    html_url: string;
    id: number;
    login: string;
    node_id: string;
    organizations_url: string;
    received_events_url: string;
    repos_url: string;
    site_admin: boolean;
    starred_url: string;
    subscriptions_url: string;
    type: string;
    url: string;
    user_view_type: string;
  };
  public: boolean;
  truncated: boolean;
  user: null | unknown;
  comments: number;
  comments_url: string;
}

export interface GistFile {
  filename: string;
  content: string;
}

export default class GistService {
  private static baseUrl = 'https://api.github.com/gists';

  public static async get(id: string, headers: RequestHeaders): Promise<GistResponse> {
    try {
      const url = new URL(`${this.baseUrl}/${id}`);

      const response = await fetch(url, { method: 'GET', headers: headers });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data as GistResponse;
    } catch (error) {
      console.error('Failed to fetch Gist:', error);

      throw error;
    }
  }

  public static async getAll(headers: RequestHeaders, params?: Record<string, string>): Promise<GistResponse[]> {
    try {
      const url = new URL(this.baseUrl);

      const searchParams = new URLSearchParams(params);
      url.search = searchParams.toString();

      const response = await fetch(url, { method: 'GET', headers: headers });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data as GistResponse[];
    } catch (error) {
      console.error('Failed to fetch Gists:', error);

      throw error;
    }
  }

  public static async addFiles(id: string, headers: RequestHeaders, files: Record<string, GistResponseFile>) {
    const gist = await this.get(id, headers);

    // null deletes the file
    const payload: Record<string, { filename?: string | null; content?: string } | null> = {};

    await Promise.all(
      Object.entries(files).map(([name, file]) => {
        return new Promise(async (resolve) => {
          if (Object.keys(gist.files).includes(name)) {
            return resolve(name);
          }

          if (file.filename && file.raw_url) {
            const content = await this.getFileContentFromRawUrl(file.raw_url, headers);
            const versionRegex = /\b(\d+\.\d+\.\d+)\b/g;

            let version = content.match(versionRegex) as unknown as string;

            if (version && version[0]) {
              version = version[0];
            }

            payload[name ?? (version ? version + '.js' : null) ?? file.filename] = { content: content };

            return resolve(content);
          } else if (file.content) {
            payload[name] = { content: file.content };

            return resolve(file.content);
          }

          return resolve(undefined);
        });
      }),
    );

    if (Object.keys(payload).length === 0) {
      return gist;
    }

    const body = { files: payload };

    return await this.update(id, headers, body);
  }

  public static async update(id: string, headers: RequestHeaders, body: Record<string, any>) {
    try {
      const url = new URL(`${this.baseUrl}/${id}`);

      const response = await fetch(url, { method: 'PATCH', headers: headers, body: JSON.stringify(body) });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Failed to update Gist:', error);

      throw error;
    }
  }

  public static async getFileContentFromRawUrl(rawUrl: string, headers: RequestHeaders): Promise<string> {
    try {
      const response = await fetch(rawUrl, { headers: headers });

      if (!response.ok) {
        throw new Error(`Error fetching file content: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();

      return content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      throw error;
    }
  }

  public static async create(headers: RequestHeaders, body: Record<string, any>) {
    try {
      const response = await fetch(this.baseUrl, { method: 'POST', headers: headers, body: JSON.stringify(body) });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Failed to create Gist:', error);

      throw error;
    }
  }
}
