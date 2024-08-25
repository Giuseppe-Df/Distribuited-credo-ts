import type { FeatureRegistry } from '../../agent/FeatureRegistry'
import type { DependencyManager, Module } from '../../plugins'

import { Protocol } from '../../agent/models'

import { CekExchangeApi } from './CekExchangeApi'
import { CekRole, CekState } from './models'
import { CekRepository } from './repository'
import { CekExchangeService} from './services'

export class CekModule implements Module {
  public readonly api = CekExchangeApi


  /**
   * Registers the dependencies of the connections module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry) {

    // Services
    dependencyManager.registerSingleton(CekExchangeService)

    // Repositories
    dependencyManager.registerSingleton(CekRepository)

    // Features
    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/cek_exchange/1.0',
        roles: [CekRole.Requester,CekRole.Responder],
      }),
    )
  }
}
