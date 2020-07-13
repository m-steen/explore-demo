import { Filter } from "../../model/application";
import { MModel } from "../model/model";
import { ViewNode } from "../model/view-model";

export interface Repository {

  database: string | undefined;
  loggedIn: boolean;
  loginFailed: boolean;

  setUrl(url: string): void;

  login(username: string, password: string): Promise<string>;

  selectDatabase(dbName: string): boolean;

  loadModel(model: MModel): Promise<void>;

  fetchObjects(model: MModel, query: string, filter: Filter): Promise<void>;

  getRelationsFrom(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

  getRelationsTo(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

  expandRelations(node: ViewNode, filter: Filter, model: MModel): Promise<void>;

}