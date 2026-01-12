import * as v from "valibot";
import { emptySchema, type EmptyRequest } from "../../../shared/contract";
import type { Schema } from "../../../shared/types";
import type { PageComponent } from "./types";

// Page contract - includes component for SSR
export class PageContract<TReq extends Record<string, unknown>, TProps> {
  readonly _props!: TProps; // phantom type for type inference

  constructor(
    public readonly path: string,
    public readonly schema: Schema<TReq>,
    public readonly Component: PageComponent<TProps>
  ) {}
}

// Builder: after .withComponent() - needs .build()
export class ContractWithComponent<TReq extends Record<string, unknown>, TProps> {
  constructor(
    private path: string,
    private schema: Schema<TReq>,
    private Component: PageComponent<TProps>
  ) {}

  // Terminal - creates PageContract (props type comes from Component)
  build(): PageContract<TReq, TProps> {
    return new PageContract<TReq, TProps>(this.path, this.schema, this.Component);
  }
}

// Builder: Component-first page contract - can add .withRequest() or .build()
export class PageContractWithComponent<TProps> {
  constructor(
    private path: string,
    private Component: PageComponent<TProps>
  ) {}

  withRequest<TReq extends v.ObjectEntries>(
    entries: TReq
  ): ContractWithComponent<v.InferOutput<v.ObjectSchema<TReq, undefined>>, TProps> {
    const schema = v.object(entries);
    return new ContractWithComponent(this.path, schema, this.Component);
  }

  build(): PageContract<EmptyRequest, TProps> {
    return new PageContract<EmptyRequest, TProps>(this.path, emptySchema, this.Component);
  }
}

// Page contract - Component first
export const page = <TProps>(Component: PageComponent<TProps>, path: string): PageContractWithComponent<TProps> =>
  new PageContractWithComponent(path, Component);
