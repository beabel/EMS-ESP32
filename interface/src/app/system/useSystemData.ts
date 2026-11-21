import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'components/toast';
import { useInterval } from 'utils';

import {
  readCoreData,
  readDeviceData,
  readDeviceEntities,
  writeDeviceValue
} from '../../api/app';
import type { Device, DeviceEntity } from '../main/types';
import { TYPE_NAME, buildItems } from './model';
import type { SysItem } from './model';

export interface SystemData {
  loading: boolean;
  error: string | null;
  items: SysItem[];
  reload: () => Promise<void>;
}

const POLL_MS = 15000;

// Lädt alle Geräte nacheinander (schonend für den ESP32) und aktualisiert regelmäßig.
export const useSystemData = (): SystemData => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    items: SysItem[];
  }>({ loading: true, error: null, items: [] });
  const entities = useRef(new Map<number, readonly DeviceEntity[] | null>());
  const busy = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const core = await readCoreData();
      const devices: Device[] = core.devices.filter((d) => TYPE_NAME[d.t]);
      const all: SysItem[] = [];
      for (const d of devices) {
        if (!entities.current.has(d.id)) {
          try {
            entities.current.set(d.id, await readDeviceEntities(d.id));
          } catch {
            // kein Administrator oder nicht verfügbar: Werte ohne Kurznamen anzeigen
            entities.current.set(d.id, null);
          }
        }
        try {
          const data = await readDeviceData(d.id);
          all.push(...buildItems(d, data.nodes, entities.current.get(d.id) ?? null));
        } catch {
          // ein einzelnes Gerät ohne Daten (z. B. Gateway) darf die Seite nicht blockieren
        }
      }
      if (mounted.current) setState({ loading: false, error: null, items: all });
    } catch (error) {
      if (mounted.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  useInterval(() => {
    if (!document.hidden) void reload();
  }, POLL_MS);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
};

export interface Edits {
  pending: ReadonlyMap<string, unknown>;
  value: (item: SysItem) => unknown;
  set: (item: SysItem, v: unknown) => void;
  discard: () => void;
  apply: (sent: string) => Promise<void>;
  run: (item: SysItem, sent: string) => Promise<void>;
}

// Sammelt Änderungen, bevor sie nach Bestätigung an das Gerät gehen
export const useEdits = (data: SystemData): Edits => {
  const [pending, setPending] = useState<ReadonlyMap<string, unknown>>(new Map());
  const itemsRef = useRef(data.items);
  itemsRef.current = data.items;

  const value = useCallback(
    (item: SysItem) => (pending.has(item.uid) ? pending.get(item.uid) : item.dv.v),
    [pending]
  );

  const set = useCallback((item: SysItem, v: unknown) => {
    setPending((prev) => {
      const next = new Map(prev);
      if (v === item.dv.v) next.delete(item.uid);
      else next.set(item.uid, v);
      return next;
    });
  }, []);

  const send = async (item: SysItem, v: unknown) => {
    await writeDeviceValue({ id: item.devId, c: item.dv.c ?? '', v });
  };

  const apply = useCallback(
    async (sent: string) => {
      try {
        for (const [uid, v] of pending) {
          const item = itemsRef.current.find((i) => i.uid === uid);
          if (item) await send(item, v);
        }
        toast.success(sent);
        setPending(new Map());
        await data.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    },
    [pending, data.reload]
  );

  const run = useCallback(
    async (item: SysItem, sent: string) => {
      try {
        await send(item, item.dv.v ?? '');
        toast.success(sent);
        await data.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    },
    [data]
  );

  const discard = useCallback(() => setPending(new Map()), []);

  return { pending, value, set, discard, apply, run };
};
