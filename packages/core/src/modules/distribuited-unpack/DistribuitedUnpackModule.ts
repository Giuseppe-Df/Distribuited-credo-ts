import type { FeatureRegistry } from '../../agent/FeatureRegistry'
import type { DependencyManager, Module } from '../../plugins'

import { Protocol } from '../../agent/models'

import { DistribuitedUnpackApi } from './DistribuitedUnpackApi'
import { DistribuitedUnpackRole, DistribuitedUnpackState } from './models'
import { DistribuitedUnpackRepository } from './repository'
import {DistribuitedUnpackService} from './services'

export class DistribuitedUnpackModule implements Module {
  public readonly api = DistribuitedUnpackApi


  /**
   * Registers the dependencies of the connections module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {

    // Services
    dependencyManager.registerSingleton(DistribuitedUnpackService)

    // Repositories
    dependencyManager.registerSingleton(DistribuitedUnpackRepository)

    // Features
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/distribuited_unpack/1.0',
        roles: [DistribuitedUnpackRole.Requester,DistribuitedUnpackRole.Responder],
      }),
    )
  }
}
