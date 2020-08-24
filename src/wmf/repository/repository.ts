import { Filter } from "../../model/application";
import { MModel, MObject } from "../model/model";
import { ViewNode } from "../model/view-model";

export interface User {
  username: string;
  password: string;
}

export interface Repository {

  user: User | undefined;
  database: string | undefined;
  loggedIn: boolean;
  loginFailed: boolean;

  setUrl(url: string): void;

  login(username: string, password: string): Promise<string>;

  listDatabases(): string[];

  selectDatabase(dbName: string): boolean;

  loadModel(model: MModel): Promise<void>;

  fetchObjects(model: MModel, query: string, filter: Filter): Promise<void>;

  fetchChildren(model: MModel, object: MObject): Promise<void>;

  getRelationsFrom(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

  getRelationsTo(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

  expandRelations(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

}