import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class CreateAuthFlowUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: { alias: string; description?: string }): Promise<void> {
    return this.authentication.createFlow(input.alias, input.description);
  }
}
