import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { UserCredential } from "../../domain/user/user-credential.js";

export class ListUserCredentialsUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(id: UserId): Promise<UserCredential[]> {
    return this.users.listCredentials(id);
  }
}
