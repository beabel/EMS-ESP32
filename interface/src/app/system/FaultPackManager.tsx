import { useContext, useState } from 'react';

import { Button, Message } from 'components/ui';
import { AuthenticatedContext } from 'contexts/authentication';
import { useI18nContext } from 'i18n/i18n-react';

import {
  getSource,
  installPack,
  installPackFile,
  loadIndex,
  removePack,
  setSource,
  useFaultPacks
} from './faultPacks';
import type { IndexPack, SourceIndex } from './faultPacks';

const MIN_FREE_AFTER = 32 * 1024; // the gateway keeps this much free

export const brandName = (brand: string): string =>
  brand.charAt(0).toUpperCase() + brand.slice(1);

// Installed fault code packs, and installing more from a source. The gateway stores the packs.
export const FaultPackManager = ({ missing }: { missing: readonly string[] }) => {
  const { LL, locale } = useI18nContext();
  const { me } = useContext(AuthenticatedContext);
  const { info } = useFaultPacks([], locale);
  const [source, setSourceText] = useState(getSource);
  const [index, setIndex] = useState<SourceIndex | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const supported = !!info && info.max_size > 0;
  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const show = () =>
    run('list', async () => {
      const loaded = await loadIndex(source);
      setSource(source.trim());
      setIndex(loaded);
    });

  // a pack is stored compressed, about a sixth of its size; the gateway checks again
  const fits = (p: IndexPack): boolean =>
    !!info && info.fs_free >= Math.ceil(p.size / 4) + MIN_FREE_AFTER;

  const installed = (p: IndexPack) =>
    info?.packs.find((i) => i.brand === p.brand && i.lang === p.lang);

  return (
    <div className="sys-fault">
      <div className="sys-fault-head">{LL.SYS_FAULT_PACK_TITLE()}</div>

      {missing.map((b) => (
        <p key={b}>{LL.SYS_FAULT_PACK_MISSING(brandName(b))}</p>
      ))}

      {info && !supported && (
        <Message level="warning">{LL.SYS_FAULT_PACK_UNSUPPORTED()}</Message>
      )}

      {info?.packs.map((p) => (
        <p
          key={`${p.brand}.${p.lang}`}
          className="sys-sub"
          style={{ margin: '4px 0' }}
        >
          {LL.SYS_FAULT_SOURCE(
            brandName(p.brand),
            p.lang.toUpperCase(),
            p.version ?? '',
            p.entries ?? 0
          )}
          {me.admin && (
            <>
              {' · '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  void run('rm', () => removePack(p.brand, p.lang));
                }}
              >
                {LL.SYS_FAULT_PACK_REMOVE()}
              </a>
            </>
          )}
        </p>
      ))}

      {me.admin && supported && (
        <>
          <p style={{ margin: '12px 0 4px' }}>
            <label className="sys-fault-lbl" htmlFor="fault-file">
              {LL.SYS_FAULT_PACK_FILE()}
            </label>
            <input
              id="fault-file"
              type="file"
              accept=".json,application/json"
              disabled={busy !== ''}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void run('file', () => installPackFile(file));
              }}
            />
          </p>
          <p style={{ margin: '12px 0 4px' }}>
            <label className="sys-fault-lbl" htmlFor="fault-source">
              {LL.SYS_FAULT_PACK_SOURCE()}
            </label>
            <input
              id="fault-source"
              type="url"
              className="sys-fault-source"
              value={source}
              onChange={(e) => setSourceText(e.target.value)}
              style={{ width: '100%' }}
            />
          </p>
          <p>
            <Button
              color="neutral"
              icon="refresh"
              disabled={busy !== '' || source.trim() === ''}
              onClick={() => void show()}
            >
              {LL.SYS_FAULT_PACK_LIST()}
            </Button>
          </p>

          {index && index.packs.length === 0 && <p>{LL.SYS_FAULT_PACK_EMPTY()}</p>}
          {index?.packs.map((p) => {
            const have = installed(p);
            const same = have?.version === p.version;
            return (
              <p key={`${p.brand}.${p.lang}`} style={{ margin: '4px 0' }}>
                {LL.SYS_FAULT_SOURCE(
                  brandName(p.brand),
                  p.lang.toUpperCase(),
                  p.version,
                  p.entries
                )}{' '}
                <Button
                  size="sm"
                  icon="download"
                  disabled={busy !== '' || same || !fits(p)}
                  onClick={() =>
                    void run(`${p.brand}.${p.lang}`, () => installPack(index, p))
                  }
                >
                  {same
                    ? LL.SYS_FAULT_PACK_INSTALLED()
                    : have
                      ? LL.SYS_FAULT_PACK_UPDATE()
                      : LL.SYS_FAULT_PACK_INSTALL()}
                </Button>
                {!fits(p) && !same && <> {LL.SYS_FAULT_PACK_FULL()}</>}
              </p>
            );
          })}
        </>
      )}

      {error && <p>{LL.SYS_FAULT_PACK_ERROR(error)}</p>}
      {busy !== '' && <p className="sys-sub">…</p>}
    </div>
  );
};
