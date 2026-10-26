import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class AddFlowSubFlowUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: {
    parentFlowAlias: string;
    alias: string;
    description?: string;
  }): Promise<void> {
    return this.authentication.addSubFlow(
      input.parentFlowAlias,
      input.alias,
      input.description,
    );
  }
}
