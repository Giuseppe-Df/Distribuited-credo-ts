import type { FeatureRegistry } from '../../agent/FeatureRegistry'
import type { DependencyManager, Module } from '../../plugins'

import { Protocol } from '../../agent/models'

import { PubKeyApi } from './PubKeyApi'
import { PubKeyRole, PubKeyState } from './models'
import { PubKeyRepository } from './repository'
import { PubKeyService} from './services'

export class PubKeyModule implements Module {
  public readonly api = PubKeyApi


  /**
   * Registers the dependencies of the connections module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {

    // Services
    dependencyManager.registerSingleton(PubKeyService)

    // Repositories
    dependencyManager.registerSingleton(PubKeyRepository)

    // Features
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/pubkey/1.0',
        roles: [PubKeyRole.Requester,PubKeyRole.Responder],
      }),
    )
  }
}
