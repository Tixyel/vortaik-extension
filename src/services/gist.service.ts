interface RequestHeaders extends Record<string, string> {
  'Content-Type': string;
  'Authorization': string;
}

export default class GistService {
  private baseUrl = 'https://api.github.com/gists/';

  public async get(id: string, headers: RequestHeaders) {
    try {
      const response = await fetch(this.baseUrl + id, { method: 'GET', headers: headers });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Failed to fetch Gist:', error);

      throw error;
    }
  }

  public async getAll(headers: RequestHeaders) {
    try {
      const response = await fetch(this.baseUrl, { method: 'GET', headers: headers });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Failed to fetch Gists:', error);

      throw error;
    }
  }

  public async update(id: string, headers: RequestHeaders, body: Record<string, any>) {
    try {
      const response = await fetch(this.baseUrl + id, { method: 'PATCH', headers: headers, body: JSON.stringify(body) });

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

  public async create(headers: RequestHeaders, body: Record<string, any>) {
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
