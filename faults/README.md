# Fault code packs

The explanations of a manufacturer's fault codes. They are **not** part of the firmware: the Web UI
downloads the pack of a brand once, when the user asks for it (System menu > Maintenance & faults),
and keeps it in the browser. A device only gets an explanation when its brand matches the pack,
because the same code can mean something else for another manufacturer.

One file per brand, named `<brand>.json` with the brand in lower case as the devices report it
(for example `buderus.json`):

```json
{
  "format": 1,
  "brand": "buderus",
  "version": "2026-11-22",
  "classes": { "14": ["class title", "class meaning"] },
  "codes": [["H08", 1018, "14", "title", "possible cause", "remedy"]]
}
```

- `classes`: fault class id -> [title, meaning]
- `codes`: [code, additional code, class id, title, cause, remedy]

To add a manufacturer, add a `<brand>.json` here. The Web UI needs no change except that the
brand is offered where the devices of that brand show a fault code.
