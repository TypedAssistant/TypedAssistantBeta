import type { HassEntities, HassEntity } from "home-assistant-js-websocket"
import React, { useCallback, useRef, useState } from "react"
import type { AnyOtherString } from "@typed-assistant/utils/misc-types"
import { useEntitiesSubscription } from "./useEntitiesSubscription"
import type { HaConnection } from "@typed-assistant/connection"
import { entitiesAreDifferent } from "./entitiesAreDifferent"

export type EntityId = unknown

export const EntitiesSubscriptionContext = React.createContext<
  [
    HassEntities,
    (
      setEntitiesToSubscribe: (
        entitiesToSubscribe: Array<
          [string, Array<keyof HassEntity | AnyOtherString>]
        >,
      ) => Array<[string, Array<keyof HassEntity | AnyOtherString>]>,
    ) => void,
  ]
>([{}, () => {}])

export let entities: HassEntities = {}

export const EntitiesProvider = ({
  children,
  connection,
}: {
  children: React.ReactNode
  connection: HaConnection
}) => {
  const entitiesToSubscribeRef = useRef<
    Array<[string, Array<keyof HassEntity | AnyOtherString>]>
  >([])
  const [, setCounter] = useState(0)
  const entitiesRef = useRef<HassEntities>()
  const setEntitiesToSubscribe = (
    newEntitiesToSubscribe: (
      oldEntities: Array<[string, Array<keyof HassEntity | AnyOtherString>]>,
    ) => Array<[string, Array<keyof HassEntity | AnyOtherString>]>,
  ) => {
    entitiesToSubscribeRef.current = newEntitiesToSubscribe(
      entitiesToSubscribeRef.current,
    )
  }

  useEntitiesSubscription(
    connection,
    useCallback((newEntities) => {
      if (!entitiesRef.current) {
        entities = newEntities
        entitiesRef.current = newEntities
        rerender()
        return
      }
      entitiesToSubscribeRef.current.forEach(([entityId, deps]) => {
        const newEntity = newEntities[entityId]
        if (
          newEntity &&
          entitiesAreDifferent(
            deps,
            newEntities[entityId],
            entitiesRef.current?.[entityId],
          )
        ) {
          entitiesRef.current = {
            ...entitiesRef.current,
            [entityId]: newEntity,
          }
          rerender()
        }
      })
    }, []),
  )

  function rerender() {
    setCounter((n) => n + 1)
  }

  return (
    <EntitiesSubscriptionContext.Provider
      value={[entitiesRef.current ?? {}, setEntitiesToSubscribe]}
    >
      {children}
    </EntitiesSubscriptionContext.Provider>
  )
}