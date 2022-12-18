export class Deta {
  private projectId: string;
  private projectKey: string;
  rootUrl: URL;
  auth: Headers;
  /**
   * @param projectId The project ID which can be found in Deta dashboard
   * @param projectKey The project key
   */
  constructor(projectId: string, projectKey: string) {
    this.projectId = projectId;
    this.projectKey = projectKey;
    this.auth = new Headers({ "X-API-Key": projectKey });
    this.auth.append("Content-Type", "application/json");
    this.rootUrl = new URL(
      `https://database.deta.sh/v1/${projectId}/`,
    );
  }
  /**
   * @param name The name of your database
   * @returns A new database instance
   */
  Base<Schema>(name: string) {
    return new Base<Schema>(this, name);
  }
}

// TODO: Make this nested inside Deta
class Base<Schema> {
  name: string;
  rootUrl: URL;
  deta: Deta;
  constructor(deta: Deta, name: string) {
    this.name = name;
    this.deta = deta;
    this.rootUrl = new URL(deta.rootUrl + name);
  }
  /**
   * Stores multiple items in a single request. This request overwrites an item if the key already exists.
   * @param items A list of items to put
   * @returns
   */
  async put(items: Schema[]) {
    const url = new URL(this.rootUrl + "/items");
    const body = JSON.stringify({ items });
    const response = await fetch(url, {
      method: "PUT",
      headers: this.deta.auth,
      body,
    });
    const data = await response.json();
    return data;
  }
  /**
   * @param key The key of the item to fetch
   * @returns The item with the given key
   */
  async get(key: string) {
    const url = new URL(this.rootUrl + "/items/" + key);
    const response = await fetch(url, {
      method: "GET",
      headers: this.deta.auth,
    });
    return response.ok ? await response.json() as Schema : null;
  }
  /**
   * @param key The key of the item to delete
   * @returns
   */
  async delete(key: string) {
    const url = new URL(this.rootUrl + "/items/" + key);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.deta.auth,
    });
    const data = await response.json();
    return data;
  }
  /**
   * Creates a new item only if no item with the same key exists.
   * @param item The item to update
   * @returns
   */
  async insert(item: Schema) {
    const url = new URL(this.rootUrl + "/items");
    const body = JSON.stringify({ item });
    const response = await fetch(url, {
      method: "POST",
      headers: this.deta.auth,
      body,
    });
    const data = await response.json();
    return data;
  }
  /**
   * Updates an item only if an item with key exists.
   * @param key The key of the item to update
   * @param updates The updates to make to the item
   * @returns
   */
  async update(key: string, updates: Updates) {
    const url = new URL(this.rootUrl + "/items/" + key);
    const body = JSON.stringify(updates);
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.deta.auth,
      body,
    });
    const data = await response.json();
    return data;
  }
  /**
   * @param query The query to run
   * @returns The items that match the query
   */
  async query(
    query: unknown[],
    limit?: number,
    last?: string,
  ): Promise<QueryResponse<Schema>> {
    const url = new URL(this.rootUrl + "/query");
    const response = await fetch(url, {
      method: "POST",
      headers: this.deta.auth,
      body: JSON.stringify({ query, limit, last }),
    });
    const data = await response.json();
    return data;
  }
}

interface Updates<Schema> {
  /**Fields to update*/
  set?: Record<keyof Schema, unknown>;
  /**Fields to increment.*/
  increment?: Record<keyof Schema, number>;
  /**Fields to append a list of values*/
  append?: Record<keyof Schema, (typeof Schema[keyof Schema])[]>;
  /**Fields to prepend a list of values*/
  prepend?: Record<keyof Schema, (typeof Schema[keyof Schema])[]>;
  /*Fields to remove*/
  delete?: (keyof Schema)[];
}

interface QueryResponse<Schema> {
  paging: {
    size: number;
    last: string;
  };
  items: Schema[];
}
