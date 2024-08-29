import type { FeatureRegistry } from '../../agent/FeatureRegistry'
import type { DependencyManager, Module } from '../../plugins'

import { Protocol } from '../../agent/models'

import { DistribuitedPackApi } from './DistribuitedPackApi'
import { DistribuitedPackRole, DistribuitedPackState } from './models'
import { DistribuitedPackRepository } from './repository'
import { DistribuitedPackService} from './services'

export class DistribuitedPackModule implements Module {
  public readonly api = DistribuitedPackApi


  /**
   * Registers the dependencies of the connections module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {

    // Services
    dependencyManager.registerSingleton(DistribuitedPackService)

    // Repositories
    dependencyManager.registerSingleton(DistribuitedPackRepository)

    // Features
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/distribuited_pack/1.0',
        roles: [DistribuitedPackRole.Requester,DistribuitedPackRole.Responder],
      }),
    )
  }
}
