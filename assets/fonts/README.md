# Local reading font

`hub-sans-sc.woff2` is a modified subset of Noto Sans SC, served as the internal/CSS family “Hub Sans”. The original variable font is from https://github.com/google/fonts/tree/main/ofl/notosanssc . Copyright belongs to the upstream authors; the SIL Open Font License 1.1 is included as `OFL.txt`.

The subset contains characters used by the local lessons and UI. Missing future characters fall back to the configured system CJK font. Rebuild with `python scripts/subset_font.py` after adding lesson text. The browser needs no connection to a font service.
