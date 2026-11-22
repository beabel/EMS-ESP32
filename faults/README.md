# Fault code packs: specification (draft)

The explanations of a manufacturer's fault codes (what a code means, the possible cause, what to do)
are **not** part of the firmware or the Web UI. They are **packs**: small JSON files that are installed
on the EMS-ESP gateway when needed, from a **source** the user chooses. Anyone can write a pack for
another manufacturer or language and host it anywhere.

Status: implemented in the Web UI and the firmware API (see `src/web/WebFaultPackService.cpp`).

## 1. Terms

| Term | Meaning |
| --- | --- |
| Pack | One file with the explanations for **one brand in one language**, e.g. `buderus.de.json` |
| Source | An address (URL) of an `index.json` that lists packs and where to get them |
| Installed pack | A pack stored on the gateway's file system, available to every browser, also without internet |

Not to be confused with the firmware *Modules* page (licensed code modules); packs only contain data.

## 2. How it works

1. In the Web UI the user picks a source (a default is pre-filled, any other address can be typed in).
2. The Web UI reads the source's `index.json` and lists the packs: brand, language, version, size.
3. The user installs a pack. **The browser** downloads the file and uploads it to the gateway; the gateway
   needs no internet connection and no HTTPS client.
4. The gateway stores the pack. From then on every browser reads it from the gateway.
5. A fault card of a device uses the installed pack of the device's brand, in the Web UI language.

The pack is used for a device only when the brand matches, because the same code can mean something
completely different for another manufacturer. Without a matching pack the raw code is shown.

## 3. Source: `index.json`

```json
{
  "format": 1,
  "name": "Example source",
  "packs": [
    {
      "brand": "buderus",
      "lang": "de",
      "version": "2026-11-22",
      "entries": 1160,
      "size": 357375,
      "file": "buderus.de.json"
    }
  ]
}
```

- `file` is relative to the `index.json` (or an absolute URL, so a source can point to files elsewhere).
- `size` is the size in bytes of the uncompressed file, used to check the free space before installing.
- A source can be a folder in a GitHub repository (`raw.githubusercontent.com` works) or any web server
  that allows cross-origin reads (`Access-Control-Allow-Origin`).

## 4. Pack file

```json
{
  "format": 1,
  "brand": "buderus",
  "lang": "de",
  "version": "2026-11-22",
  "source": "where the explanations come from",
  "license": "license of the text",
  "applies": { "unbranded_with_boiler": true },
  "classes": {
    "14": { "title": "Class title", "meaning": "What the class means", "severity": "warn" }
  },
  "codes": [
    ["H08", 1018, "14", "Title", "Possible cause", "Remedy"]
  ]
}
```

- `brand`: lower case, exactly as the devices report their brand (e.g. `buderus`).
- `lang`: the language code of the Web UI (`en`, `de`, `fr`, `nl`, ...).
- `version`: any string that sorts by date, shown to the user, used to offer updates.
- `source` and `license` are required, so the origin of the texts is always visible.
- `applies.unbranded_with_boiler`: also use the pack for devices without a brand (e.g. a controller) in a
  system whose boiler has this brand.
- `classes`: fault classes with a **severity**: `info`, `service`, `warn`, `error` or `unknown`.
  The severity is part of the pack, so every manufacturer can define its own classes.
- `codes`: `[code, additional code or null, class id, title, cause, remedy]`. The additional code is optional
  because not every manufacturer has one. Entries can be left empty (`""`).
- Texts are plain text only (line breaks as `\n`), never HTML. The Web UI shows them as text.
- Unknown extra fields are ignored, so the format can grow.

## 5. Languages

- One file per brand and language: `buderus.de.json`, `buderus.en.json`, ...; a translator works on one file.
- The Web UI uses the pack in its own language; if there is none, it falls back to `en`, then to any pack
  of that brand.
- A translation has the same `codes` (code and additional code) as the original; only the texts change.
  An entry missing in a translation is shown from the fallback language.
- New languages are added as files; neither the firmware nor the Web UI changes.

## 6. Gateway storage and API (firmware)

Stored in the gateway's file system as `/faults/<brand>.<lang>.json` (the content is gzip compressed) with a
small `.meta` file next to it that holds the version and the number of entries. The browser compresses the
file before the upload, so a pack of 350 KB needs about 45 KB.

| Endpoint | Who | What |
| --- | --- | --- |
| `GET /rest/faultPacks` | signed-in users | list of installed packs (brand, lang, version, entries, size) and the free space |
| `GET /rest/faultPack?brand=..&lang=..` | signed-in users | the pack file |
| `POST /rest/uploadFaultPack?brand=..&lang=..&version=..&entries=..` | admin | upload a pack (multipart form, the compressed file) |
| `POST /rest/deleteFaultPack` `{"brand":..,"lang":..}` | admin | remove a pack |

Rules in the firmware:

- `brand` and `lang` only `a-z`, `0-9`, `-`; the file name is built from them, never taken from the upload.
- Upload size limited (proposal: 256 KB compressed); refused when the free space would drop too low.
- Written to a temporary file and renamed, so a failed upload leaves the old pack intact.
- Nothing is parsed or kept in RAM on the gateway; the file is stored and streamed as is.
- Not part of the settings backup (a pack can be installed again).

Boards: the file system is 2 MB on 16 MB boards and 4 MB on 32 MB boards. On 4 MB boards it is only 64 KB,
so the Web UI does not offer installing packs there.

## 7. Web UI

- *System menu > Maintenance & faults*: when a device with a known brand reports a fault code and no pack is
  installed, a card offers to install one.
- A small manager (sources, installed packs, update, remove) for choosing the source and the language.
- The Web UI validates every downloaded file before uploading it: `format`, `brand`, `lang`, `version`,
  size, the structure of `classes` and `codes`.

## 8. Security

- Packs are data only, shown as text; nothing from a pack is executed or inserted as HTML.
- Installing and removing needs admin rights; the gateway checks size and names itself.
- The source of an installed pack (address and version) is shown to the user.
- Use HTTPS sources where possible; the Web UI warns for plain HTTP sources outside the local network.

## 9. Open points

- Origin and license of the Buderus explanations (`source` / `license` in the pack); to be clarified before
  any repository hosts the file.
- Which source is pre-filled by default (this repository, or none).
- The firmware sends the stored file with `Content-Encoding: gzip`; to be confirmed on a real gateway.
- The free space on real devices (settings and other files share the file system).
- Per-device settings, such as hiding fault cards, are not part of this.
